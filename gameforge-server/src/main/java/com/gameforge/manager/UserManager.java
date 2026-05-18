package com.gameforge.manager;

import com.gameforge.common.exception.InvalidCredentialsException;
import com.gameforge.common.exception.InvalidRefreshTokenException;
import com.gameforge.common.exception.UserAlreadyExistsException;
import com.gameforge.model.entity.User;
import com.gameforge.model.request.LoginRequest;
import com.gameforge.model.request.RegisterRequest;
import com.gameforge.service.UserService;
import jakarta.annotation.Resource;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserManager {

  @Resource
  private UserService userService;

  @Resource
  private PasswordEncoder passwordEncoder;

  @Transactional
  public User register(RegisterRequest request) {
    String normalizedEmail = normalizeEmail(request.email());
    requirePassword(request.password());

    if (userService.findByEmail(normalizedEmail).isPresent()) {
      throw new UserAlreadyExistsException(normalizedEmail);
    }

    try {
      return userService.create(
          normalizedEmail,
          passwordEncoder.encode(request.password()),
          normalizeDisplayName(request.displayName()));
    } catch (DataIntegrityViolationException e) {
      throw new UserAlreadyExistsException(normalizedEmail);
    }
  }

  @Transactional(readOnly = true)
  public User login(LoginRequest request) {
    String normalizedEmail = normalizeEmail(request.email());
    requirePassword(request.password());

    User user = userService.findByEmail(normalizedEmail).orElseThrow(InvalidCredentialsException::new);
    if (user.getPasswordHash() == null
        || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new InvalidCredentialsException();
    }
    return user;
  }

  @Transactional(readOnly = true)
  public User requireUser(Long userId) {
    if (userId == null) {
      throw new InvalidRefreshTokenException();
    }
    return userService.findById(userId).orElseThrow(InvalidRefreshTokenException::new);
  }

  private String normalizeEmail(String email) {
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("邮箱不能为空");
    }
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private void requirePassword(String password) {
    if (password == null || password.isBlank()) {
      throw new IllegalArgumentException("密码不能为空");
    }
  }

  private String normalizeDisplayName(String displayName) {
    if (displayName == null || displayName.isBlank()) {
      return null;
    }
    return displayName.trim();
  }
}
