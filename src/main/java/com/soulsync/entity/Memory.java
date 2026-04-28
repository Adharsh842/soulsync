package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Entity @Table(name = "memories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Memory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "couple_id", nullable = false) private Couple couple;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "uploader_id", nullable = false) private User uploader;
    @Column(length = 300, nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String caption;
    @Column(name = "media_url", length = 500, nullable = false) private String mediaUrl;
    @Column(name = "thumbnail_url", length = 500) private String thumbnailUrl;
    @Enumerated(EnumType.STRING) @Column(name = "media_type") private MediaType mediaType = MediaType.PHOTO;
    @Column(name = "file_size_bytes") private Long fileSizeBytes;
    @Column(precision = 10, scale = 8) private BigDecimal latitude;
    @Column(precision = 11, scale = 8) private BigDecimal longitude;
    @Column(name = "location_name", length = 300) private String locationName;
    @Column(name = "memory_date") private LocalDate memoryDate;
    @Column(name = "is_favorite") private boolean isFavorite = false;
    @Column(name = "view_count") private int viewCount = 0;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private LocalDateTime updatedAt;
    @OneToMany(mappedBy = "memory", cascade = CascadeType.ALL, orphanRemoval = true) private List<MemoryTag> tags = new ArrayList<>();
    public enum MediaType { PHOTO, VIDEO, VOICE, DOCUMENT }
}
