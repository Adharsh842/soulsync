package com.soulsync.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class LoveNoteRequest {
    @Size(max=300) private String title;
    @NotBlank private String content;
    private String mediaUrl;
    private boolean isScheduled = false;
    private LocalDateTime deliverAt;
    private boolean isLocked = false;
    private LocalDateTime unlockAt;
    private String theme = "default";
}
