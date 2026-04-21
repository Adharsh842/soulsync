package com.soulsync.dto.response;
import com.soulsync.entity.SpecialDate.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SpecialDateResponse {
    private Long id;
    private Long coupleId;
    private String title;
    private String description;
    private LocalDate eventDate;
    private EventType eventType;
    private boolean isRecurring;
    private RecurrenceType recurrenceType;
    private int reminderDays;
    private String colorHex;
    private String icon;
    private long daysUntil;
    private LocalDateTime createdAt;
}
