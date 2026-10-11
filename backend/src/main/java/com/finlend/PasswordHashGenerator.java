
package com.finlend;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder =
                new BCryptPasswordEncoder();

        String password = "FinLend@Test2026";

        System.out.println(
                "BCrypt Hash: " + encoder.encode(password)
        );
    }
}
