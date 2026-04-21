package com.soulsync.controller;

import com.soulsync.dto.request.MoodRequest;
import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.MoodResponse;
import com.soulsync.security.UserPrincipal;
import com.soulsync.service.MoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/moods")
@RequiredArgsConstructor
public class MoodController {

    private final MoodService moodService;

    @PostMapping
    public ResponseEntity<ApiResponse<MoodResponse>> logMood(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MoodRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Mood logged", moodService.logMood(principal.getId(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MoodResponse>>> getMyMoods(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(moodService.getMyMoods(principal.getId(), days)));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(moodService.getMoodAnalytics(principal.getId(), days)));
    }
}
