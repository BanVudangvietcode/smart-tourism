package com.example.tourism.auth.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expirationMs}")
    private long jwtExpirationMs;

    @Value("${jwt.guest.expirationMs:#{604800000}}")
    private long guestExpirationMs; // 7 days for guest tokens

    /**
     * Generate a JWT token with custom claims.
     */
    public String generateToken(Long userId, String role, Map<String, Object> extraClaims) {
        Date now = new Date();
        long expMs = "GUEST".equals(role) ? guestExpirationMs : jwtExpirationMs;

        var builder = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expMs))
                .signWith(key());

        if (extraClaims != null) {
            extraClaims.forEach(builder::claim);
        }

        return builder.compact();
    }

    /**
     * Legacy method kept for backward compatibility with OTP-based auth.
     */
    public String generateJwtToken(String phone) {
        return Jwts.builder()
                .subject(phone)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserIdFromToken(String token) {
        return Long.valueOf(parseToken(token).getSubject());
    }

    public String getRoleFromToken(String token) {
        return parseToken(token).get("role", String.class);
    }

    public String getUserPhoneFromJwtToken(String token) {
        return Jwts.parser().verifyWith(key()).build()
               .parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
}
