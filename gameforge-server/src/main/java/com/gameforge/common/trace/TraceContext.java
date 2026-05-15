package com.gameforge.common.trace;

import org.slf4j.MDC;

public final class TraceContext {

  public static final String TRACE_ID_HEADER = "X-traceId";
  public static final String TRACE_ID_KEY = "traceId";

  private static final ThreadLocal<String> TRACE_ID = new ThreadLocal<>();

  private TraceContext() {}

  public static void setTraceId(String traceId) {
    TRACE_ID.set(traceId);
    MDC.put(TRACE_ID_KEY, traceId);
  }

  public static String getTraceId() {
    return TRACE_ID.get();
  }

  public static void clear() {
    TRACE_ID.remove();
    MDC.remove(TRACE_ID_KEY);
  }
}
