
package com.ensemble.controller;

import com.ensemble.dto.EventDTO;
import com.ensemble.model.Event;
import com.ensemble.model.EventVisibility;
import com.ensemble.model.Group;
import com.ensemble.model.User;
import com.ensemble.repository.GroupRepository;
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

    private final GroupRepository groupRepository;
    public EventController(EventService service, UserRepository userRepo, AuthService authService, GroupRepository groupRepository) {
        this.eventService = service;
        this.userRepo = userRepo;
        this.authService = authService;
        this.groupRepository = groupRepository;
    }

    @GetMapping
    public List<Event> getAll() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Si utilisateur non connecté → renvoyer uniquement les événements publics
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return eventService.findByVisibility(EventVisibility.PUBLIC);
        }

        String email = auth.getName();
        User user = userRepo.findByEmail(email).orElseThrow();
        List<Group> userGroups = groupRepository.findByMembers_Id(user.getId());

        return eventService.findVisibleEvents(userGroups);
    }


    @PostMapping
    public Event create(@RequestBody EventDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Event event = new Event(dto.title, dto.description, dto.location, dto.date, user, dto.tag);
        event.getParticipants().add(user); // L'organisateur est aussi inscrit
        event.setVisibility(dto.getVisibility());

        if (dto.getVisibility() == EventVisibility.GROUP && dto.getGroupId() != null) {
            Group group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Groupe introuvable"));
            event.setGroup(group);
        }

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
