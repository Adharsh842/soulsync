package com.soulsync.service;

import com.soulsync.dto.request.MoodRequest;
import com.soulsync.dto.response.MoodResponse;
import com.soulsync.entity.*;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MoodService {

    private final MoodRepository moodRepository;
    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MoodResponse logMood(Long userId, MoodRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        LocalDate logDate = request.getLoggedDate() != null ? request.getLoggedDate() : LocalDate.now();
        Optional<Mood> existing = moodRepository.findByUserIdAndLoggedDate(userId, logDate);

        Mood mood;
        if (existing.isPresent()) {
            mood = existing.get();
            mood.setMoodScore(request.getMoodScore());
            mood.setMoodLabel(request.getMoodLabel());
            mood.setNote(request.getNote());
            mood.setEnergyLevel(request.getEnergyLevel());
        } else {
            mood = Mood.builder()
                .user(user).couple(couple)
                .moodScore(request.getMoodScore())
                .moodLabel(request.getMoodLabel())
                .note(request.getNote())
                .energyLevel(request.getEnergyLevel())
                .loggedDate(logDate)
                .build();
        }

        mood = moodRepository.save(mood);
        MoodResponse response = toResponse(mood);

        // Real-time update to partner
        messagingTemplate.convertAndSend("/topic/couple/" + couple.getId() + "/mood", response);

        return response;
    }

    public List<MoodResponse> getMyMoods(Long userId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return moodRepository.findByUserIdAndLoggedDateBetweenOrderByLoggedDateDesc(userId, start, end)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public Map<String, Object> getMoodAnalytics(Long userId, int days) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);

        Double myAvg = moodRepository.getAverageMoodScore(userId, start, end);
        List<Object[]> distribution = moodRepository.getMoodDistribution(couple.getId(), start, end);
        List<MoodResponse> timeline = moodRepository
            .findByCoupleIdAndLoggedDateBetweenOrderByLoggedDateDesc(couple.getId(), start, end)
            .stream().map(this::toResponse).collect(Collectors.toList());

        Map<String, Long> dist = new LinkedHashMap<>();
        for (Object[] row : distribution) {
            dist.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("averageMoodScore", myAvg != null ? Math.round(myAvg * 100.0) / 100.0 : 0);
        analytics.put("moodDistribution", dist);
        analytics.put("timeline", timeline);
        analytics.put("totalEntries", timeline.size());
        analytics.put("periodDays", days);
        return analytics;
    }

    private MoodResponse toResponse(Mood m) {
        return MoodResponse.builder()
            .id(m.getId()).userId(m.getUser().getId())
            .userDisplayName(m.getUser().getDisplayName())
            .moodScore(m.getMoodScore()).moodLabel(m.getMoodLabel())
            .note(m.getNote()).energyLevel(m.getEnergyLevel())
            .loggedDate(m.getLoggedDate()).createdAt(m.getCreatedAt())
            .build();
    }
}
