package com.soulsync.controller;

import com.soulsync.dto.response.ApiResponse;
import com.soulsync.security.UserPrincipal;
import com.soulsync.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * File Upload Controller
 * POST /upload/photo   - Upload image (returns URL)
 * POST /upload/video   - Upload video (returns URL)
 * POST /upload/voice   - Upload voice note (returns URL)
 * POST /upload/avatar  - Upload profile avatar (returns URL)
 */
@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageUtil fileStorageUtil;

    @PostMapping("/photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPhoto(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        String url = fileStorageUtil.storeFile(file, "photos");
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded", Map.of("url", url)));
    }

    @PostMapping("/video")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        String url = fileStorageUtil.storeFile(file, "videos");
        return ResponseEntity.ok(ApiResponse.success("Video uploaded", Map.of("url", url)));
    }

    @PostMapping("/voice")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVoice(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        String url = fileStorageUtil.storeFile(file, "voice");
        return ResponseEntity.ok(ApiResponse.success("Voice note uploaded", Map.of("url", url)));
    }

    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        String url = fileStorageUtil.storeFile(file, "avatars");
        return ResponseEntity.ok(ApiResponse.success("Avatar uploaded", Map.of("url", url)));
    }
}
