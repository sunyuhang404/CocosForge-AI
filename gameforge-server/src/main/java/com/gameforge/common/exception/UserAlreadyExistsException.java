package com.gameforge.common.exception;

public class UserAlreadyExistsException extends RuntimeException {

  public UserAlreadyExistsException(String email) {
    super("用户已存在: " + email);
  }
}
