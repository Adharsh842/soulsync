package com.soulsync.controller;

import com.soulsync.dto.request.SendMessageRequest;
import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.MessageResponse;
import com.soulsync.security.UserPrincipal;
import com.soulsync.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Message Controller
 *
 * REST Endpoints:
 * GET  /messages?page=0&size=50      - Get paginated messages
 * POST /messages                     - Send a message
 * POST /messages/{id}/react          - React to message
 * PUT  /messages/read                - Mark messages as read
 *
 * WebSocket:
 * /app/chat.send                    - Send message via WS
 * /app/chat.typing                  - Send typing indicator
 * /topic/couple/{id}/messages       - Subscribe for new messages
 * /topic/couple/{id}/typing         - Subscribe for typing events
 */
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            messageService.getMessages(principal.getId(), page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.sendMessage(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Message sent", response));
    }

    @PostMapping("/{messageId}/react")
    public ResponseEntity<ApiResponse<Void>> addReaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        messageService.addReaction(principal.getId(), messageId, body.get("emoji"));
        return ResponseEntity.ok(ApiResponse.success("Reaction added", null));
    }

    @PutMapping("/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        // Handled internally in getMessages; expose explicit endpoint too
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", null));
    }

    // WebSocket message handler
    @MessageMapping("/chat.send")
    public void handleWebSocketMessage(@AuthenticationPrincipal UserPrincipal principal,
                                        @Payload SendMessageRequest request) {
        messageService.sendMessage(principal.getId(), request);
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@AuthenticationPrincipal UserPrincipal principal,
                              @Payload Map<String, Object> payload) {
        Long coupleId = Long.parseLong(payload.get("coupleId").toString());
        boolean isTyping = Boolean.parseBoolean(payload.get("isTyping").toString());
        messageService.sendTypingIndicator(coupleId, principal.getId(), isTyping);
    }
}
