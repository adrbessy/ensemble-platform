package com.ensemble.controller;

import ch.qos.logback.core.net.SyslogOutputStream;
import com.ensemble.dto.FriendRequest;
import com.ensemble.dto.UserDto;
import com.ensemble.model.Event;
import com.ensemble.model.User;
import com.ensemble.repository.EventRepository;
import com.ensemble.repository.FriendRequestRepository;
import com.ensemble.repository.UserRepository;
import com.ensemble.service.AuthService;
import com.ensemble.service.FileStorageService;
import com.ensemble.service.UserDetailsServiceImpl;
import org.hibernate.boot.model.source.spi.SingularAttributeSourceToOne;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // ← autorise les appels du front
public class UserController {

    private final UserRepository userRepo;
    private final AuthService authService;
    private final EventRepository eventRepo;
    private final FriendRequestRepository friendRequestRepo;
    private final UserDetailsServiceImpl  userService;
    private final FileStorageService fileStorageService;

    public UserController(UserRepository userRepo, AuthService authService, EventRepository eventRepo,
                          FriendRequestRepository friendRequestRepo, UserDetailsServiceImpl  userService,
                          FileStorageService fileStorageService) {
        this.userRepo = userRepo;
        this.authService = authService;
        this.eventRepo = eventRepo;
        this.friendRequestRepo = friendRequestRepo;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(new UserDto(currentUser)); // ✅
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateCurrentUser(@RequestBody Map<String, Object> updates,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("firstName")) {
            user.setFirstName((String) updates.get("firstName"));
        }
        if (updates.containsKey("lastName")) {
            user.setLastName((String) updates.get("lastName"));
        }
        if (updates.containsKey("birthdate")) {
            user.setBirthdate(LocalDate.parse((String) updates.get("birthdate")));
        }
        if (updates.containsKey("gender")) {
            user.setGender((String) updates.get("gender"));
        }

        userService.save(user);
        return ResponseEntity.ok(user);
    }


    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        System.out.println("Reçu : " + user);

        // ⚠️ Sauvegarde d'abord pour obtenir l'ID (généré par la base)
        User savedUser = userRepo.save(user);

        // 🔐 Génération du code ami
        String friendCode = generateFriendCode(savedUser.getId());
        savedUser.setFriendCode(friendCode);
        savedUser = userRepo.save(savedUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    private String generateFriendCode(Long userId) {
        String random = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return userId + "-" + random;
    }

    @PostMapping("/generate-friend-code")
    public ResponseEntity<?> generateFriendCodeForMe() {
        User currentUser = authService.getCurrentUser();

        if (currentUser.getFriendCode() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le code existe déjà."));
        }

        String code = generateFriendCode(currentUser.getId());
        currentUser.setFriendCode(code);
        userRepo.save(currentUser);

        return ResponseEntity.ok(Map.of("message", "Code ami généré.", "code", code));
    }


    @PostMapping("/add-friend")
    public ResponseEntity<?> addFriendByCode(@RequestBody Map<String, String> body) {
        String code = body.get("friendCode");

        User currentUser = authService.getCurrentUser();
        System.out.println("code : " + code);
        User friend = userRepo.findByFriendCode(code).orElse(null);

        if (friend == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable"));
        }

        if (friend.equals(currentUser)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tu ne peux pas t’ajouter toi-même !"));
        }

        currentUser.getContacts().add(friend);
        friend.getContacts().add(currentUser); // réciproque

        userRepo.save(currentUser);
        userRepo.save(friend);

        return ResponseEntity.ok(Map.of("message", "Ami ajouté avec succès !"));
    }



    @GetMapping("/contacts")
    public List<User> getContacts() {
        User currentUser = authService.getCurrentUser();
        return new ArrayList<>(currentUser.getContacts());
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount() {
        User currentUser = authService.getCurrentUser();

        // 1. Supprimer la participation à d'autres événements
        List<Event> eventsAsParticipant = eventRepo.findAllByParticipantsContaining(currentUser);
        for (Event event : eventsAsParticipant) {
            event.getParticipants().remove(currentUser);
        }
        eventRepo.saveAll(eventsAsParticipant);

        // 2. Supprimer les événements qu'il a créés
        List<Event> eventsAsOrganizer = eventRepo.findAllByOrganizer(currentUser);
        eventRepo.deleteAll(eventsAsOrganizer);

        // 3. Supprimer des contacts
        for (User contact : currentUser.getContacts()) {
            contact.getContacts().remove(currentUser);
        }

        // 4. Vider les groupes
        currentUser.getGroups().clear();

        // 5. Supprimer l'utilisateur
        userRepo.delete(currentUser);

        return ResponseEntity.ok(Map.of("message", "Compte supprimé avec succès."));
    }

    @PostMapping("/send-friend-request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> body) {
        String code = body.get("friendCode");
        User sender = authService.getCurrentUser();
        User recipient = userRepo.findByFriendCode(code).orElse(null);

        if (recipient == null || sender.equals(recipient)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Demande invalide"));
        }

        boolean alreadySent = friendRequestRepo.findBySenderAndRecipient(sender, recipient).isPresent();
        if (alreadySent) {
            return ResponseEntity.badRequest().body(Map.of("error", "Demande déjà envoyée"));
        }

        FriendRequest request = new FriendRequest();
        request.setSender(sender);
        request.setRecipient(recipient);
        friendRequestRepo.save(request);

        return ResponseEntity.ok(Map.of("message", "Demande envoyée"));
    }

    @GetMapping("/friend-requests")
    public ResponseEntity<List<FriendRequest>> getReceivedRequests() {
        User currentUser = authService.getCurrentUser();
        List<FriendRequest> requests = friendRequestRepo.findByRecipient(currentUser);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/accept-friend-request")
    public ResponseEntity<?> acceptFriendRequest(@RequestBody Map<String, Long> body) {
        Long requestId = body.get("requestId");
        User currentUser = authService.getCurrentUser();

        FriendRequest request = friendRequestRepo.findById(requestId).orElse(null);
        if (request == null || !request.getRecipient().equals(currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Demande introuvable"));
        }

        request.setAccepted(true);
        friendRequestRepo.save(request);

        // ✅ Ajoute via méthode utilitaire
        User sender = request.getSender();
        currentUser.addContact(sender);

        userRepo.save(currentUser);
        userRepo.save(sender); // optionnel mais sûr

        return ResponseEntity.ok(Map.of("message", "Demande acceptée"));
    }


    @DeleteMapping("/friend-request/{id}")
    public ResponseEntity<?> deleteFriendRequest(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        FriendRequest request = friendRequestRepo.findById(id).orElse(null);

        if (request == null || !request.getRecipient().equals(currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Demande introuvable"));
        }

        friendRequestRepo.delete(request);
        return ResponseEntity.ok(Map.of("message", "Demande supprimée"));
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<User> uploadProfilePhoto(@RequestParam("file") MultipartFile file,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String filename = fileStorageService.storeFile(file);
        user.setPhotoFilename(filename);
        userService.save(user);

        return ResponseEntity.ok(user); // ← 🟢 Doit renvoyer user avec photoFilename
    }

    @DeleteMapping("/contacts/{otherUserId}")
    public ResponseEntity<?> removeFriend(@PathVariable Long otherUserId) {
        User me = authService.getCurrentUser();
        User other = userRepo.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // retire la relation dans les deux sens
        me.getContacts().remove(other);
        other.getContacts().remove(me);

        userRepo.save(me);
        userRepo.save(other);

        // (optionnel) nettoyer les FriendRequest associées
        // friendRequestRepo.deleteBetween(me, other);  // voir plus bas

        return ResponseEntity.noContent().build(); // 204
    }


}