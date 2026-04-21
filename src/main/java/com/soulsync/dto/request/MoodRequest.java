package com.soulsync.dto.request;
import com.soulsync.entity.Mood.MoodLabel;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
@Data
public class MoodRequest {
    @NotNull @Min(1) @Max(5) private Integer moodScore;
    @NotNull private MoodLabel moodLabel;
    private String note;
    @Min(1) @Max(10) private Integer energyLevel;
    private LocalDate loggedDate;
}
