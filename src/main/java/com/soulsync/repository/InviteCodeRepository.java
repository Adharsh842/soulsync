package com.soulsync.repository;
import com.soulsync.entity.InviteCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {
    Optional<InviteCode> findByCode(String code);
    Optional<InviteCode> findByCodeAndIsUsedFalse(String code);
}
