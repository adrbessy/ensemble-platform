package com.ensemble.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {

    private static final String SECRET = "zPe1TyqH43vx2JfKYe8NdH7LcAQr8Vmw"; // min 256 bits (32 chars)

    private static final Key key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
