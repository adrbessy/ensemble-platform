
package com.ensemble.repository;

import com.ensemble.model.Event;
import com.ensemble.model.EventVisibility;
import com.ensemble.model.Group;
import com.ensemble.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByVisibility(EventVisibility visibility);

    List<Event> findByVisibilityOrGroupIn(EventVisibility visibility, List<Group> groups);

    List<Event> findAllByParticipantsContaining(User user);

    List<Event> findAllByOrganizer(User user);

    @Query("""
SELECT e FROM Event e
JOIN e.participants p
GROUP BY e
HAVING 
  SUM(CASE WHEN p.birthdate < :minBirthdate OR p.birthdate > :maxBirthdate THEN 1 ELSE 0 END) = 0
""")
    List<Event> findEventsWhereAllParticipantsAreInRange(
            @Param("minBirthdate") LocalDate minBirthdate,
            @Param("maxBirthdate") LocalDate maxBirthdate
    );


}

