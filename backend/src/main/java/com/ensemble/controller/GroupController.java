package com.ensemble.controller;

import com.ensemble.dto.CreateGroupRequest;
import com.ensemble.model.Group;
import com.ensemble.model.User;
import com.ensemble.repository.GroupRepository;
import com.ensemble.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody CreateGroupRequest request, @AuthenticationPrincipal User currentUser) {
        Group group = new Group();
        group.setName(request.getName());
        group.setOwner(currentUser);
        group.getMembers().add(currentUser);
        group.setPrivate(request.isPrivate());

        return ResponseEntity.ok(groupRepository.save(group));
    }

    @GetMapping("/mine")
    public List<Group> getMyGroups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName(); // email du token
        User user = userRepository.findByEmail(email).orElseThrow();
        return groupRepository.findByMembers_Id(user.getId());
    }

    @PostMapping("/{groupId}/add")
    public ResponseEntity<?> addMember(@PathVariable Long groupId, @RequestParam Long userId) {
        Group group = groupRepository.findById(groupId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        group.getMembers().add(user);
        groupRepository.save(group);
        return ResponseEntity.ok().build();
    }
}

