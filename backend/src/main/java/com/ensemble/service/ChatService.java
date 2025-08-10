package com.ensemble.service;

import com.ensemble.dto.ConversationDTO;
import com.ensemble.dto.GroupConversationRequest;
import com.ensemble.dto.MessageDTO;
import com.ensemble.dto.UserSummaryDTO;
import com.ensemble.mapper.ChatMapper;
import com.ensemble.model.Conversation;
import com.ensemble.model.Message;
import com.ensemble.model.User;
import com.ensemble.repository.ConversationRepository;
import com.ensemble.repository.MessageRepository;
import com.ensemble.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ConversationRepository conversationRepo;
    private final UserRepository userRepo;
    private final MessageRepository messageRepo;
    private final ChatMapper mapper;

    public ChatService(ConversationRepository conversationRepo, UserRepository userRepo, MessageRepository messageRepo,
                       ChatMapper mapper) {
        this.conversationRepo = conversationRepo;
        this.userRepo = userRepo;
        this.messageRepo = messageRepo;
        this.mapper = mapper;
    }

    public Conversation createGroupConversation(GroupConversationRequest request) {
        if (request.getUserIds() == null || request.getUserIds().size() < 2) {
            throw new IllegalArgumentException("Un groupe doit avoir au moins deux membres.");
        }

        List<User> users = userRepo.findAllById(request.getUserIds());

        if (users.size() != request.getUserIds().size()) {
            throw new IllegalArgumentException("Un ou plusieurs utilisateurs sont introuvables.");
        }

        Conversation conversation = new Conversation();
        conversation.setName(request.getName());
        conversation.setType("GROUP"); // ou enum si tu as ConversationType.GROUP
        conversation.setParticipants(users);

        return conversationRepo.save(conversation);
    }

    public List<ConversationDTO> getMyConversations(String email) {
        User me = userRepo.findByEmail(email).orElseThrow();
        List<Conversation> convs = conversationRepo.findByParticipantId(me.getId());

        return convs.stream().map(conv -> {
            boolean canWrite = true;

            if ("PRIVATE".equals(conv.getType())) {
                User other = conv.getParticipants().stream()
                        .filter(u -> !u.getId().equals(me.getId()))
                        .findFirst().orElse(null);
                canWrite = other != null && userRepo.hasContact(me.getId(), other.getId());
            }

            Message last = messageRepo.findTopByConversationOrderByTimestampDesc(conv).orElse(null);
            return mapper.toConversationDTO(conv, last, canWrite);
        }).collect(Collectors.toList());
    }

    public Conversation getOrCreatePrivateConversation(User user1, User user2) {
        List<User> participants = List.of(user1, user2);

        // Vérifie si une conversation privée entre ces deux utilisateurs existe déjà
        return conversationRepo.findPrivateConversationBetweenUsers(user1.getId(), user2.getId())
                .orElseGet(() -> {
                    Conversation conversation = new Conversation();
                    conversation.setType("PRIVATE");
                    conversation.setParticipants(participants);
                    return conversationRepo.save(conversation);
                });
    }

    public Conversation getOrCreatePrivateConversation(String currentUsername, Long otherUserId) {
        User me = userRepo.findByEmail(currentUsername)
                .orElseThrow(() -> new RuntimeException("Utilisateur courant introuvable"));
        User other = userRepo.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur cible introuvable"));

        if (!userRepo.hasContact(me.getId(), other.getId())) {
            throw new AccessDeniedException("Vous n'êtes plus amis.");
        }
        return getOrCreatePrivateConversation(me, other);
    }

    public void sendMessageToConversation(String senderEmail, Long conversationId, String content) {
        User sender = userRepo.findByEmail(senderEmail).orElseThrow();
        Conversation conv = conversationRepo.findById(conversationId).orElseThrow();

        if (!conv.getParticipants().contains(sender)) {
            throw new AccessDeniedException("Vous n'appartenez pas à cette conversation.");
        }

        if ("PRIVATE".equals(conv.getType())) {
            User other = conv.getParticipants().stream()
                    .filter(u -> !u.getId().equals(sender.getId()))
                    .findFirst().orElse(null);

            if (other == null || !userRepo.hasContact(sender.getId(), other.getId())) {
                throw new AccessDeniedException("Conversation verrouillée : vous n'êtes plus amis.");
            }
        }

        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(null);
        message.setContent(content);
        message.setTimestamp(Instant.now()); // UTC vrai
        message.setConversation(conv);

        messageRepo.save(message);
    }

    public void addUsersToConversation(Long conversationId, List<Long> userIds) {
        Conversation conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        for (Long userId : userIds) {
            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            conversation.getParticipants().add(user);
        }

        conversationRepo.save(conversation);
    }

    @Transactional
    public ConversationDTO getOrCreatePrivateConversationDTO(String meEmail, Long otherUserId) {
        Conversation conv = getOrCreatePrivateConversation(meEmail, otherUserId);
        // ⚠️ s'assurer que participants/lastMessage sont initialisés ici si LAZY
        conv.getParticipants().size(); // force init simple
        return mapper.toConversationDTO(conv);
    }

    @Transactional
    public ConversationDTO createGroupConversationDTO(String meEmail, GroupConversationRequest req) {
        Conversation conv = createGroupConversation(req); // ta logique existante
        conv.getParticipants().size();
        return mapper.toConversationDTO(conv);
    }

    @Transactional
    public ConversationDTO addUsersToConversationAndReturnDTO(Long conversationId, List<Long> userIds) {
        Conversation conversation = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation introuvable"));

        List<User> newUsers = userRepo.findAllById(userIds);
        for (User u : newUsers) {
            if (!conversation.getParticipants().contains(u)) {
                conversation.getParticipants().add(u);
            }
        }
        conversationRepo.save(conversation);

        Conversation updated = conversationRepo.findByIdWithParticipantsAndMessages(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation introuvable après ajout"));

        Message last = messageRepo.findTopByConversationOrderByTimestampDesc(updated).orElse(null);

        // canWrite: true pour groupe / privé inchangé (tu peux aussi calculer selon l'utilisateur courant)
        boolean canWrite = !"PRIVATE".equals(updated.getType());
        return mapper.toConversationDTO(updated, last, canWrite);
    }


}
