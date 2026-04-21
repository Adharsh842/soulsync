package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name = "love_notes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoveNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "couple_id", nullable = false) private Couple couple;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sender_id", nullable = false) private User sender;
    @Column(length = 300) private String title;
    @Column(columnDefinition = "TEXT", nullable = false) private String content;
    @Column(name = "media_url", length = 500) private String mediaUrl;
    @Column(name = "is_scheduled") private boolean isScheduled = false;
    @Column(name = "deliver_at") private LocalDateTime deliverAt;
    @Column(name = "is_delivered") private boolean isDelivered = false;
    @Column(name = "delivered_at") private LocalDateTime deliveredAt;
    @Column(name = "is_locked") private boolean isLocked = false;
    @Column(name = "unlock_at") private LocalDateTime unlockAt;
    @Column(name = "is_read") private boolean isRead = false;
    @Column(name = "read_at") private LocalDateTime readAt;
    @Column(length = 50) private String theme = "default";
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
}
