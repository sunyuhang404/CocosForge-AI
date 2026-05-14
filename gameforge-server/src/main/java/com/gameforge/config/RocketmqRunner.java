package com.gameforge.config;

import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(3)
class RocketmqRunner implements ApplicationRunner {

  private static final String PROBE_PRODUCER_GROUP = "_gameforge_startup_probe";

  private final String rocketmqNameServer;

  RocketmqRunner(@Value("${rocketmq.name-server}") String rocketmqNameServer) {
    this.rocketmqNameServer = rocketmqNameServer;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    DefaultMQProducer producer = new DefaultMQProducer(PROBE_PRODUCER_GROUP);
    producer.setNamesrvAddr(rocketmqNameServer);
    try {
      producer.start();
    } finally {
      producer.shutdown();
    }
  }
}
