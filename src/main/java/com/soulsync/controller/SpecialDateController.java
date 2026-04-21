package com.soulsync.controller;

import com.soulsync.dto.request.SpecialDateRequest;
import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.SpecialDateResponse;
import com.soulsync.security.UserPrincipal;
import com.soulsync.service.SpecialDateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/special-dates")
@RequiredArgsConstructor
public class SpecialDateController {

    private final SpecialDateService specialDateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SpecialDateResponse>>> getAllEvents(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(specialDateService.getAllEvents(principal.getId())));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<SpecialDateResponse>>> getUpcoming(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(specialDateService.getUpcomingEvents(principal.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SpecialDateResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SpecialDateRequest request) {
        SpecialDateResponse response = specialDateService.createEvent(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Event created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SpecialDateResponse>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SpecialDateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Event updated",
            specialDateService.updateEvent(principal.getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        specialDateService.deleteEvent(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted", null));
    }
}
