package com.ensemble.repository;

import com.ensemble.model.Conversation;
import com.ensemble.model.MessageReadStatus;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageReadStatusRepository extends JpaRepository<MessageReadStatus, Long> {
    Optional<MessageReadStatus> findByUserAndConversation(User user, Conversation conversation);
    List<MessageReadStatus> findByUser(User user);
}
