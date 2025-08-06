package com.ensemble.service;

import com.ensemble.dto.ConversationDTO;
import com.ensemble.dto.GroupConversationRequest;
import com.ensemble.dto.MessageDTO;
import com.ensemble.model.Conversation;
import com.ensemble.model.Message;
import com.ensemble.model.User;
import com.ensemble.repository.ConversationRepository;
import com.ensemble.repository.MessageRepository;
import com.ensemble.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ConversationRepository conversationRepo;
    private final UserRepository userRepo;
    private final MessageRepository messageRepo;

    public ChatService(ConversationRepository conversationRepo, UserRepository userRepo, MessageRepository messageRepo) {
        this.conversationRepo = conversationRepo;
        this.userRepo = userRepo;
        this.messageRepo = messageRepo;
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
        User user = userRepo.findByEmail(email).orElseThrow();
        List<Conversation> conversations = conversationRepo.findByParticipantId(user.getId());

        return conversations.stream().map(conv -> {
            ConversationDTO dto = new ConversationDTO();
            dto.setId(conv.getId());
            dto.setType(conv.getType());
            dto.setName(conv.getName());
            dto.setParticipants(conv.getParticipants());

            messageRepo.findTopByConversationOrderByTimestampDesc(conv)
                    .map(MessageDTO::fromEntity)
                    .ifPresent(dto::setLastMessage);

            return dto;
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
        User user1 = userRepo.findByEmail(currentUsername)
                .orElseThrow(() -> new RuntimeException("Utilisateur courant introuvable"));
        User user2 = userRepo.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur cible introuvable"));

        return getOrCreatePrivateConversation(user1, user2);
    }

    public void sendMessageToConversation(String senderEmail, Long conversationId, String content) {
        User sender = userRepo.findByEmail(senderEmail).orElseThrow();

        Conversation conv = conversationRepo.findById(conversationId).orElseThrow();

        if (!conv.getParticipants().contains(sender)) {
            throw new RuntimeException("L'utilisateur n'appartient pas à cette conversation.");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(null); // si pas pertinent ici
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setConversation(conv); // important si Message a un champ conversation

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

}
