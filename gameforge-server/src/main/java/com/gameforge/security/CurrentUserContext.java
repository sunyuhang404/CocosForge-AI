package com.gameforge.security;

import java.util.Optional;

public final class CurrentUserContext {

  private static final ThreadLocal<CurrentUser> CURRENT_USER = new ThreadLocal<>();

  private CurrentUserContext() {}

  public static void set(CurrentUser currentUser) {
    CURRENT_USER.set(currentUser);
  }

  public static Optional<CurrentUser> get() {
    return Optional.ofNullable(CURRENT_USER.get());
  }

  public static CurrentUser require() {
    return get().orElseThrow(() -> new IllegalStateException("当前请求未登录"));
  }

  public static void clear() {
    CURRENT_USER.remove();
  }
}
