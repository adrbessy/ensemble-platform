package com.ensemble.dto;

import com.ensemble.model.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.ZoneId;

@Data @AllArgsConstructor @NoArgsConstructor
public class MessageDTO {
    private Long id;
    private String content;
    private Instant timestamp;
    private UserSummaryDTO sender;

    public static MessageDTO fromMessage(Message m) {
        // si m.getTimestamp() est LocalDateTime en base
        Instant ts = m.getTimestamp().atZone(ZoneId.systemDefault()).toInstant();
        return new MessageDTO(
                m.getId(),
                m.getContent(),
                ts,
                new UserSummaryDTO(
                        m.getSender().getId(),
                        m.getSender().getFirstName(),
                        m.getSender().getLastName(),
                        m.getSender().getPhotoFilename()
                )
        );
    }
}
