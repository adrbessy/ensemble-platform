
package com.ensemble.service;

import com.ensemble.model.Event;
import com.ensemble.model.EventVisibility;
import com.ensemble.model.Group;
import com.ensemble.model.User;
import com.ensemble.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        eventRepository.save(event);
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

                    // ✅ Visible si FRIENDS_ONLY et l’organisateur est un ami (à implémenter si nécessaire)
                    if (event.getVisibility() == EventVisibility.FRIENDS_ONLY) {
                        return true; // ou une logique réelle de friendship
                    }

                    // ❌ Sinon, non visible
                    return false;
                })
                .collect(Collectors.toList());
    }


}
