package com.ensemble.controller;

import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import com.ensemble.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // ← autorise les appels du front
public class UserController {

    private final UserRepository userRepo;
    private final AuthService authService;

    public UserController(UserRepository userRepo, AuthService authService) {
        this.userRepo = userRepo;
        this.authService = authService;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        System.out.println("Reçu : " + user); // ou logger.info(...)
        User savedUser = userRepo.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @GetMapping("/contacts")
    public List<User> getContacts() {
        User currentUser = authService.getCurrentUser();
        return new ArrayList<>(currentUser.getContacts());
    }

}