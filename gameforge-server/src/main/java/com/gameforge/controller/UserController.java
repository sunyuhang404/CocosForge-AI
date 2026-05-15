package com.gameforge.controller;

import com.gameforge.common.annotation.RequestLog;
import com.gameforge.common.exception.InvalidCredentialsException;
import com.gameforge.common.exception.UserAlreadyExistsException;
import com.gameforge.manager.UserManager;
import com.gameforge.model.entity.User;
import com.gameforge.model.request.LoginRequest;
import com.gameforge.model.request.RegisterRequest;
import com.gameforge.model.response.Result;
import com.gameforge.model.response.UserResponse;
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

  @PostMapping("/register")
  public Result<UserResponse> register(@RequestBody RegisterRequest request) {
    User user = userManager.register(request);
    log.info("User registered: id={}, email={}", user.getId(), user.getEmail());
    return Result.success(UserResponse.from(user));
  }

  @PostMapping("/login")
  public Result<UserResponse> login(@RequestBody LoginRequest request) {
    User user = userManager.login(request);
    log.info("User logged in: id={}, email={}", user.getId(), user.getEmail());
    return Result.success(UserResponse.from(user));
  }

  @ExceptionHandler(UserAlreadyExistsException.class)
  public Result<Void> handleUserAlreadyExists(UserAlreadyExistsException e) {
    return Result.failure(e.getMessage());
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  public Result<Void> handleInvalidCredentials(InvalidCredentialsException e) {
    return Result.unauthorized(e.getMessage());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public Result<Void> handleIllegalArgument(IllegalArgumentException e) {
    return Result.failure(e.getMessage());
  }
}
