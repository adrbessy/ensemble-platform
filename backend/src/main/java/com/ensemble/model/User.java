package com.ensemble.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String email;

    @OneToMany(mappedBy = "organizer")
    @JsonBackReference // pour éviter les boucles infinies
    private List<Event> events;

    // getters, setters, constructeur vide
    public User() {
    }
    public User(String username, String email) {
        this.username = username;
        this.email = email;
    }

    // Obligatoire :
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
