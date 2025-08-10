package com.ensemble.controller;

import com.ensemble.dto.ConversationDTO;
import com.ensemble.dto.GroupConversationRequest;
import com.ensemble.model.Conversation;
import com.ensemble.model.Message;
import com.ensemble.repository.MessageRepository;
import com.ensemble.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final MessageRepository messageRepo;

    public ChatController(ChatService chatService, MessageRepository messageRepo) {
        this.chatService = chatService;
        this.messageRepo = messageRepo;
    }

    @PostMapping("/conversations/group")
    public ConversationDTO createGroupConversation(@RequestBody GroupConversationRequest request,
                                                   Principal principal) {
        return chatService.createGroupConversationDTO(principal.getName(), request);
    }

    @GetMapping("/conversations")
    public List<ConversationDTO> getMyConversations(Principal principal) {
        return chatService.getMyConversations(principal.getName());
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public void sendMessageToConversation(@PathVariable Long conversationId, @RequestBody Map<String, String> body, Principal principal) {
        String content = body.get("content");
        chatService.sendMessageToConversation(principal.getName(), conversationId, content);
    }

    @PostMapping("/conversations/{id}/add-members")
    public ResponseEntity<ConversationDTO> addMembersToConversation(@PathVariable Long id,
                                                                    @RequestBody List<Long> userIds) {
        ConversationDTO updated = chatService.addUsersToConversationAndReturnDTO(id, userIds);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/conversations/private")
    public ConversationDTO getOrCreatePrivateConversation(@RequestBody Long otherUserId,
                                                          Principal principal) {
        return chatService.getOrCreatePrivateConversationDTO(principal.getName(), otherUserId);
    }


}
