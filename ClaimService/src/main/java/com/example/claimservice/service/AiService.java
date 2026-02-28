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
                                    Map.of("text", "Sən 20 illik təcrübəsi olan peşəkar sığorta ekspertisən. Şəkli diqqətlə analiz et və aşağıdakı struktura uyğun cavab ver:\n" +
                                            "\n" +
                                            "Zədənin Təsviri: Hansı detallar zədələnib? (məs: bamper, faralar, qapı). Zədənin dərinliyini (yüngül, orta, ağır) qeyd et.\n" +
                                            "\n" +
                                            "Təmir İşləri: Hansı işlərin görülməsi vacibdir? (məs: rənglənmə, dəmirçi işi, detalın dəyişdirilməsi).\n" +
                                            "\n" +
                                            "Ehtiyat Hissələri: Dəyişilməli olan əsas hissələrin siyahısı.\n" +
                                            "\n" +
                                            "Təxmini Qiymət: Bütün xərclər daxil (usta + detal) cəmi neçə AZN?\n" +
                                            "\n" +
                                            "VACİB TƏLƏB: Verəcəyin cavab mütləq Azərbaycan dilində olsun və cavabın ən sonunda mütləq və mütləq yalnız rəqəmdən ibarət olan bu etiketi əlavə et: [TƏXMİNİ XƏRC: rəqəm]. Məsələn: [TƏXMİNİ XƏRC: 1200]"),
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

    //konkret qiymət çıxartmaq üçün
    public Double parsePrice(String aiResponse) {
        try {
            String tag = "[TƏXMİNİ XƏRC:";
            if (aiResponse.contains(tag)) {
                int start = aiResponse.lastIndexOf(tag) + tag.length();
                int end = aiResponse.lastIndexOf("]");
                String priceStr = aiResponse.substring(start, end).replaceAll("[^0-9.]", "").trim();
                return Double.parseDouble(priceStr);
            }
        } catch (Exception e) {
            System.out.println("Qiymət parse edilə bilmədi: " + e.getMessage());
        }
        return 0.0;
    }
}