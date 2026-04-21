package com.soulsync.controller;

import com.soulsync.dto.request.LoveNoteRequest;
import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.LoveNoteResponse;
import com.soulsync.security.UserPrincipal;
import com.soulsync.service.LoveNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/love-notes")
@RequiredArgsConstructor
public class LoveNoteController {

    private final LoveNoteService loveNoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LoveNoteResponse>>> getNotes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
            loveNoteService.getNotes(principal.getId(), page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LoveNoteResponse>> createNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LoveNoteRequest request) {
        LoveNoteResponse response = loveNoteService.createNote(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Love note created", response));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<LoveNoteResponse>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Marked as read",
            loveNoteService.markAsRead(principal.getId(), id)));
    }
}
