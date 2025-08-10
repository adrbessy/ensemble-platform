package com.ensemble.repository;

import com.ensemble.model.Conversation;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p.id = :userId")
    List<Conversation> findByParticipantId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c " +
            "JOIN c.participants p1 " +
            "JOIN c.participants p2 " +
            "WHERE c.type = 'PRIVATE' " +
            "AND p1.id = :user1Id AND p2.id = :user2Id")
    Optional<Conversation> findPrivateConversationBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query("""
       select distinct c from Conversation c
       left join fetch c.participants p
       where c.id = :id
    """)
    Optional<Conversation> findByIdWithParticipantsAndMessages(@Param("id") Long id);


}
