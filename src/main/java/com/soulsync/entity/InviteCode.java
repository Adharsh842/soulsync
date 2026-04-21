package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name = "invite_codes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InviteCode {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(length = 20, nullable = false, unique = true) private String code;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "creator_id", nullable = false) private User creator;
    @Column(name = "is_used") private boolean isUsed = false;
    @Column(name = "expires_at", nullable = false) private LocalDateTime expiresAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
}
