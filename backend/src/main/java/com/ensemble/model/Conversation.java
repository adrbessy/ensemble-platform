package com.ensemble.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String type; // "PRIVATE" ou "GROUP"

    @ManyToMany
    @JoinTable(
            name = "conversation_user",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> participants = new ArrayList<>();


}
