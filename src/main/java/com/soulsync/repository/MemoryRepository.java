package com.soulsync.repository;
import com.soulsync.entity.Memory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
@Repository
public interface MemoryRepository extends JpaRepository<Memory, Long> {
    Page<Memory> findByCoupleIdOrderByMemoryDateDesc(Long coupleId, Pageable pageable);
    Page<Memory> findByCoupleIdAndIsFavoriteTrue(Long coupleId, Pageable pageable);
    @Query("SELECT m FROM Memory m WHERE m.couple.id = :coupleId AND MONTH(m.memoryDate) = :month AND DAY(m.memoryDate) = :day ORDER BY YEAR(m.memoryDate) DESC")
    List<Memory> findOnThisDay(Long coupleId, int month, int day);
    @Query("SELECT m FROM Memory m WHERE m.couple.id = :coupleId AND m.memoryDate BETWEEN :start AND :end ORDER BY m.memoryDate DESC")
    List<Memory> findByDateRange(Long coupleId, LocalDate start, LocalDate end);
    long countByCoupleId(Long coupleId);
}
