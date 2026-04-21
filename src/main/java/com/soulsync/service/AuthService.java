package com.soulsync.service;

import com.soulsync.dto.request.LoginRequest;
import com.soulsync.dto.request.SignupRequest;
import com.soulsync.dto.response.AuthResponse;
import com.soulsync.dto.response.UserResponse;
import com.soulsync.entity.Couple;
import com.soulsync.entity.InviteCode;
import com.soulsync.entity.RefreshToken;
import com.soulsync.entity.User;
import com.soulsync.exception.SoulSyncException;
import com.soulsync.repository.*;
import com.soulsync.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final CoupleRepository coupleRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw SoulSyncException.conflict("Email is already registered");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw SoulSyncException.conflict("Username is already taken");
        }

        User user = User.builder()
            .email(request.getEmail().toLowerCase())
            .username(request.getUsername().toLowerCase())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .displayName(request.getDisplayName())
            .timezone("UTC")
            .isActive(true)
            .build();
        user = userRepository.save(user);

        return generateAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(request.getIdentifier().toLowerCase())
            .orElseThrow(() -> SoulSyncException.unauthorized("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw SoulSyncException.unauthorized("Invalid credentials");
        }
        if (!user.isActive()) {
            throw SoulSyncException.forbidden("Account is deactivated");
        }

        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        return generateAuthResponse(user);
    }

    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
            .orElseThrow(() -> SoulSyncException.unauthorized("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw SoulSyncException.unauthorized("Refresh token expired or revoked");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return generateAuthResponse(refreshToken.getUser());
    }

    public String generateInviteCode(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));

        String code = "SS" + UUID.randomUUID().toString().replace("-","").substring(0,8).toUpperCase();
        InviteCode inviteCode = InviteCode.builder()
            .code(code)
            .creator(user)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .build();
        inviteCodeRepository.save(inviteCode);
        return code;
    }

    public Couple acceptInviteCode(Long userId, String code) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> SoulSyncException.notFound("User not found"));

        InviteCode inviteCode = inviteCodeRepository.findByCodeAndIsUsedFalse(code)
            .orElseThrow(() -> SoulSyncException.notFound("Invalid or expired invite code"));

        if (inviteCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw SoulSyncException.badRequest("Invite code has expired");
        }
        if (inviteCode.getCreator().getId().equals(userId)) {
            throw SoulSyncException.badRequest("You cannot accept your own invite code");
        }

        Optional<Couple> existing = coupleRepository.findActiveCoupleByUserId(userId);
        if (existing.isPresent()) {
            throw SoulSyncException.conflict("You are already in a couple");
        }

        inviteCode.setUsed(true);
        inviteCodeRepository.save(inviteCode);

        String coupleCode = "SOUL" + UUID.randomUUID().toString().replace("-","").substring(0,6).toUpperCase();
        Couple couple = Couple.builder()
            .coupleCode(coupleCode)
            .user1(inviteCode.getCreator())
            .user2(user)
            .status(Couple.CoupleStatus.ACTIVE)
            .build();
        return coupleRepository.save(couple);
    }

    public void logout(Long userId) {
        refreshTokenRepository.revokeAllUserTokens(userId);
    }

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(UUID.randomUUID().toString())
            .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
            .build();
        refreshTokenRepository.save(refreshToken);

        Optional<Couple> couple = coupleRepository.findActiveCoupleByUserId(user.getId());

        UserResponse userResponse = UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .displayName(user.getDisplayName())
            .avatarUrl(user.getAvatarUrl())
            .bio(user.getBio())
            .hasCoupleAccount(couple.isPresent())
            .coupleId(couple.map(Couple::getId).orElse(null))
            .createdAt(user.getCreatedAt())
            .build();

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .tokenType("Bearer")
            .expiresIn(86400)
            .user(userResponse)
            .build();
    }
}
