package com.soulsync.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class LoginRequest {
    @NotBlank private String identifier; // email or username
    @NotBlank private String password;
}
