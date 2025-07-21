package com.ensemble.service;

import com.ensemble.dto.*;
import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

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
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));

        String hashedPassword = user.getPassword();

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

    public ResponseEntity<?> registerForm(String firstName, String lastName, String email, String password,
                                          LocalDate birthdate, String gender, MultipartFile photo) {

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Un utilisateur avec cet email existe déjà.");
        }

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setBirthdate(birthdate);
        user.setGender(gender);

        if (photo != null && !photo.isEmpty()) {
            try {
                String filename = UUID.randomUUID() + "_" + photo.getOriginalFilename();
                Path uploadPath = Paths.get("uploads/photos");

                // Ces deux lignes doivent être dans le try
                Files.createDirectories(uploadPath);
                photo.transferTo(uploadPath.resolve(filename));

                user.setPhotoFilename(filename);
            } catch (IOException e) {
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors de l'upload de la photo.");
            }
        }

        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse("Utilisateur inscrit avec succès !"));
    }

    public ResponseEntity<?> register(RegisterRequest request) {
        // Vérifie si l'utilisateur existe déjà
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Un utilisateur avec cet email existe déjà.");
        }
        // Crée et enregistre le nouvel utilisateur
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setFirstName(request.getFirstName());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setUsername(request.getEmail());
        System.out.println("Avant save: " + newUser.getEmail());
        userRepository.save(newUser);
        System.out.println("Après save");
        return ResponseEntity.ok(new MessageResponse("Inscription réussie"));
    }

    public Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Supprime "Bearer "
            String email = jwtService.extractUsername(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
            return user.getId();
        }
        throw new RuntimeException("Token invalide ou manquant");
    }

}
