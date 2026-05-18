package com.gameforge.config;

import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

  private static final int MIN_HMAC_SECRET_BYTES = 32;

  @Bean
  public SecretKey jwtSigningKey(JwtProperties jwtProperties) {
    String secret = jwtProperties.getSecret();
    if (secret == null || secret.isBlank()) {
      throw new IllegalStateException("gameforge.auth.jwt.secret 不能为空");
    }

    byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    if (secretBytes.length < MIN_HMAC_SECRET_BYTES) {
      throw new IllegalStateException("gameforge.auth.jwt.secret 至少需要 32 字节");
    }

    return Keys.hmacShaKeyFor(secretBytes);
  }
}
