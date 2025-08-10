package com.ensemble.repository;

import java.util.Optional;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByFriendCode(String code);

    // UserRepository.java
    @Query("""
      select count(u) > 0
      from User u join u.contacts c
      where u.id = :a and c.id = :b
    """)
    boolean hasContact(@Param("a") Long a, @Param("b") Long b);


}
