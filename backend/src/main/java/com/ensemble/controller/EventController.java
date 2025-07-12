
package com.ensemble.controller;

import com.ensemble.dto.EventDTO;
import com.ensemble.model.Event;
import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import com.ensemble.service.EventService;
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

    private final EventService service;
    @Autowired
    private final UserRepository userRepo;

    public EventController(EventService service, UserRepository userRepo) {
        this.service = service;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<Event> getAll() {
        return service.findAll();
    }

    @PostMapping
    public Event create(@RequestBody EventDTO dto) {
        User user = userRepo.findById(dto.organizerId).orElseThrow();
        Event event = new Event(dto.title, dto.description, dto.location, dto.date, user);
        return service.save(event);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/participate")
    public ResponseEntity<Void> participate(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); // ou username selon ton token

        System.out.println("Email connecté : " + email); // <-- ICI

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé"));

        service.participate(id, user);
        return ResponseEntity.ok().build();
    }

}
