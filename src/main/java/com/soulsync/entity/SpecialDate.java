package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity @Table(name = "special_dates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SpecialDate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "couple_id", nullable = false) private Couple couple;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by", nullable = false) private User createdBy;
    @Column(length = 300, nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "event_date", nullable = false) private LocalDate eventDate;
    @Enumerated(EnumType.STRING) @Column(name = "event_type") private EventType eventType = EventType.OTHER;
    @Column(name = "is_recurring") private boolean isRecurring = false;
    @Enumerated(EnumType.STRING) @Column(name = "recurrence_type") private RecurrenceType recurrenceType = RecurrenceType.YEARLY;
    @Column(name = "reminder_days") private int reminderDays = 7;
    @Column(name = "color_hex", length = 7) private String colorHex = "#FF6B9D";
    @Column(length = 50) private String icon = "heart";
    @Column(name = "is_active") private boolean isActive = true;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private LocalDateTime updatedAt;
    public enum EventType { ANNIVERSARY, BIRTHDAY, FIRST_DATE, MILESTONE, HOLIDAY, OTHER }
    public enum RecurrenceType { YEARLY, MONTHLY, WEEKLY }
}
