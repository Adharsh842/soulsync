package com.soulsync.repository;
import com.soulsync.entity.Mood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
@Repository
public interface MoodRepository extends JpaRepository<Mood, Long> {
    Optional<Mood> findByUserIdAndLoggedDate(Long userId, LocalDate date);
    List<Mood> findByUserIdAndLoggedDateBetweenOrderByLoggedDateDesc(Long userId, LocalDate start, LocalDate end);
    List<Mood> findByCoupleIdAndLoggedDateBetweenOrderByLoggedDateDesc(Long coupleId, LocalDate start, LocalDate end);
    @Query("SELECT AVG(m.moodScore) FROM Mood m WHERE m.user.id = :userId AND m.loggedDate BETWEEN :start AND :end")
    Double getAverageMoodScore(Long userId, LocalDate start, LocalDate end);
    @Query("SELECT m.moodLabel, COUNT(m) FROM Mood m WHERE m.couple.id = :coupleId AND m.loggedDate BETWEEN :start AND :end GROUP BY m.moodLabel")
    List<Object[]> getMoodDistribution(Long coupleId, LocalDate start, LocalDate end);
}
