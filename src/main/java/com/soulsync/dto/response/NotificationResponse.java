package com.soulsync.dto.response;
import com.soulsync.entity.Notification.NotificationType;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String title;
    private String body;
    private NotificationType notificationType;
    private Long referenceId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
