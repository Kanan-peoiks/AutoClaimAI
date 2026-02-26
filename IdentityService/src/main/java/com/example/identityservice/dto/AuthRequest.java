package com.example.identityservice.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
    private String fullName;
}
