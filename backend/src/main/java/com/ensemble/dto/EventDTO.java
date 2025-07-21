package com.ensemble.dto;

import com.ensemble.model.EventVisibility;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EventDTO {
    public String title;
    public String description;
    public String location;
    public LocalDate date;
    public Long organizerId;
    public String tag;

    private EventVisibility visibility;
    private Long groupId;
}