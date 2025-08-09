package com.ensemble.service;

import com.ensemble.model.Conversation;
import com.ensemble.model.MessageReadStatus;
import com.ensemble.model.User;
import com.ensemble.repository.MessageReadStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageReadStatusService {

    @Autowired
    private MessageReadStatusRepository repo;

    public void markAsRead(User user, Conversation conversation, Instant timestamp) {
        // 🛑 Ne pas marquer comme lu un message qu'on a soi-même envoyé
        if (conversation.getLastMessage() != null &&
                conversation.getLastMessage().getSender().getId().equals(user.getId())) {
            return;
        }

        // ✅ Sinon, on met à jour le statut de lecture
        MessageReadStatus status = repo.findByUserAndConversation(user, conversation)
                .orElse(new MessageReadStatus());
        status.setUser(user);
        status.setConversation(conversation);
        status.setLastReadAt(timestamp);
        repo.save(status);
    }


    public Map<Long, Instant> getLastReadTimes(User user) {
        return repo.findByUser(user).stream()
                .collect(Collectors.toMap(
                        s -> s.getConversation().getId(),
                        MessageReadStatus::getLastReadAt
                ));
    }

}
