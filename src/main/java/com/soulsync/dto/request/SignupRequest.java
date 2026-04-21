package com.soulsync.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data
public class SignupRequest {
    @NotBlank @Email @Size(max=255) private String email;
    @NotBlank @Size(min=3,max=50) @Pattern(regexp="^[a-zA-Z0-9_]+$", message="Username: only letters, digits and _") private String username;
    @NotBlank @Size(min=8, max=100) private String password;
    @NotBlank @Size(max=150) private String displayName;
}
