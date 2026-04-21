package com.soulsync.service;

import com.soulsync.dto.response.NotificationResponse;
import com.soulsync.entity.*;
import com.soulsync.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Async("taskExecutor")
    public void createNotification(User user, Couple couple, String title, String body,
                                    Notification.NotificationType type, Long referenceId) {
        Notification notification = Notification.builder()
            .user(user).couple(couple).title(title).body(body)
            .notificationType(type).referenceId(referenceId)
            .build();
        notification = notificationRepository.save(notification);

        // Push real-time notification via WebSocket
        messagingTemplate.convertAndSendToUser(
            user.getId().toString(), "/queue/notifications", toResponse(notification));
    }

    public Page<NotificationResponse> getNotifications(Long userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAllRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    public void markRead(Long userId, Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                n.setReadAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        });
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId()).title(n.getTitle()).body(n.getBody())
            .notificationType(n.getNotificationType()).referenceId(n.getReferenceId())
            .isRead(n.isRead()).createdAt(n.getCreatedAt())
            .build();
    }
}
