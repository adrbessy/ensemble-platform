package com.ensemble.repository;

import com.ensemble.dto.FriendRequest;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByRecipient(User recipient);

    Optional<FriendRequest> findBySenderAndRecipient(User sender, User recipient);

    List<FriendRequest> findBySender(User sender);
}
