package com.ensemble.repository;

import com.ensemble.model.Conversation;
import com.ensemble.model.Message;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderAndRecipientOrRecipientAndSender(User sender, User recipient, User recipient2, User sender2);
    List<Message> findByConversationIdOrderByTimestampAsc(Long conversationId);
    Optional<Message> findTopByConversationOrderByTimestampDesc(Conversation conversation);

}
