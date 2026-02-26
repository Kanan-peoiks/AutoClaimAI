package com.example.identityservice.controller;


import com.example.identityservice.dto.AuthRequest;
import com.example.identityservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public String register(@RequestBody AuthRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody AuthRequest request) {
        return authService.login(request);
    }
}