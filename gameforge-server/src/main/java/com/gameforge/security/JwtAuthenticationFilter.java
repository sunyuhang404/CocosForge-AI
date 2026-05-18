package com.gameforge.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gameforge.config.AuthProperties;
import com.gameforge.model.response.Result;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.annotation.Resource;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.PathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final String BEARER_PREFIX = "Bearer ";

  private final PathMatcher pathMatcher = new AntPathMatcher();

  @Resource
  private AuthProperties authProperties;

  @Resource
  private JwtTokenService jwtTokenService;

  @Resource
  private ObjectMapper objectMapper;

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if (HttpMethod.OPTIONS.matches(request.getMethod())) {
      return true;
    }
    String path = request.getRequestURI();
    return authProperties.getPermitPaths().stream()
        .anyMatch(permitPath -> pathMatcher.match(permitPath, path));
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (authorization == null || authorization.isBlank()) {
      writeUnauthorized(response, "缺少 Authorization 请求头");
      return;
    }
    if (!authorization.startsWith(BEARER_PREFIX)) {
      writeUnauthorized(response, "Authorization 请求头格式错误");
      return;
    }

    String token = authorization.substring(BEARER_PREFIX.length()).trim();
    if (token.isBlank()) {
      writeUnauthorized(response, "缺少 token");
      return;
    }

    try {
      JwtClaims claims = jwtTokenService.parseAccessToken(token);
      CurrentUserContext.set(new CurrentUser(claims.userId(), claims.email()));
    } catch (ExpiredJwtException e) {
      writeUnauthorized(response, "token 已过期");
      return;
    } catch (JwtException | IllegalArgumentException e) {
      writeUnauthorized(response, "token 无效");
      return;
    }

    try {
      filterChain.doFilter(request, response);
    } finally {
      CurrentUserContext.clear();
    }
  }

  private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
    response.setStatus(HttpStatus.UNAUTHORIZED.value());
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), Result.unauthorized(message));
  }
}
