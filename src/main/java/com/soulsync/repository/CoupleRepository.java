package com.soulsync.repository;
import com.soulsync.entity.Couple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface CoupleRepository extends JpaRepository<Couple, Long> {
    Optional<Couple> findByCoupleCode(String coupleCode);
    @Query("SELECT c FROM Couple c WHERE (c.user1.id = :userId OR c.user2.id = :userId) AND c.status = 'ACTIVE'")
    Optional<Couple> findActiveCoupleByUserId(Long userId);
    boolean existsByCoupleCode(String coupleCode);
}
