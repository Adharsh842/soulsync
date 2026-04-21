package com.soulsync.exception;
import org.springframework.http.HttpStatus;
import lombok.Getter;
@Getter
public class SoulSyncException extends RuntimeException {
    private final HttpStatus status;
    public SoulSyncException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
    public static SoulSyncException notFound(String msg) { return new SoulSyncException(msg, HttpStatus.NOT_FOUND); }
    public static SoulSyncException badRequest(String msg) { return new SoulSyncException(msg, HttpStatus.BAD_REQUEST); }
    public static SoulSyncException forbidden(String msg) { return new SoulSyncException(msg, HttpStatus.FORBIDDEN); }
    public static SoulSyncException unauthorized(String msg) { return new SoulSyncException(msg, HttpStatus.UNAUTHORIZED); }
    public static SoulSyncException conflict(String msg) { return new SoulSyncException(msg, HttpStatus.CONFLICT); }
}
