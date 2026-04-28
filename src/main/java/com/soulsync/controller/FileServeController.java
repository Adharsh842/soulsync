package com.soulsync.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class FileServeController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping("/uploads/{subfolder}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String subfolder,
            @PathVariable String filename) {

        System.out.println(">>> FileServeController hit: " + subfolder + "/" + filename);
        System.out.println(">>> Upload dir: " + uploadDir);

        try {
            Path filePath = Paths.get(uploadDir).resolve(subfolder).resolve(filename);
            System.out.println(">>> Full path: " + filePath.toAbsolutePath());

            Resource resource = new UrlResource(filePath.toUri());
            System.out.println(">>> File exists: " + resource.exists());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "image/jpeg";
            if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".gif")) contentType = "image/gif";
            else if (filename.endsWith(".webp")) contentType = "image/webp";
            else if (filename.endsWith(".mp4")) contentType = "video/mp4";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            System.out.println(">>> MalformedURLException: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}