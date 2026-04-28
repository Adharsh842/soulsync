package com.soulsync.dto.response;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReactionResponse {
    private Long id;
    private Long userId;
    private String username;
    private String emoji;
}
