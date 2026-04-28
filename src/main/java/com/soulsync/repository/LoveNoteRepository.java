package com.soulsync.repository;
import com.soulsync.entity.LoveNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoveNoteRepository extends JpaRepository<LoveNote, Long> {

    Page<LoveNote> findByCoupleIdOrderByCreatedAtDesc(Long coupleId, Pageable pageable);

    @Query("SELECT l FROM LoveNote l WHERE l.couple.id = :coupleId AND l.sender.id != :userId AND l.isDelivered = true AND (l.isLocked = false OR l.unlockAt <= :now)")
    Page<LoveNote> findReadableNotes(@Param("coupleId") Long coupleId,
                                      @Param("userId") Long userId,
                                      @Param("now") LocalDateTime now,
                                      Pageable pageable);

    @Query("SELECT l FROM LoveNote l WHERE l.isDelivered = false AND l.deliverAt <= :now")
    List<LoveNote> findScheduledNotesToDeliver(@Param("now") LocalDateTime now);
}