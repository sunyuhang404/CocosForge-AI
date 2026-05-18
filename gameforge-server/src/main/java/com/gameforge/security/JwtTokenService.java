package com.gameforge.security;

import com.gameforge.config.JwtProperties;
import com.gameforge.model.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.Resource;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

  @Resource
  private JwtProperties jwtProperties;

  @Resource(name = "jwtSigningKey")
  private SecretKey signingKey;

  public JwtAccessToken generateAccessToken(User user) {
    Instant issuedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    Instant expiresAt = issuedAt.plus(jwtProperties.getAccessTokenTtl());

    String token =
        Jwts.builder()
            .subject(String.valueOf(user.getId()))
            .claim("email", user.getEmail())
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey, Jwts.SIG.HS256)
            .compact();

    return new JwtAccessToken(token, expiresAt);
  }

  public JwtClaims parseAccessToken(String token) {
    Claims claims =
        Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();

    return new JwtClaims(
        Long.valueOf(claims.getSubject()),
        claims.get("email", String.class),
        claims.getIssuedAt().toInstant(),
        claims.getExpiration().toInstant());
  }
}
