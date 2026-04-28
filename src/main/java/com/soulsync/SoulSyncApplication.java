package com.soulsync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SoulSync - Premium Couples Platform
 * Main application entry point
 */
@SpringBootApplication
@EnableScheduling
public class SoulSyncApplication {
    public static void main(String[] args) {
        SpringApplication.run(SoulSyncApplication.class, args);
    }
}
