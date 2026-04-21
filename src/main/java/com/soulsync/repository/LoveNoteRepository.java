package com.soulsync.repository;
import com.soulsync.entity.LoveNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoveNoteRepository extends JpaRepository<LoveNote, Long> {
    Page<LoveNote> findByCoupleIdOrderByCreatedAtDesc(Long coupleId, Pageable pageable);

    @Query("SELECT note FROM LoveNote note WHERE note.isScheduled = true AND note.isDelivered = false AND note.deliverAt <= :now")
    List<LoveNote> findScheduledNotesToDeliver(LocalDateTime now);

    @Query("SELECT note FROM LoveNote note WHERE note.couple.id = :coupleId AND note.sender.id != :userId AND note.isDelivered = true AND (note.isLocked = false OR note.unlockAt <= :now)")
    Page<LoveNote> findReadableNotes(Long coupleId, Long userId, LocalDateTime now, Pageable pageable);
}