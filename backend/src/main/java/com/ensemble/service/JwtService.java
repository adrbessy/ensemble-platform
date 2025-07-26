package com.ensemble.service;

import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String SECRET = "zPe1TyqH43vx2JfKYe8NdH7LcAQr8Vmw"; // min 256 bits (32 chars)
    private static final Key key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    @Autowired
    private UserRepository userRepository;

    public String generateToken(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        System.out.println("Photo filename avant création du token : " + user.getPhotoFilename());

        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .claim("id", user.getId())
                .claim("firstName", user.getFirstName())
                .claim("photoFilename", user.getPhotoFilename())
                .claim("birthDate", user.getBirthdate().toString())
                .claim("gender", user.getGender())
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        System.out.println("🔐 TOKEN GÉNÉRÉ : " + token);
        return token;
    }

    // Récupère le username (email) depuis le token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extrait un claim générique
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = SECRET.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()));
    }
}
