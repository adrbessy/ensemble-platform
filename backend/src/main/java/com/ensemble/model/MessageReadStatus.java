package com.ensemble.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "message_read_status")
@Data
public class MessageReadStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Conversation conversation;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    // Getters & setters
}
