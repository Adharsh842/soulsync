package com.soulsync.dto.response;
import com.soulsync.entity.Mood.MoodLabel;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MoodResponse {
    private Long id;
    private Long userId;
    private String userDisplayName;
    private Integer moodScore;
    private MoodLabel moodLabel;
    private String note;
    private Integer energyLevel;
    private LocalDate loggedDate;
    private LocalDateTime createdAt;
}
