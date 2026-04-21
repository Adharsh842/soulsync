package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false, unique = true, length = 100) private String username;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(name = "display_name", length = 150) private String displayName;
    @Column(name = "avatar_url", length = 500) private String avatarUrl;
    @Column(columnDefinition = "TEXT") private String bio;
    @Column(name = "date_of_birth") private LocalDate dateOfBirth;
    @Column(length = 100) private String timezone;
    @Column(name = "is_active") private boolean isActive = true;
    @Column(name = "is_email_verified") private boolean isEmailVerified = false;
    @Column(name = "last_seen") private LocalDateTime lastSeen;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private LocalDateTime updatedAt;
}
