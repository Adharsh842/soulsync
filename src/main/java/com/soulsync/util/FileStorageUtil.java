package com.soulsync.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.soulsync.exception.SoulSyncException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Cloudinary-based file storage utility.
 * Replaces local FileStorageUtil with cloud storage.
 */
@Component
@Slf4j
public class FileStorageUtil {

    private final Cloudinary cloudinary;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
        "video/mp4", "video/quicktime", "video/webm"
    );
    private static final Set<String> ALLOWED_AUDIO_TYPES = Set.of(
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"
    );
    private static final long MAX_SIZE = 50 * 1024 * 1024; // 50MB

    public FileStorageUtil(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key",    apiKey,
            "api_secret", apiSecret,
            "secure",     true
        ));
    }

    public String storeFile(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty())
            throw SoulSyncException.badRequest("File is empty");
        if (file.getSize() > MAX_SIZE)
            throw SoulSyncException.badRequest("File exceeds 50MB limit");

        String contentType = file.getContentType();
        if (!isAllowedType(contentType))
            throw SoulSyncException.badRequest("File type not allowed: " + contentType);

        try {
            String resourceType = getResourceType(contentType);
            Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "folder",        "soulsync/" + subfolder,
                    "resource_type", resourceType
                )
            );
            String url = (String) uploadResult.get("secure_url");
            log.info("Uploaded to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw SoulSyncException.badRequest("Could not upload file. Please try again.");
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            // Extract public_id from URL
            if (fileUrl != null && fileUrl.contains("cloudinary.com")) {
                String publicId = extractPublicId(fileUrl);
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Deleted from Cloudinary: {}", publicId);
            }
        } catch (Exception e) {
            log.warn("Could not delete file from Cloudinary: {}", fileUrl);
        }
    }

    private String extractPublicId(String url) {
        // Extract path after /upload/ and remove extension
        String[] parts = url.split("/upload/");
        if (parts.length < 2) return url;
        String path = parts[1];
        // Remove version prefix (v1234567890/)
        if (path.matches("v\\d+/.*")) {
            path = path.replaceFirst("v\\d+/", "");
        }
        // Remove file extension
        int dotIndex = path.lastIndexOf('.');
        return dotIndex > 0 ? path.substring(0, dotIndex) : path;
    }

    private boolean isAllowedType(String contentType) {
        if (contentType == null) return false;
        return ALLOWED_IMAGE_TYPES.contains(contentType)
            || ALLOWED_VIDEO_TYPES.contains(contentType)
            || ALLOWED_AUDIO_TYPES.contains(contentType);
    }

    private String getResourceType(String contentType) {
        if (contentType == null) return "auto";
        if (ALLOWED_VIDEO_TYPES.contains(contentType)) return "video";
        if (ALLOWED_AUDIO_TYPES.contains(contentType)) return "video"; // Cloudinary uses "video" for audio too
        return "image";
    }
}