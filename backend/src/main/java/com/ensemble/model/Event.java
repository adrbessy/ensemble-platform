
package com.ensemble.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDate date;
    @ManyToOne
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User organizer;
    @ManyToMany
    @JsonIgnoreProperties({"events"}) // pour éviter les boucles infinies si l'entité User a une liste d'événements
    private List<User> participants = new ArrayList<>();

    public Event() {
        // requis par JPA
    }

    public Event(String title, String description, String location, LocalDate date, User organizer) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.date = date;
        this.organizer = organizer;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }

    public List<User> getParticipants() {
        return participants;
    }

    public void setParticipants(List<User> participants) {
        this.participants = participants;
    }
}
