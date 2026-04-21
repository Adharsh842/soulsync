package com.soulsync.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name = "memory_tags")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MemoryTag {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "memory_id", nullable = false) private Memory memory;
    @Column(length = 100, nullable = false) private String tag;
}
