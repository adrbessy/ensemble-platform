// src/main/java/com/ensemble/dto/UserSummaryDTO.java
package com.ensemble.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class UserSummaryDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String photoFilename;
}
