package com.gameforge.model.response;

import com.gameforge.model.entity.User;
import com.gameforge.security.JwtAccessToken;
import com.gameforge.security.RefreshToken;
import java.time.Instant;

public record LoginResponse(
    UserResponse user,
    String accessToken,
    String refreshToken,
    String tokenType,
    Instant expiresAt,
    Instant refreshTokenExpiresAt) {

  private static final String BEARER_TOKEN_TYPE = "Bearer";

  public static LoginResponse from(User user, JwtAccessToken accessToken, RefreshToken refreshToken) {
    return new LoginResponse(
        UserResponse.from(user),
        accessToken.token(),
        refreshToken.token(),
        BEARER_TOKEN_TYPE,
        accessToken.expiresAt(),
        refreshToken.expiresAt());
  }
}
