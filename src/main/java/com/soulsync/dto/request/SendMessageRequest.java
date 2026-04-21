package com.soulsync.dto.request;
import com.soulsync.entity.Message.MessageType;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class SendMessageRequest {
    private String content;
    private MessageType messageType = MessageType.TEXT;
    private String mediaUrl;
    private Long replyToId;
}
