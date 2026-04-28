package com.soulsync.service;

import com.soulsync.dto.request.SpecialDateRequest;
import com.soulsync.dto.response.SpecialDateResponse;
import com.soulsync.entity.*;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SpecialDateService {

    private final SpecialDateRepository specialDateRepository;
    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SpecialDateResponse createEvent(Long userId, SpecialDateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        SpecialDate event = SpecialDate.builder()
            .couple(couple).createdBy(user)
            .title(request.getTitle()).description(request.getDescription())
            .eventDate(request.getEventDate()).eventType(request.getEventType())
            .isRecurring(request.isRecurring()).recurrenceType(request.getRecurrenceType())
            .reminderDays(request.getReminderDays())
            .colorHex(request.getColorHex()).icon(request.getIcon())
            .isActive(true)
            .build();
        return toResponse(specialDateRepository.save(event));
    }

    public List<SpecialDateResponse> getUpcomingEvents(Long userId) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));
        return specialDateRepository.findUpcomingEvents(couple.getId(), LocalDate.now())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<SpecialDateResponse> getAllEvents(Long userId) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));
        return specialDateRepository.findByCoupleIdAndIsActiveTrueOrderByEventDateAsc(couple.getId())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SpecialDateResponse updateEvent(Long userId, Long eventId, SpecialDateRequest request) {
        SpecialDate event = specialDateRepository.findById(eventId)
            .orElseThrow(() -> SoulSyncException.notFound("Event not found"));
        validateAccess(userId, event.getCouple().getId());

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setEventType(request.getEventType());
        event.setRecurring(request.isRecurring());
        event.setRecurrenceType(request.getRecurrenceType());
        event.setReminderDays(request.getReminderDays());
        event.setColorHex(request.getColorHex());
        event.setIcon(request.getIcon());
        return toResponse(specialDateRepository.save(event));
    }

    public void deleteEvent(Long userId, Long eventId) {
        SpecialDate event = specialDateRepository.findById(eventId)
            .orElseThrow(() -> SoulSyncException.notFound("Event not found"));
        validateAccess(userId, event.getCouple().getId());
        event.setActive(false);
        specialDateRepository.save(event);
    }

    /**
     * Runs daily at 8am to send reminders for upcoming events
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendEventReminders() {
        List<Couple> couples = coupleRepository.findAll();
        for (Couple couple : couples) {
            List<SpecialDate> upcoming = specialDateRepository.findEventsWithinDays(
                couple.getId(), LocalDate.now(), 7);
            for (SpecialDate event : upcoming) {
                long days = ChronoUnit.DAYS.between(LocalDate.now(), event.getEventDate());
                String msg = days == 0 ? "Today is " + event.getTitle() + "!" :
                    event.getTitle() + " is in " + days + " day" + (days > 1 ? "s" : "") + "!";
                notificationService.createNotification(couple.getUser1(), couple,
                    "Upcoming: " + event.getTitle(), msg, Notification.NotificationType.REMINDER, event.getId());
                notificationService.createNotification(couple.getUser2(), couple,
                    "Upcoming: " + event.getTitle(), msg, Notification.NotificationType.REMINDER, event.getId());
            }
        }
    }

    private void validateAccess(Long userId, Long coupleId) {
        coupleRepository.findActiveCoupleByUserId(userId)
            .filter(c -> c.getId().equals(coupleId))
            .orElseThrow(() -> SoulSyncException.forbidden("Access denied"));
    }

    private SpecialDateResponse toResponse(SpecialDate sd) {
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), sd.getEventDate());
        return SpecialDateResponse.builder()
            .id(sd.getId()).coupleId(sd.getCouple().getId())
            .title(sd.getTitle()).description(sd.getDescription())
            .eventDate(sd.getEventDate()).eventType(sd.getEventType())
            .isRecurring(sd.isRecurring()).recurrenceType(sd.getRecurrenceType())
            .reminderDays(sd.getReminderDays()).colorHex(sd.getColorHex()).icon(sd.getIcon())
            .daysUntil(daysUntil).createdAt(sd.getCreatedAt())
            .build();
    }
}
