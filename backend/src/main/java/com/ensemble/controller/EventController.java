
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

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


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Event create(
            @RequestPart("event") EventDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Event event = new Event(
                dto.getTitle(),
                dto.getDescription(),
                dto.getLocation(),
                dto.getDate(),
                user,
                dto.getTag()
        );

        event.setPlaceName(dto.getPlaceName());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setMinParticipants(dto.getMinParticipants());
        event.setMaxParticipants(dto.getMaxParticipants());
        event.setMinAge(dto.getMinAge());
        event.setMaxAge(dto.getMaxAge());
        event.setGenderRequirement(dto.getGenderRequirement());

        event.getParticipants().add(user);
        event.setVisibility(dto.getVisibility());

        if (dto.getVisibility() == EventVisibility.GROUP && dto.getGroupId() != null) {
            Group group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Groupe introuvable"));
            event.setGroup(group);
        }

        // ⬇️ Traitement de l'image si elle est présente
        if (image != null && !image.isEmpty()) {
            String imageName = UUID.randomUUID() + "_" + image.getOriginalFilename();
            Path imagePath = Paths.get("uploads/images/" + imageName);
            try {
                Files.createDirectories(imagePath.getParent());
                image.transferTo(imagePath);
                event.setImageUrl("/uploads/images/" + imageName); // si tu veux l’afficher plus tard
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l’enregistrement de l’image", e);
            }
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
