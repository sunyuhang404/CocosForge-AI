package com.gameforge.common.trace;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TraceFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    String traceId = UUID.randomUUID().toString().replace("-", "");
    TraceContext.setTraceId(traceId);
    response.setHeader(TraceContext.TRACE_ID_HEADER, traceId);

    try {
      filterChain.doFilter(request, response);
    } finally {
      TraceContext.clear();
    }
  }
}
