package com.gameforge.security;

import com.gameforge.common.exception.InvalidRefreshTokenException;
import com.gameforge.config.AuthProperties;
import com.gameforge.model.entity.User;
import jakarta.annotation.Resource;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenService {

  private static final int TOKEN_BYTES = 32;

  private final SecureRandom secureRandom = new SecureRandom();

  @Resource
  private AuthProperties authProperties;

  @Resource
  private RefreshTokenStore refreshTokenStore;

  public RefreshToken generateForUser(User user) {
    String token = generateToken();

    String oldToken = refreshTokenStore.findTokenByUserId(user.getId());
    if (oldToken != null && !oldToken.isBlank()) {
      refreshTokenStore.deleteToken(oldToken);
    }

    refreshTokenStore.save(user.getId(), token, authProperties.getRefreshTokenTtl());
    return new RefreshToken(token, Instant.now().plus(authProperties.getRefreshTokenTtl()));
  }

  public Long resolveUserId(String refreshToken) {
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new InvalidRefreshTokenException();
    }

    String userId = refreshTokenStore.findUserIdByToken(refreshToken.trim());
    if (userId == null || userId.isBlank()) {
      throw new InvalidRefreshTokenException();
    }

    try {
      return Long.valueOf(userId);
    } catch (NumberFormatException e) {
      throw new InvalidRefreshTokenException();
    }
  }

  public void revokeForUser(Long userId) {
    if (userId == null) {
      return;
    }
    refreshTokenStore.deleteByUserId(userId);
  }

  private String generateToken() {
    byte[] bytes = new byte[TOKEN_BYTES];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
