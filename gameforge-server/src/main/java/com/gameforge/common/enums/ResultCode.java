package com.gameforge.common.enums;

public enum ResultCode {
  SUCCESS(0, "success"),
  FAILURE(1, "failure"),
  UNAUTHORIZED(403, "unauthorized");

  private final Integer code;
  private final String message;

  ResultCode(Integer code, String message) {
    this.code = code;
    this.message = message;
  }

  public Integer getCode() {
    return code;
  }

  public String getMessage() {
    return message;
  }
}
