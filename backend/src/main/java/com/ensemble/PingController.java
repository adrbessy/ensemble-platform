package com.ensemble;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {
    @GetMapping("/ping")
    public String ping() {
        System.out.println("PING called");
        return "pong";
    }
}
