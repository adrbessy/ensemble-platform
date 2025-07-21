package com.ensemble.controller;

import com.ensemble.dto.AuthResponse;
import com.ensemble.dto.LoginRequest;
import com.ensemble.dto.MessageResponse;
import com.ensemble.model.User;
import com.ensemble.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ensemble.dto.RegisterRequest;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        System.out.println("LOGIN ATTEMPT"); // 👈 doit apparaître dans la console
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("birthdate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate birthdate,
            @RequestParam("gender") String gender,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) {
        return authService.registerForm(firstName, lastName, email, password, birthdate, gender, photo);
    }

}
