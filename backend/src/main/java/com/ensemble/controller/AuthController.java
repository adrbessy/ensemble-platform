package com.ensemble.controller;

import com.ensemble.dto.AuthResponse;
import com.ensemble.dto.LoginRequest;
import com.ensemble.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
