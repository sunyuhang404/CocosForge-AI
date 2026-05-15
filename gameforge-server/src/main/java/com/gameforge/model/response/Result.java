package com.gameforge.model.response;

import com.gameforge.common.enums.ResultCode;

public record Result<T>(Integer code, String message, T data) {

  public static <T> Result<T> success(T data) {
    return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
  }

  public static <T> Result<T> success(String message, T data) {
    return new Result<>(ResultCode.SUCCESS.getCode(), message, data);
  }

  public static <T> Result<T> failure(String message) {
    return of(ResultCode.FAILURE, message, null);
  }

  public static <T> Result<T> failure(String message, T data) {
    return of(ResultCode.FAILURE, message, data);
  }

  public static <T> Result<T> unauthorized(String message) {
    return of(ResultCode.UNAUTHORIZED, message, null);
  }

  public static <T> Result<T> of(ResultCode resultCode) {
    return of(resultCode, resultCode.getMessage(), null);
  }

  public static <T> Result<T> of(ResultCode resultCode, String message, T data) {
    return new Result<>(resultCode.getCode(), message, data);
  }
}
