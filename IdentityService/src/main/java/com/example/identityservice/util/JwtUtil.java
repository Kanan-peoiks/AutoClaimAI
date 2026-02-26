package com.example.identityservice.util;


import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
        private final String SECRET_STRING = "bu_cox_gizli_ve_cox_uzun_bir_key_olmalidir_2026_autoclaim";
        private final SecretKey key = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

        public String generateToken(String username) {
            return Jwts.builder()
                    .setSubject(username)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 saat
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
        }
    }
