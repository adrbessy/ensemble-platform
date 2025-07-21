package com.ensemble.repository;

import com.ensemble.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByMembers_Id(Long userId);
    List<Group> findByOwner_Id(Long ownerId);
}

