package com.soulsync.service;

import com.soulsync.dto.request.SendMessageRequest;
import com.soulsync.dto.response.MessageResponse;
import com.soulsync.dto.response.ReactionResponse;
import com.soulsync.entity.*;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final CoupleRepository coupleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageResponse sendMessage(Long senderId, SendMessageRequest request) {
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));

        Couple couple = coupleRepository.findActiveCoupleByUserId(senderId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        Message message = Message.builder()
            .couple(couple)
            .sender(sender)
            .content(request.getContent())
            .messageType(request.getMessageType() != null ? request.getMessageType() : Message.MessageType.TEXT)
            .mediaUrl(request.getMediaUrl())
            .build();

        if (request.getReplyToId() != null) {
            messageRepository.findById(request.getReplyToId())
                .ifPresent(message::setReplyTo);
        }

        message = messageRepository.save(message);
        MessageResponse response = toResponse(message);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/couple/" + couple.getId() + "/messages", response);

        // Notify partner
        User partner = couple.getUser1().getId().equals(senderId) ? couple.getUser2() : couple.getUser1();
        notificationService.createNotification(partner, couple, "New Message",
            sender.getDisplayName() + ": " + (request.getContent() != null ? request.getContent() : "[Media]"),
            Notification.NotificationType.MESSAGE, message.getId());

        return response;
    }

    public Page<MessageResponse> getMessages(Long userId, int page, int size) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(userId)
            .orElseThrow(() -> SoulSyncException.notFound("You are not in an active couple"));

        markAsRead(couple.getId(), userId);
        return messageRepository.findByCoupleIdOrderByCreatedAtDesc(couple.getId(), PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public void addReaction(Long userId, Long messageId, String emoji) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> SoulSyncException.notFound("Message not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));

        MessageReaction reaction = MessageReaction.builder()
            .message(message)
            .user(user)
            .emoji(emoji)
            .build();
        message.getReactions().add(reaction);
        messageRepository.save(message);

        messagingTemplate.convertAndSend(
            "/topic/couple/" + message.getCouple().getId() + "/reactions",
            new ReactionResponse(reaction.getId(), userId, user.getUsername(), emoji)
        );
    }

    @Transactional
    public void markAsRead(Long coupleId, Long userId) {
        messageRepository.markAllAsRead(coupleId, userId);
    }

    public void sendTypingIndicator(Long coupleId, Long userId, boolean isTyping) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            messagingTemplate.convertAndSend(
                "/topic/couple/" + coupleId + "/typing",
                java.util.Map.of("userId", userId, "displayName", user.getDisplayName(), "isTyping", isTyping)
            );
        }
    }

    private MessageResponse toResponse(Message m) {
        List<ReactionResponse> reactions = m.getReactions().stream()
            .map(r -> new ReactionResponse(r.getId(), r.getUser().getId(), r.getUser().getUsername(), r.getEmoji()))
            .collect(Collectors.toList());

        return MessageResponse.builder()
            .id(m.getId())
            .coupleId(m.getCouple().getId())
            .senderId(m.getSender().getId())
            .senderDisplayName(m.getSender().getDisplayName())
            .senderAvatarUrl(m.getSender().getAvatarUrl())
            .content(m.getContent())
            .messageType(m.getMessageType())
            .mediaUrl(m.getMediaUrl())
            .replyToId(m.getReplyTo() != null ? m.getReplyTo().getId() : null)
            .isRead(m.isRead())
            .readAt(m.getReadAt())
            .createdAt(m.getCreatedAt())
            .reactions(reactions)
            .build();
    }
}
