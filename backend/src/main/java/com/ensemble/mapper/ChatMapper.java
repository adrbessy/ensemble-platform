// src/main/java/com/ensemble/mapper/ChatMapper.java
package com.ensemble.mapper;

import com.ensemble.dto.*;
import com.ensemble.model.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ChatMapper {

    public UserSummaryDTO toUserSummary(User u) {
        return new UserSummaryDTO(u.getId(), u.getFirstName(), u.getLastName(), u.getPhotoFilename());
    }

    public MessageDTO toMessageDTO(Message m) {
        return new MessageDTO(
                m.getId(),
                m.getContent(),
                m.getTimestamp(),
                toUserSummary(m.getSender())
        );
    }

    public ConversationDTO toConversationDTO(Conversation c) {
        return toConversationDTO(c, null, null);
    }

    public ConversationDTO toConversationDTO(Conversation c, Message lastMsg) {
        return toConversationDTO(c, lastMsg, null);
    }

    public ConversationDTO toConversationDTO(Conversation c, Message lastMsg, Boolean canWrite) {
        var dto = new ConversationDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setType(c.getType());
        dto.setParticipants(
                c.getParticipants().stream().map(this::toUserSummary).toList()
        );
        dto.setEventId(c.getEventId());           // 👈 NEW
        dto.setCanWrite(canWrite);                // null si non calculé

        if (lastMsg != null) {
            dto.setLastMessage(toMessageDTO(lastMsg));
        }
        return dto;
    }
}

