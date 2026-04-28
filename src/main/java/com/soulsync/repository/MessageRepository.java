package com.soulsync.repository;
import com.soulsync.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE m.couple.id = :coupleId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<Message> findByCoupleIdOrderByCreatedAtDesc(Long coupleId, Pageable pageable);
    @Query("SELECT COUNT(m) FROM Message m WHERE m.couple.id = :coupleId AND m.sender.id != :userId AND m.isRead = false AND m.isDeleted = false")
    long countUnreadMessages(Long coupleId, Long userId);
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP WHERE m.couple.id = :coupleId AND m.sender.id != :userId AND m.isRead = false")
    int markAllAsRead(Long coupleId, Long userId);
}
