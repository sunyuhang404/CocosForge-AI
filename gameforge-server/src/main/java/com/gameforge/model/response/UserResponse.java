package com.gameforge.model.response;

import com.gameforge.model.entity.User;
import java.time.LocalDateTime;

public record UserResponse(
    Long id, String email, String displayName, LocalDateTime createdAt, LocalDateTime updatedAt) {

  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getEmail(),
        user.getDisplayName(),
        user.getCreatedAt(),
        user.getUpdatedAt());
  }
}
