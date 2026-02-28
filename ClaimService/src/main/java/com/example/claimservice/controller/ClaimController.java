package com.example.claimservice.controller;

import com.example.claimservice.model.Claim;
import com.example.claimservice.repository.ClaimRepository;
import com.example.claimservice.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final AiService aiService;
    private final ClaimRepository claimRepository;

    @PostMapping("/upload")
    public ResponseEntity<Claim> createClaim(
            @RequestParam("file") MultipartFile file,
            @RequestParam("username") String username) {

        // 1. AI-dən analiz və təxmini qiyməti alırıq
        String aiResult = aiService.analyzeDamageAndPrice(file);

        Double estimatedPrice = aiService.parsePrice(aiResult);

        // 2. Yeni Claim obyekti yaradırıq
        Claim claim = new Claim();
        claim.setUsername(username);
        claim.setAiAssessment(aiResult);
        claim.setEstimatedCost(estimatedPrice);
        claim.setImageUrl("uploads/" + file.getOriginalFilename());

        // 3. Bazaya yadda saxlayırıq
        Claim savedClaim = claimRepository.save(claim);

        return ResponseEntity.ok(savedClaim);
    }
}