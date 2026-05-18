package com.gameforge.common.redis;

import java.time.Duration;

public interface RedisClient {

  void set(String key, String value, Duration ttl);

  String get(String key);

  boolean delete(String key);

  long clearByPattern(String pattern);
}
