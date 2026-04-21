package com.soulsync.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private LocalDateTime createdAt;
    private boolean hasCoupleAccount;
    private Long coupleId;
}
