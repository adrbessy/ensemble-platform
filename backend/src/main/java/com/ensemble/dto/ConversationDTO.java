package com.ensemble.dto;

import com.ensemble.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ConversationDTO {
    private Long id;
    private String name;
    private String type; // "PRIVATE" | "GROUP"
    private List<UserSummaryDTO> participants;
    private MessageDTO lastMessage;
    private Boolean canWrite;

}
