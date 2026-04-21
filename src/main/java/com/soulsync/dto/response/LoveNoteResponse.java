package com.soulsync.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LoveNoteResponse {
    private Long id;
    private Long senderId;
    private String senderDisplayName;
    private String title;
    private String content;
    private String mediaUrl;
    private boolean isScheduled;
    private LocalDateTime deliverAt;
    private boolean isDelivered;
    private boolean isLocked;
    private LocalDateTime unlockAt;
    private boolean isRead;
    private String theme;
    private LocalDateTime createdAt;
}
