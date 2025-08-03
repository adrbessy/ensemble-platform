package com.ensemble.repository;

import com.ensemble.model.Message;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderAndRecipientOrRecipientAndSender(User sender, User recipient, User recipient2, User sender2);
}
