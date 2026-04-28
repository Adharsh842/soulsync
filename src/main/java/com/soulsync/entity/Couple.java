package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "couples")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Couple {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "couple_code", unique = true, length = 20) private String coupleCode;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user1_id", nullable = false) private User user1;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user2_id", nullable = false) private User user2;
    @Column(name = "couple_name", length = 200) private String coupleName;
    @Column(name = "anniversary_date") private LocalDate anniversaryDate;
    @Enumerated(EnumType.STRING) private CoupleStatus status = CoupleStatus.ACTIVE;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private LocalDateTime updatedAt;
    public enum CoupleStatus { ACTIVE, PAUSED, ENDED }
}
