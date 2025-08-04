
package com.ensemble.service;

import com.ensemble.model.Event;
import com.ensemble.model.EventVisibility;
import com.ensemble.model.Group;
import com.ensemble.model.User;
import com.ensemble.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {
    private final EventRepository eventRepository;
    public EventService(EventRepository repository) {
        this.eventRepository = repository;
    }
    public List<Event> findAll() {
        return eventRepository.findAll();
    }
    public Event save(Event event) {
        return eventRepository.save(event);
    }
    public void delete(Long id) {
        eventRepository.deleteById(id);
    }

    @Transactional
    public void participate(Long eventId, User user) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));

        if (!event.getParticipants().contains(user)) {
            event.getParticipants().add(user);
            eventRepository.save(event);
        }
    }

    public void withdrawParticipant(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé"));

        event.getParticipants().removeIf(user -> user.getId().equals(userId));

        if (event.getParticipants().isEmpty()) {
            // 🔥 Supprimer l'événement si plus aucun participant
            eventRepository.delete(event);
        } else {
            eventRepository.save(event);
        }
    }


    public List<Event> findByVisibility(EventVisibility visibility) {
        return eventRepository.findByVisibility(visibility);
    }

    public List<Event> findVisibleEvents(User user, List<Group> userGroups) {
        List<Event> allEvents = eventRepository.findAll();

        return allEvents.stream()
                .filter(event -> {
                    // ✅ Toujours visible si public
                    if (event.getVisibility() == EventVisibility.PUBLIC) return true;

                    // ✅ Visible si créateur
                    if (event.getOrganizer().getId().equals(user.getId())) return true;

                    // ✅ Visible si groupe et utilisateur membre du groupe
                    if (event.getVisibility() == EventVisibility.GROUP &&
                            event.getGroup() != null &&
                            userGroups.stream().anyMatch(g -> g.getId().equals(event.getGroup().getId()))) {
                        return true;
                    }

                    if (event.getVisibility() == EventVisibility.FRIENDS_ONLY &&
                            event.getOrganizer().getContacts().contains(user)) {
                        return true;
                    }

                    // ❌ Sinon, non visible
                    return false;
                })
                .collect(Collectors.toList());
    }

    public Event findByIdVisibleToUser(Long id, User user) {
        Event event = eventRepository.findById(id).orElseThrow();

        if (event.getVisibility() == EventVisibility.PUBLIC) return event;

        if (event.getVisibility() == EventVisibility.FRIENDS_ONLY &&
                user.getContacts().contains(event.getOrganizer())) {
            return event;
        }

        if (event.getVisibility() == EventVisibility.GROUP &&
                event.getGroup() != null &&
                event.getGroup().getMembers().contains(user)) {
            return event;
        }

        if (event.getVisibility() == EventVisibility.CUSTOM &&
                event.getInvitedUsers().contains(user)) {
            return event;
        }

        if (event.getOrganizer().getId().equals(user.getId())) {
            return event;
        }

        System.out.println("⚠️ Utilisateur non autorisé : " + user.getEmail());
        System.out.println("Visibilité de l'événement : " + event.getVisibility());
        System.out.println("Organisateur : " + event.getOrganizer().getEmail());
        throw new RuntimeException("Non autorisé à voir cet événement");
    }

    public List<Event> searchEvents(Integer minAge, Integer maxAge /* autres filtres */) {
        LocalDate today = LocalDate.now();

        LocalDate minBirthdate = null;
        LocalDate maxBirthdate = null;

        if (minAge != null) {
            maxBirthdate = today.minusYears(minAge).plusDays(1); // inclus jusqu'à la veille de l'anniversaire suivant
        }

        if (maxAge != null) {
            minBirthdate = today.minusYears(maxAge + 1).plusDays(1); // inclus ceux qui ont au moins maxAge ans
        }

        return eventRepository.findEventsWhereAllParticipantsAreInRange(minBirthdate, maxBirthdate);
    }



}
