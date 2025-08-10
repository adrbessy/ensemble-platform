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

    public static UserSummaryDTO toUserSummary(User u) {
        return new UserSummaryDTO(u.getId(), u.getFirstName(), u.getLastName(), u.getPhotoFilename());
    }

    public static ConversationDTO toConversationDTO(Conversation c) {
        List<UserSummaryDTO> parts = c.getParticipants()
                .stream().map(ChatMapper::toUserSummary).collect(Collectors.toList());
        return new ConversationDTO(c.getId(), c.getName(), c.getType(), parts, null);
    }

    public static MessageDTO toMessageDTO(Message m) {
        // If your LocalDateTime is stored as UTC in DB, convert with UTC:
        Instant ts = m.getTimestamp()
                .atOffset(ZoneOffset.UTC)  // LocalDateTime -> OffsetDateTime (UTC)
                .toInstant();

        return new MessageDTO(
                m.getId(),
                m.getContent(),
                ts,
                toUserSummary(m.getSender())
        );
    }

    public static List<MessageDTO> toMessageDTOs(List<Message> msgs) {
        return msgs.stream().map(ChatMapper::toMessageDTO).collect(Collectors.toList());
    }
}
