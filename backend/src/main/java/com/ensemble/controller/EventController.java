
package com.ensemble.controller;

import com.ensemble.dto.EventDTO;
import com.ensemble.model.Event;
import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import com.ensemble.service.AuthService;
import com.ensemble.service.EventService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {
    private final EventService eventService;
    @Autowired
    private final UserRepository userRepo;
    private final AuthService authService;
    public EventController(EventService service, UserRepository userRepo, AuthService authService) {
        this.eventService = service;
        this.userRepo = userRepo;
        this.authService = authService;
    }

    @GetMapping
    public List<Event> getAll() {
        return eventService.findAll();
    }

    @PostMapping
    public Event create(@RequestBody EventDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Event event = new Event(dto.title, dto.description, dto.location, dto.date, user);
        event.getParticipants().add(user); // L'organisateur est aussi inscrit
        return eventService.save(event);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        eventService.delete(id);
    }

    @PostMapping("/{id}/participate")
    public ResponseEntity<Void> participate(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); // ou username selon ton token

        System.out.println("Email connecté : " + email); // <-- ICI

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé"));

        eventService.participate(id, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{eventId}/participants")
    public ResponseEntity<?> withdraw(@PathVariable Long eventId, HttpServletRequest request) {
        Long userId = authService.getUserIdFromRequest(request);
        eventService.withdrawParticipant(eventId, userId);
        return ResponseEntity.ok().build();
    }

}
