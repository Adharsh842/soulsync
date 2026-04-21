package com.soulsync.repository;
import com.soulsync.entity.SpecialDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
@Repository
public interface SpecialDateRepository extends JpaRepository<SpecialDate, Long> {
    List<SpecialDate> findByCoupleIdAndIsActiveTrueOrderByEventDateAsc(Long coupleId);
    @Query("SELECT sd FROM SpecialDate sd WHERE sd.couple.id = :coupleId AND sd.isActive = true AND sd.eventDate >= :today ORDER BY sd.eventDate ASC")
    List<SpecialDate> findUpcomingEvents(Long coupleId, LocalDate today);
    @Query("SELECT sd FROM SpecialDate sd WHERE sd.couple.id = :coupleId AND sd.isActive = true AND DATEDIFF(sd.eventDate, :today) BETWEEN 0 AND :days")
    List<SpecialDate> findEventsWithinDays(Long coupleId, LocalDate today, int days);
}
