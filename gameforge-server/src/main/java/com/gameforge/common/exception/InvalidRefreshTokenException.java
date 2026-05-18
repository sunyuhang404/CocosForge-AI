package com.gameforge.common.exception;

public class InvalidRefreshTokenException extends RuntimeException {

  public InvalidRefreshTokenException() {
    super("refreshToken 无效或已过期");
  }
}
