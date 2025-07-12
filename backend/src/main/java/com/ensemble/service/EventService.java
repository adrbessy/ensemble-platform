
package com.ensemble.service;

import com.ensemble.model.Event;
import com.ensemble.model.User;
import com.ensemble.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventService {

    private final EventRepository repository;

    public EventService(EventRepository repository) {
        this.repository = repository;
    }

    public List<Event> findAll() {
        return repository.findAll();
    }

    public Event save(Event event) {
        return repository.save(event);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public void participate(Long eventId, User user) {
        Event event = repository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement introuvable"));

        if (!event.getParticipants().contains(user)) {
            event.getParticipants().add(user);
            repository.save(event);
        }
    }
}
