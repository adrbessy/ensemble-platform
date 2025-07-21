package com.ensemble.dto;

import lombok.Data;

@Data
public class CreateGroupRequest {
    private String name;
    private boolean isPrivate;
}

