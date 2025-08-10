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

    public ConversationDTO toConversationDTO(Conversation c) {
        return toConversationDTO(c, null);
    }

    public MessageDTO toMessageDTO(Message m) {
        return new MessageDTO(
                m.getId(),
                m.getContent(),
                m.getTimestamp(),            // déjà un Instant UTC
                toUserSummary(m.getSender())
        );
    }

    public List<MessageDTO> toMessageDTOs(List<Message> msgs) {
        return msgs.stream().map(this::toMessageDTO).collect(Collectors.toList());
    }

    public ConversationDTO toConversationDTO(Conversation c, Message lastMsg) {
        List<UserSummaryDTO> parts = c.getParticipants().stream()
                .map(this::toUserSummary).toList();

        ConversationDTO dto = new ConversationDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setType(c.getType());
        dto.setParticipants(parts);
        dto.setCanWrite(null);
        if (lastMsg != null) {
            dto.setLastMessage(toMessageDTO(lastMsg));
        }
        return dto;
    }

    // ChatMapper.java
    public ConversationDTO toConversationDTO(Conversation c, Message last, boolean canWrite) {
        List<UserSummaryDTO> parts = c.getParticipants()
                .stream().map(this::toUserSummary).collect(Collectors.toList());

        ConversationDTO dto = new ConversationDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setType(c.getType());
        dto.setParticipants(parts);
        if (last != null) {
            dto.setLastMessage(toMessageDTO(last));
        }
        // ajoute la propriété si elle n’existe pas encore dans ton DTO
        // (sinon ajoute-la : private Boolean canWrite;)
        try { // si tu as déjà le champ
            var f = ConversationDTO.class.getDeclaredField("canWrite");
            f.setAccessible(true);
            f.set(dto, canWrite);
        } catch (Exception ignore) {}
        return dto;
    }

}
