package com.gameforge.config;

import java.sql.Connection;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
class DataSourceRunner implements ApplicationRunner {

  private final DataSource dataSource;

  DataSourceRunner(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    try (Connection c = dataSource.getConnection()) {
      c.getMetaData().getDatabaseProductName();
    }
  }
}
