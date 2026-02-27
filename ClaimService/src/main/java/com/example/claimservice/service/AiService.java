package com.example.claimservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public AiService() {
        this.webClient = WebClient.create();
        this.objectMapper = new ObjectMapper();
    }

    public String analyzeDamageAndPrice(MultipartFile image) {
        try {
            // 1) convert image to base64 (small images ok)
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

            String model = "gemini-flash-latest";
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            // 3) build request body matching docs: contents -> parts (text + inline_data)
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", "Sən peşəkar sığorta ekspertisən. Şəkli analiz et. 1. Zədə nədir? 2. Təmir xərci neçə AZN olar? Qısa və konkret Azərbaycan dilində yaz."),
                                    Map.of("inline_data", Map.of(
                                            "mime_type", mimeType,
                                            "data", base64Image
                                    ))
                            ))
                    )
            );

            // 4) call API via WebClient
            String responseJson = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(); // blokinq nümunə üçün

            // 5) parse response (docs: candidates[].content.parts[].text)
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidate = root.path("candidates");
            if (candidate.isArray() && candidate.size() > 0) {
                return candidate.get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text")
                        .asText();
            } else {
                return "Analiz baş tutmadı: server cavabında candidate tapılmadı.";
            }

        } catch (Exception e) {
            return "Analiz xətası baş verdi: " + e.getMessage();
        }
    }
}