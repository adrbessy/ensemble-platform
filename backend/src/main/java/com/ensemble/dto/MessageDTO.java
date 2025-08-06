package com.ensemble.dto;

import com.ensemble.model.Message;
import lombok.Data;

@Data
public class MessageDTO {
    private Long id;
    private String content;
    private String timestamp;
    private Long senderId;

    public static MessageDTO fromEntity(Message msg) {
        MessageDTO dto = new MessageDTO();
        dto.setId(msg.getId());
        dto.setContent(msg.getContent());
        dto.setTimestamp(msg.getTimestamp().toString());
        dto.setSenderId(msg.getSender().getId());
        return dto;
    }
    // Getters/setters
}