package com.ensemble.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        String password = "123456";
        String hash = new BCryptPasswordEncoder().encode(password);
        System.out.println("Hash pour '123456' : " + hash);
    }
}