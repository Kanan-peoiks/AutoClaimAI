package com.example.identityservice.util;


import org.mindrot.jbcrypt.BCrypt;

public class PasswordUtil {
    // Parolu şifrələyir
    public static String hashPassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt());
    }

    // Parolun doğruluğunu yoxlayır
    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        return BCrypt.checkpw(plainPassword, hashedPassword);
    }
}