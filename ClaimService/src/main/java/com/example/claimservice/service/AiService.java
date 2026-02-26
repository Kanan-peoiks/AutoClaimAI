package com.example.claimservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestClient restClient;
    private final ObjectMapper objectMapper; // JSON-u oxumaq üçün

    public AiService() {
        this.restClient = RestClient.create();
        this.objectMapper = new ObjectMapper();
    }

    public String analyzeDamageAndPrice(MultipartFile image) {
        try {
            // 1. Şəkli Base64 formatına çeviririk
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

            // 2. Gemini 1.5 Flash modelinə sorğu URL-i
            String url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey;
            // 3. Sorğunun gövdəsini (Body) yığırıq
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

            // 4. API-yə müraciət edirik
            String responseJson = restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            // 5. Gələn yekə JSON-un içindən sırf bizə lazım olan mətni çıxarırıq
            JsonNode rootNode = objectMapper.readTree(responseJson);
            return rootNode.path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

        } catch (Exception e) {
            return "Analiz xətası baş verdi: " + e.getMessage();
        }
    }
}