package com.ensemble.dto;

import com.ensemble.model.EventVisibility;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EventDTO {
    public String title;
    public String description;
    private String placeName;
    public String location;
    public LocalDate date;
    private String startTime;
    private String endTime;
    private int minParticipants;
    private int maxParticipants;
    private Integer minAge;
    private Integer maxAge;
    private String genderRequirement;
    public Long organizerId;
    public String tag;

    private EventVisibility visibility;
    private Long groupId;
}