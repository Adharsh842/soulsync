package com.soulsync.service;

import com.soulsync.dto.request.LoveNoteRequest;
import com.soulsync.dto.response.LoveNoteResponse;
import com.soulsync.entity.*;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LoveNoteService {

    private final LoveNoteRepository loveNoteRepository;
    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public LoveNoteResponse createNote(Long userId, LoveNoteRequest request) {
        User sender = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        LoveNote note = LoveNote.builder()
            .couple(couple).sender(sender)
            .title(request.getTitle()).content(request.getContent())
            .mediaUrl(request.getMediaUrl())
            .isScheduled(request.isScheduled()).deliverAt(request.getDeliverAt())
            .isLocked(request.isLocked()).unlockAt(request.getUnlockAt())
            .theme(request.getTheme())
            .isDelivered(!request.isScheduled()) // immediate if not scheduled
            .deliveredAt(!request.isScheduled() ? LocalDateTime.now() : null)
            .build();

        LoveNote saved = loveNoteRepository.save(note);

        if (!request.isScheduled()) {
            User partner = couple.getUser1().getId().equals(userId) ? couple.getUser2() : couple.getUser1();
            String notifBody = request.isLocked() ? "You have a locked note waiting for you!"
                : sender.getDisplayName() + " sent you a love note!";
            notificationService.createNotification(partner, couple, "New Love Note", notifBody,
                Notification.NotificationType.LOVE_NOTE, saved.getId());
            messagingTemplate.convertAndSend("/topic/couple/" + couple.getId() + "/love-notes", toResponse(saved));
        }

        return toResponse(saved);
    }

    public Page<LoveNoteResponse> getNotes(Long userId, int page, int size) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));
        return loveNoteRepository.findReadableNotes(couple.getId(), userId, LocalDateTime.now(), PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public LoveNoteResponse markAsRead(Long userId, Long noteId) {
        LoveNote note = loveNoteRepository.findById(noteId)
            .orElseThrow(() -> SoulSyncException.notFound("Love note not found"));

        if (note.isLocked() && note.getUnlockAt() != null && note.getUnlockAt().isAfter(LocalDateTime.now())) {
            throw SoulSyncException.forbidden("This note is still locked");
        }

        note.setRead(true);
        note.setReadAt(LocalDateTime.now());
        return toResponse(loveNoteRepository.save(note));
    }

    /**
     * Scheduled every minute to deliver queued love notes
     */
    @Scheduled(fixedDelay = 60000)
    public void deliverScheduledNotes() {
        List<LoveNote> toDeliver = loveNoteRepository.findScheduledNotesToDeliver(LocalDateTime.now());
        for (LoveNote note : toDeliver) {
            note.setDelivered(true);
            note.setDeliveredAt(LocalDateTime.now());
            loveNoteRepository.save(note);

            Couple couple = note.getCouple();
            User partner = couple.getUser1().getId().equals(note.getSender().getId())
                ? couple.getUser2() : couple.getUser1();

            notificationService.createNotification(partner, couple, "Love Note Arrived",
                note.getSender().getDisplayName() + " sent you a love note!",
                Notification.NotificationType.LOVE_NOTE, note.getId());

            messagingTemplate.convertAndSend("/topic/couple/" + couple.getId() + "/love-notes", toResponse(note));
        }
    }

    private LoveNoteResponse toResponse(LoveNote n) {
        return LoveNoteResponse.builder()
            .id(n.getId()).senderId(n.getSender().getId())
            .senderDisplayName(n.getSender().getDisplayName())
            .title(n.getTitle()).content(n.isLocked() && n.getUnlockAt() != null && n.getUnlockAt().isAfter(LocalDateTime.now()) ? "[Locked]" : n.getContent())
            .mediaUrl(n.getMediaUrl()).isScheduled(n.isScheduled())
            .deliverAt(n.getDeliverAt()).isDelivered(n.isDelivered())
            .isLocked(n.isLocked()).unlockAt(n.getUnlockAt())
            .isRead(n.isRead()).theme(n.getTheme()).createdAt(n.getCreatedAt())
            .build();
    }
}
