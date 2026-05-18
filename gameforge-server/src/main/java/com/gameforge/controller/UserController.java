package com.gameforge.controller;

import com.gameforge.common.annotation.RequestLog;
import com.gameforge.common.exception.InvalidCredentialsException;
import com.gameforge.common.exception.InvalidRefreshTokenException;
import com.gameforge.common.exception.UserAlreadyExistsException;
import com.gameforge.manager.UserManager;
import com.gameforge.model.entity.User;
import com.gameforge.model.request.LoginRequest;
import com.gameforge.model.request.RefreshTokenRequest;
import com.gameforge.model.request.RegisterRequest;
import com.gameforge.model.response.LoginResponse;
import com.gameforge.model.response.Result;
import com.gameforge.model.response.UserResponse;
import com.gameforge.security.CurrentUser;
import com.gameforge.security.JwtAccessToken;
import com.gameforge.security.JwtTokenService;
import com.gameforge.security.RefreshToken;
import com.gameforge.security.RefreshTokenService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequestLog
public class UserController extends BaseController {

  @Resource
  private UserManager userManager;

  @Resource
  private JwtTokenService jwtTokenService;

  @Resource
  private RefreshTokenService refreshTokenService;

  @PostMapping("/register")
  public Result<UserResponse> register(@RequestBody RegisterRequest request) {
    User user = userManager.register(request);
    log.info("User registered: id={}, email={}", user.getId(), user.getEmail());
    return Result.success(UserResponse.from(user));
  }

  @PostMapping("/login")
  public Result<LoginResponse> login(@RequestBody LoginRequest request) {
    User user = userManager.login(request);
    JwtAccessToken accessToken = jwtTokenService.generateAccessToken(user);
    RefreshToken refreshToken = refreshTokenService.generateForUser(user);
    log.info("User logged in: id={}, email={}", user.getId(), user.getEmail());
    return Result.success(LoginResponse.from(user, accessToken, refreshToken));
  }

  @PostMapping("/refresh-token")
  public Result<LoginResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
    Long userId = refreshTokenService.resolveUserId(request.refreshToken());
    User user = userManager.requireUser(userId);
    JwtAccessToken accessToken = jwtTokenService.generateAccessToken(user);
    RefreshToken refreshToken = refreshTokenService.generateForUser(user);
    log.info("User token refreshed: id={}, email={}", user.getId(), user.getEmail());
    return Result.success(LoginResponse.from(user, accessToken, refreshToken));
  }

  @PostMapping("/logout")
  public Result<Void> logout() {
    CurrentUser currentUser = getCurrentUser();
    refreshTokenService.revokeForUser(currentUser.id());
    log.info("User logged out: id={}, email={}", currentUser.id(), currentUser.email());
    return Result.success("退出登录成功", null);
  }

  @ExceptionHandler(UserAlreadyExistsException.class)
  public Result<Void> handleUserAlreadyExists(UserAlreadyExistsException e) {
    return Result.failure(e.getMessage());
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  public Result<Void> handleInvalidCredentials(InvalidCredentialsException e) {
    return Result.unauthorized(e.getMessage());
  }

  @ExceptionHandler(InvalidRefreshTokenException.class)
  public Result<Void> handleInvalidRefreshToken(InvalidRefreshTokenException e) {
    return Result.unauthorized(e.getMessage());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public Result<Void> handleIllegalArgument(IllegalArgumentException e) {
    return Result.failure(e.getMessage());
  }
}
