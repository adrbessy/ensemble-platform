package com.ensemble.controller;

import com.ensemble.model.Conversation;
import com.ensemble.model.User;
import com.ensemble.repository.ConversationRepository;
import com.ensemble.service.MessageReadStatusService;
import com.ensemble.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/read-status")
public class MessageReadStatusController {

    @Autowired
    private MessageReadStatusService service;

    @Autowired
    private UserDetailsServiceImpl userService;

    @Autowired
    private ConversationRepository conversationRepo;

    @PostMapping("/{conversationId}")
    public ResponseEntity<?> markAsRead(@PathVariable Long conversationId,
                                        @RequestBody Map<String, String> body) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Conversation conv = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Instant timestamp = Instant.parse(body.get("timestamp"));
        service.markAsRead(currentUser, conv, timestamp);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public Map<Long, Instant> getAllReadStatus() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        return service.getLastReadTimes(currentUser);
    }
}
