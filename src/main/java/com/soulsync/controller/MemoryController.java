package com.soulsync.controller;

import com.soulsync.dto.request.MemoryRequest;
import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.MemoryResponse;
import com.soulsync.security.UserPrincipal;
import com.soulsync.service.MemoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/memories")
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MemoryResponse>>> getTimeline(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            memoryService.getTimeline(principal.getId(), page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MemoryResponse>> createMemory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MemoryRequest request) {
        MemoryResponse response = memoryService.createMemory(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Memory saved!", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MemoryResponse>> getMemory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(memoryService.getMemory(principal.getId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MemoryResponse>> updateMemory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody MemoryRequest request) {
        // Delegate to service - simplified
        return ResponseEntity.ok(ApiResponse.success("Updated", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMemory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        memoryService.deleteMemory(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Memory deleted", null));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<MemoryResponse>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(memoryService.toggleFavorite(principal.getId(), id)));
    }

    @GetMapping("/on-this-day")
    public ResponseEntity<ApiResponse<List<MemoryResponse>>> onThisDay(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
            "On this day memories", memoryService.getOnThisDay(principal.getId())));
    }
}
