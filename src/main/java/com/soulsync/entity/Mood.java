package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity @Table(name = "moods")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Mood {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "couple_id", nullable = false) private Couple couple;
    @Column(name = "mood_score", nullable = false) private Integer moodScore;
    @Enumerated(EnumType.STRING) @Column(name = "mood_label", nullable = false) private MoodLabel moodLabel;
    @Column(columnDefinition = "TEXT") private String note;
    @Column(name = "energy_level") private Integer energyLevel;
    @Column(name = "logged_date", nullable = false) private LocalDate loggedDate;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    public enum MoodLabel { ECSTATIC, HAPPY, CONTENT, NEUTRAL, ANXIOUS, SAD, ANGRY, LONELY }
}
