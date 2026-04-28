package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "couple_id") private Couple couple;
    @Column(length = 300, nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String body;
    @Enumerated(EnumType.STRING) @Column(name = "notification_type", nullable = false) private NotificationType notificationType;
    @Column(name = "reference_id") private Long referenceId;
    @Column(name = "is_read") private boolean isRead = false;
    @Column(name = "read_at") private LocalDateTime readAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    public enum NotificationType { MESSAGE, MOOD, MEMORY, SPECIAL_DATE, LOVE_NOTE, SYSTEM, REMINDER }
}
