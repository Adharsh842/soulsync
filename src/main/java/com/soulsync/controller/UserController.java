package com.soulsync.controller;

import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.UserResponse;
import com.soulsync.entity.Couple;
import com.soulsync.entity.User;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.CoupleRepository;
import com.soulsync.repository.UserRepository;
import com.soulsync.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * User / Profile Controller
 * GET  /users/me              - Get current user profile
 * PUT  /users/me              - Update profile
 * GET  /users/me/couple       - Get couple info
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final CoupleRepository coupleRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));
        Optional<Couple> couple = coupleRepository.findActiveCoupleByUserId(user.getId());

        UserResponse response = UserResponse.builder()
            .id(user.getId()).email(user.getEmail()).username(user.getUsername())
            .displayName(user.getDisplayName()).avatarUrl(user.getAvatarUrl()).bio(user.getBio())
            .hasCoupleAccount(couple.isPresent())
            .coupleId(couple.map(Couple::getId).orElse(null))
            .createdAt(user.getCreatedAt())
            .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));

        if (body.containsKey("displayName")) user.setDisplayName(body.get("displayName"));
        if (body.containsKey("bio")) user.setBio(body.get("bio"));
        if (body.containsKey("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl"));
        if (body.containsKey("timezone")) user.setTimezone(body.get("timezone"));

        userRepository.save(user);
        Optional<Couple> couple = coupleRepository.findActiveCoupleByUserId(user.getId());

        return ResponseEntity.ok(ApiResponse.success("Profile updated",
            UserResponse.builder()
                .id(user.getId()).email(user.getEmail()).username(user.getUsername())
                .displayName(user.getDisplayName()).avatarUrl(user.getAvatarUrl()).bio(user.getBio())
                .hasCoupleAccount(couple.isPresent())
                .coupleId(couple.map(Couple::getId).orElse(null))
                .createdAt(user.getCreatedAt())
                .build()));
    }

    @GetMapping("/me/couple")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCoupleInfo(
            @AuthenticationPrincipal UserPrincipal principal) {
        Couple couple = coupleRepository.findActiveCoupleByUserId(principal.getId())
            .orElseThrow(() -> SoulSyncException.notFound("You are not in a couple yet"));

        User partner = couple.getUser1().getId().equals(principal.getId())
            ? couple.getUser2() : couple.getUser1();

        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "coupleId", couple.getId(),
            "coupleCode", couple.getCoupleCode(),
            "coupleName", couple.getCoupleName() != null ? couple.getCoupleName() : "",
            "anniversaryDate", couple.getAnniversaryDate() != null ? couple.getAnniversaryDate().toString() : "",
            "partnerDisplayName", partner.getDisplayName(),
            "partnerAvatarUrl", partner.getAvatarUrl() != null ? partner.getAvatarUrl() : "",
            "partnerUsername", partner.getUsername(),
            "createdAt", couple.getCreatedAt().toString()
        )));
    }
}
