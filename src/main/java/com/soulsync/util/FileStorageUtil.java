package com.soulsync.util;

import com.soulsync.exception.SoulSyncException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

/**
 * Utility for storing uploaded files to the local filesystem.
 * In production, swap this with an S3/GCS/Azure Blob implementation.
 */
@Component
@Slf4j
public class FileStorageUtil {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg","image/png","image/gif","image/webp");
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of("video/mp4","video/quicktime","video/webm");
    private static final Set<String> ALLOWED_AUDIO_TYPES = Set.of("audio/mpeg","audio/wav","audio/ogg","audio/webm");
    private static final long MAX_SIZE = 50 * 1024 * 1024; // 50MB

    public String storeFile(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) throw SoulSyncException.badRequest("File is empty");
        if (file.getSize() > MAX_SIZE) throw SoulSyncException.badRequest("File exceeds 50MB limit");

        String contentType = file.getContentType();
        if (!isAllowedType(contentType)) throw SoulSyncException.badRequest("File type not allowed: " + contentType);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = getExtension(originalFilename);
        String filename = UUID.randomUUID().toString() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir, subfolder);
            Files.createDirectories(uploadPath);
            Path targetPath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file: {}/{}", subfolder, filename);
            return "/uploads/" + subfolder + "/" + filename;
        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw SoulSyncException.badRequest("Could not store file. Please try again.");
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            String relativePath = fileUrl.replace("/uploads/", "");
            Path filePath = Paths.get(uploadDir, relativePath);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Could not delete file: {}", fileUrl);
        }
    }

    private boolean isAllowedType(String contentType) {
        if (contentType == null) return false;
        return ALLOWED_IMAGE_TYPES.contains(contentType)
            || ALLOWED_VIDEO_TYPES.contains(contentType)
            || ALLOWED_AUDIO_TYPES.contains(contentType);
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(dotIndex) : "";
    }
}
