package com.ensemble.dto;

import com.ensemble.model.User;
import lombok.Data;

import java.util.List;

@Data
public class ConversationDTO {
    private Long id;
    private String type;
    private String name;
    private List<User> participants;
    private MessageDTO lastMessage;
    // Getters/setters
}
