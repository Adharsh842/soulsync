package com.soulsync.dto.request;
import com.soulsync.entity.SpecialDate.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
@Data
public class SpecialDateRequest {
    @NotBlank @Size(max=300) private String title;
    private String description;
    @NotNull private LocalDate eventDate;
    private EventType eventType = EventType.OTHER;
    private boolean isRecurring = false;
    private RecurrenceType recurrenceType = RecurrenceType.YEARLY;
    private int reminderDays = 7;
    private String colorHex = "#FF6B9D";
    private String icon = "heart";
}
