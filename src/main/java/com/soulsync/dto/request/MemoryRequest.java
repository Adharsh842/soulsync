package com.soulsync.dto.request;
import com.soulsync.entity.Memory.MediaType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
@Data
public class MemoryRequest {
    @NotBlank @Size(max=300) private String title;
    private String caption;
    @NotBlank private String mediaUrl;
    private String thumbnailUrl;
    private MediaType mediaType = MediaType.PHOTO;
    private Long fileSizeBytes;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String locationName;
    private LocalDate memoryDate;
    private List<String> tags;
}
