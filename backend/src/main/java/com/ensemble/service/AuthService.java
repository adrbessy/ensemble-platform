package com.ensemble.service;

import com.ensemble.dto.AuthResponse;
import com.ensemble.dto.LoginRequest;
import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    @Lazy
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder; // Tu l’as sûrement déjà

    @Autowired
    private UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        System.out.println("LOGIN ATTEMPT");
        // Pour debug : juste temporairement
        String rawPassword = request.getPassword();
        String hashedPassword = userRepository.findByEmail(request.getEmail())
                .orElseThrow().getPassword();

        boolean matches = passwordEncoder.matches(rawPassword, hashedPassword);
        System.out.println("Password matches? " + matches); // Devrait afficher true

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String email = userDetails.getUsername();
        String jwt = jwtService.generateToken(userDetails);
        return new AuthResponse(jwt);
    }

}
