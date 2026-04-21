package com.soulsync.dto.response;
import com.soulsync.entity.Memory.MediaType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MemoryResponse {
    private Long id;
    private Long coupleId;
    private Long uploaderId;
    private String uploaderDisplayName;
    private String title;
    private String caption;
    private String mediaUrl;
    private String thumbnailUrl;
    private MediaType mediaType;
    private Long fileSizeBytes;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String locationName;
    private LocalDate memoryDate;
    private boolean isFavorite;
    private int viewCount;
    private List<String> tags;
    private LocalDateTime createdAt;
}
