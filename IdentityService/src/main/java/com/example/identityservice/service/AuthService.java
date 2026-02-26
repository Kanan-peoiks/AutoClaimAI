package com.example.identityservice.service;


import com.example.identityservice.dto.AuthRequest;
import com.example.identityservice.entity.User;
import com.example.identityservice.repository.UserRepository;
import com.example.identityservice.util.JwtUtil;
import com.example.identityservice.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public String register(AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("İstifadəçi adı artıq mövcuddur!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        // Parolu şifrələyib saxlayırıq
        user.setPassword(PasswordUtil.hashPassword(request.getPassword()));

        userRepository.save(user);
        return "Qeydiyyat uğurla tamamlandı!";
    }

    public String login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı!"));

        if (PasswordUtil.checkPassword(request.getPassword(), user.getPassword())) {
            return jwtUtil.generateToken(user.getUsername());
        } else {
            throw new RuntimeException("Yanlış parol!");
        }
    }
}
