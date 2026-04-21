package com.soulsync.controller;

import com.soulsync.dto.request.LoginRequest;
import com.soulsync.dto.request.SignupRequest;
import com.soulsync.dto.response.ApiResponse;
import com.soulsync.dto.response.AuthResponse;
import com.soulsync.entity.Couple;
import com.soulsync.security.UserPrincipal;
import com.soulsync.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Auth Controller - handles signup, login, token refresh, couple pairing
 *
 * POST /auth/signup        - Register new user
 * POST /auth/login         - Login and get JWT tokens
 * POST /auth/refresh       - Refresh access token
 * POST /auth/logout        - Logout (revoke tokens)
 * GET  /auth/invite-code   - Generate couple invite code
 * POST /auth/join-couple   - Join couple with invite code
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Account created successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody Map<String, String> body) {
        AuthResponse response = authService.refreshToken(body.get("refreshToken"));
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/invite-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateInviteCode(
            @AuthenticationPrincipal UserPrincipal principal) {
        String code = authService.generateInviteCode(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Invite code generated",
            Map.of("code", code, "expiresInDays", "7")));
    }

    @PostMapping("/join-couple")
    public ResponseEntity<ApiResponse<Map<String, Object>>> joinCouple(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        Couple couple = authService.acceptInviteCode(principal.getId(), body.get("inviteCode"));
        return ResponseEntity.ok(ApiResponse.success("You are now connected!",
            Map.of("coupleId", couple.getId(), "coupleCode", couple.getCoupleCode())));
    }
}
