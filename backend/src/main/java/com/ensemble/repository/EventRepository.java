
package com.ensemble.repository;

import com.ensemble.model.Event;
import com.ensemble.model.EventVisibility;
import com.ensemble.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByVisibility(EventVisibility visibility);

    List<Event> findByVisibilityOrGroupIn(EventVisibility visibility, List<Group> groups);

}
