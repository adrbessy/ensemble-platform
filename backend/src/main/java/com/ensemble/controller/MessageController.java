package com.ensemble.controller;

import com.ensemble.model.Message;
import com.ensemble.model.User;
import com.ensemble.repository.MessageRepository;
import com.ensemble.repository.UserRepository;
import com.ensemble.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageRepository messageRepo;
    private final AuthService authService;
    private final UserRepository userRepo;

    public MessageController(MessageRepository messageRepo, AuthService authService, UserRepository userRepo) {
        this.messageRepo = messageRepo;
        this.authService = authService;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> body) {
        User sender = authService.getCurrentUser();
        User recipient = userRepo.findById(Long.parseLong(body.get("recipientId"))).orElse(null);

        if (recipient == null) {
            return ResponseEntity.badRequest().body("Destinataire introuvable");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(body.get("content"));
        messageRepo.save(message);

        return ResponseEntity.ok(message);
    }

    @GetMapping("/with/{friendId}")
    public List<Message> getMessages(@PathVariable Long friendId) {
        User current = authService.getCurrentUser();
        User friend = userRepo.findById(friendId).orElse(null);

        if (friend == null) return List.of();

        return messageRepo.findBySenderAndRecipientOrRecipientAndSender(current, friend, current, friend);
    }
}


