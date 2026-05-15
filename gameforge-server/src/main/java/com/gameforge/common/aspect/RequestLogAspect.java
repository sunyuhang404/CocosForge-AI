package com.gameforge.common.aspect;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.gameforge.common.trace.TraceContext;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

@Aspect
@Component
public class RequestLogAspect {

  private static final Logger log = LoggerFactory.getLogger(RequestLogAspect.class);
  private static final String MASK_VALUE = "******";
  private static final List<String> SENSITIVE_KEYS =
      List.of("password", "token", "secret", "authorization", "credential");

  @Resource
  private ObjectMapper objectMapper;

  @Around("@within(com.gameforge.common.annotation.RequestLog) || @annotation(com.gameforge.common.annotation.RequestLog)")
  public Object logRequest(ProceedingJoinPoint joinPoint) throws Throwable {
    HttpServletRequest request = currentRequest();
    String traceId = TraceContext.getTraceId();
    String ip = request == null ? "" : getClientIp(request);
    String path = request == null ? "" : request.getRequestURI();
    String params = toJson(maskSensitiveValues(filterArgs(joinPoint.getArgs())));

    Object result = joinPoint.proceed();
    String response = toJson(maskSensitiveValues(result));

    log.info(
        "Request log: traceId={}, ip={}, path={}, params={}, response={}",
        traceId,
        ip,
        path,
        params,
        response);
    return result;
  }

  private HttpServletRequest currentRequest() {
    RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
    if (attributes instanceof ServletRequestAttributes servletRequestAttributes) {
      return servletRequestAttributes.getRequest();
    }
    return null;
  }

  private String getClientIp(HttpServletRequest request) {
    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (hasText(forwardedFor)) {
      return forwardedFor.split(",")[0].trim();
    }

    String realIp = request.getHeader("X-Real-IP");
    if (hasText(realIp)) {
      return realIp.trim();
    }

    return request.getRemoteAddr();
  }

  private List<Object> filterArgs(Object[] args) {
    List<Object> filteredArgs = new ArrayList<>();
    if (args == null) {
      return filteredArgs;
    }

    for (Object arg : args) {
      if (arg == null
          || arg instanceof HttpServletRequest
          || arg instanceof HttpServletResponse
          || arg instanceof MultipartFile
          || arg instanceof MultipartFile[]) {
        continue;
      }
      filteredArgs.add(arg);
    }
    return filteredArgs;
  }

  private Object maskSensitiveValues(Object value) {
    JsonNode node = objectMapper.valueToTree(value);
    maskSensitiveNode(node);
    return node;
  }

  private void maskSensitiveNode(JsonNode node) {
    if (node == null) {
      return;
    }

    if (node instanceof ObjectNode objectNode) {
      Iterator<Map.Entry<String, JsonNode>> fields = objectNode.fields();
      while (fields.hasNext()) {
        Map.Entry<String, JsonNode> field = fields.next();
        if (isSensitiveKey(field.getKey())) {
          objectNode.put(field.getKey(), MASK_VALUE);
        } else {
          maskSensitiveNode(field.getValue());
        }
      }
      return;
    }

    if (node instanceof ArrayNode arrayNode) {
      arrayNode.forEach(this::maskSensitiveNode);
    }
  }

  private boolean isSensitiveKey(String key) {
    String normalizedKey = key.toLowerCase(Locale.ROOT);
    return SENSITIVE_KEYS.stream().anyMatch(normalizedKey::contains);
  }

  private String toJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException e) {
      return String.valueOf(value);
    }
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank() && !"unknown".equalsIgnoreCase(value);
  }
}
