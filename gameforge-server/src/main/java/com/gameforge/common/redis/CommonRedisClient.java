package com.gameforge.common.redis;

import jakarta.annotation.Resource;
import java.time.Duration;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class CommonRedisClient implements RedisClient {

  @Resource
  private StringRedisTemplate stringRedisTemplate;

  @Override
  public void set(String key, String value, Duration ttl) {
    stringRedisTemplate.opsForValue().set(key, value, ttl);
  }

  @Override
  public String get(String key) {
    return stringRedisTemplate.opsForValue().get(key);
  }

  @Override
  public boolean delete(String key) {
    return Boolean.TRUE.equals(stringRedisTemplate.delete(key));
  }

  @Override
  public long clearByPattern(String pattern) {
    Long deleted =
        stringRedisTemplate.execute(
            (RedisCallback<Long>)
                connection -> {
                  long count = 0;
                  ScanOptions options = ScanOptions.scanOptions().match(pattern).count(1000).build();
                  try (Cursor<byte[]> cursor = connection.scan(options)) {
                    while (cursor.hasNext()) {
                      Long result = connection.del(cursor.next());
                      if (result != null) {
                        count += result;
                      }
                    }
                  }
                  return count;
                });
    return deleted == null ? 0 : deleted;
  }
}
