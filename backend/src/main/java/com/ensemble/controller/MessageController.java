package com.ensemble.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/events/{eventId}/messages")
public class MessageController {

    /*@Autowired
    private MessageService messageService;

    @GetMapping
    public List<MessageDto> getMessages(@PathVariable Long eventId, Principal user) {
        return messageService.getMessagesForEvent(eventId, user);
    }

    @PostMapping
    public MessageDto sendMessage(@PathVariable Long eventId,
                                  @RequestBody MessageDto message,
                                  Principal user) {
        return messageService.sendMessage(eventId, message.getContent(), user);
    }*/
}

