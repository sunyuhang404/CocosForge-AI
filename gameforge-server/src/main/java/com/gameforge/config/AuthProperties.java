package com.gameforge.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "gameforge.auth")
public class AuthProperties {

  private List<String> permitPaths =
      new ArrayList<>(List.of("/api/users/login", "/api/users/register", "/api/users/refresh-token"));

  private Duration refreshTokenTtl = Duration.ofDays(7);

  public List<String> getPermitPaths() {
    return permitPaths;
  }

  public void setPermitPaths(List<String> permitPaths) {
    this.permitPaths = permitPaths;
  }

  public Duration getRefreshTokenTtl() {
    return refreshTokenTtl;
  }

  public void setRefreshTokenTtl(Duration refreshTokenTtl) {
    this.refreshTokenTtl = refreshTokenTtl;
  }
}
