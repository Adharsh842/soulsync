package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Entity @Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "couple_id", nullable = false) private Couple couple;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sender_id", nullable = false) private User sender;
    @Column(columnDefinition = "TEXT") private String content;
    @Enumerated(EnumType.STRING) @Column(name = "message_type") private MessageType messageType = MessageType.TEXT;
    @Column(name = "media_url", length = 500) private String mediaUrl;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reply_to_id") private Message replyTo;
    @Column(name = "is_read") private boolean isRead = false;
    @Column(name = "read_at") private LocalDateTime readAt;
    @Column(name = "is_deleted") private boolean isDeleted = false;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageReaction> reactions = new ArrayList<>();
    public enum MessageType { TEXT, IMAGE, VOICE, VIDEO, EMOJI, SYSTEM }
}
