package com.ensemble.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
public class PingController {

    @GetMapping("/")
    public String ping() {
        return "Backend is alive!";
    }
}
