package com.soulsync.service;

import com.soulsync.dto.request.MemoryRequest;
import com.soulsync.dto.response.MemoryResponse;
import com.soulsync.entity.*;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MemoryService {

    private final MemoryRepository memoryRepository;
    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public MemoryResponse createMemory(Long userId, MemoryRequest request) {
        User uploader = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        Memory memory = Memory.builder()
            .couple(couple)
            .uploader(uploader)
            .title(request.getTitle())
            .caption(request.getCaption())
            .mediaUrl(request.getMediaUrl())
            .thumbnailUrl(request.getThumbnailUrl())
            .mediaType(request.getMediaType())
            .fileSizeBytes(request.getFileSizeBytes())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .locationName(request.getLocationName())
            .memoryDate(request.getMemoryDate() != null ? request.getMemoryDate() : LocalDate.now())
            .build();

        if (request.getTags() != null) {
            List<MemoryTag> tags = request.getTags().stream()
                .map(tag -> MemoryTag.builder().memory(memory).tag(tag.toLowerCase().trim()).build())
                .collect(Collectors.toList());
            memory.setTags(tags);
        }

        Memory saved = memoryRepository.save(memory);

        User partner = couple.getUser1().getId().equals(userId) ? couple.getUser2() : couple.getUser1();
        notificationService.createNotification(partner, couple, "New Memory Added",
            uploader.getDisplayName() + " added a new memory: " + request.getTitle(),
            Notification.NotificationType.MEMORY, saved.getId());

        return toResponse(saved);
    }

    public Page<MemoryResponse> getTimeline(Long userId, int page, int size) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));
        return memoryRepository.findByCoupleIdOrderByMemoryDateDesc(couple.getId(), PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public List<MemoryResponse> getOnThisDay(Long userId) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));
        LocalDate today = LocalDate.now();
        return memoryRepository.findOnThisDay(couple.getId(), today.getMonthValue(), today.getDayOfMonth())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MemoryResponse toggleFavorite(Long userId, Long memoryId) {
        Memory memory = memoryRepository.findById(memoryId)
            .orElseThrow(() -> SoulSyncException.notFound("Memory not found"));
        validateCoupleAccess(userId, memory.getCouple().getId());
        memory.setFavorite(!memory.isFavorite());
        return toResponse(memoryRepository.save(memory));
    }

    public MemoryResponse getMemory(Long userId, Long memoryId) {
        Memory memory = memoryRepository.findById(memoryId)
            .orElseThrow(() -> SoulSyncException.notFound("Memory not found"));
        validateCoupleAccess(userId, memory.getCouple().getId());
        memory.setViewCount(memory.getViewCount() + 1);
        return toResponse(memoryRepository.save(memory));
    }

    public void deleteMemory(Long userId, Long memoryId) {
        Memory memory = memoryRepository.findById(memoryId)
            .orElseThrow(() -> SoulSyncException.notFound("Memory not found"));
        if (!memory.getUploader().getId().equals(userId)) {
            throw SoulSyncException.forbidden("You can only delete your own memories");
        }
        memoryRepository.delete(memory);
    }

    private void validateCoupleAccess(Long userId, Long coupleId) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.forbidden("Access denied"));
        if (!couple.getId().equals(coupleId)) {
            throw SoulSyncException.forbidden("Access denied");
        }
    }

    private MemoryResponse toResponse(Memory m) {
        return MemoryResponse.builder()
            .id(m.getId()).coupleId(m.getCouple().getId())
            .uploaderId(m.getUploader().getId())
            .uploaderDisplayName(m.getUploader().getDisplayName())
            .title(m.getTitle()).caption(m.getCaption())
            .mediaUrl(m.getMediaUrl()).thumbnailUrl(m.getThumbnailUrl())
            .mediaType(m.getMediaType()).fileSizeBytes(m.getFileSizeBytes())
            .latitude(m.getLatitude()).longitude(m.getLongitude())
            .locationName(m.getLocationName()).memoryDate(m.getMemoryDate())
            .isFavorite(m.isFavorite()).viewCount(m.getViewCount())
            .tags(m.getTags().stream().map(MemoryTag::getTag).collect(Collectors.toList()))
            .createdAt(m.getCreatedAt())
            .build();
    }
}
