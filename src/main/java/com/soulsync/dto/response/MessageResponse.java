package com.soulsync.dto.response;
import com.soulsync.entity.Message.MessageType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long coupleId;
    private Long senderId;
    private String senderDisplayName;
    private String senderAvatarUrl;
    private String content;
    private MessageType messageType;
    private String mediaUrl;
    private Long replyToId;
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private List<ReactionResponse> reactions;
}
