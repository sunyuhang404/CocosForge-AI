package com.gameforge.security;

import com.gameforge.common.redis.RedisClient;
import jakarta.annotation.Resource;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenStore {

  private static final String REFRESH_TOKEN_KEY_PREFIX = "auth:refresh:";
  private static final String USER_REFRESH_TOKEN_KEY_PREFIX = "auth:user:";
  private static final String USER_REFRESH_TOKEN_KEY_SUFFIX = ":refresh";

  @Resource
  private RedisClient redisClient;

  public String findTokenByUserId(Long userId) {
    return redisClient.get(userRefreshKey(userId));
  }

  public String findUserIdByToken(String refreshToken) {
    return redisClient.get(refreshTokenKey(refreshToken));
  }

  public void save(Long userId, String refreshToken, Duration ttl) {
    redisClient.set(refreshTokenKey(refreshToken), String.valueOf(userId), ttl);
    redisClient.set(userRefreshKey(userId), refreshToken, ttl);
  }

  public void deleteToken(String refreshToken) {
    redisClient.delete(refreshTokenKey(refreshToken));
  }

  public void deleteByUserId(Long userId) {
    String refreshToken = findTokenByUserId(userId);
    if (refreshToken != null && !refreshToken.isBlank()) {
      deleteToken(refreshToken);
    }
    redisClient.delete(userRefreshKey(userId));
  }

  private String refreshTokenKey(String token) {
    return REFRESH_TOKEN_KEY_PREFIX + token;
  }

  private String userRefreshKey(Long userId) {
    return USER_REFRESH_TOKEN_KEY_PREFIX + userId + USER_REFRESH_TOKEN_KEY_SUFFIX;
  }
}
