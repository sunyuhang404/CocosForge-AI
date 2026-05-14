package com.gameforge.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component
@Order(2)
class RedisRunner implements ApplicationRunner {

  private final RedisConnectionFactory redisConnectionFactory;

  RedisRunner(RedisConnectionFactory redisConnectionFactory) {
    this.redisConnectionFactory = redisConnectionFactory;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    try (RedisConnection redis = redisConnectionFactory.getConnection()) {
      redis.ping();
    }
  }
}
