package com.gameforge.autoconfigure;

import javax.sql.DataSource;
import com.gameforge.config.PostgresDatabaseBootstrap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * 在 {@link DataSource} 自动配置之前执行 PostgreSQL 建库；配置通过 {@code @Value} 注入（与业务类字段
 * {@code @Value} 同源）。
 */
@AutoConfiguration(before = DataSourceAutoConfiguration.class)
@ConditionalOnClass(DataSource.class)
@ConditionalOnProperty(prefix = "spring.datasource", name = "url")
public class PostgresDatabaseBootstrapAutoConfiguration {

  /** 占位 Bean，保证带 {@code @Value} 的工厂方法在创建数据源前执行完毕。 */
  public record PostgresDatabaseBootstrapMarker() {}

  @Bean
  public PostgresDatabaseBootstrapMarker postgresDatabaseBootstrapMarker(
      @Value("${spring.datasource.url}") String jdbcUrl,
      @Value("${spring.datasource.username}") String username,
      @Value("${spring.datasource.password:}") String password,
      @Value("${gameforge.database.maintenance-database:postgres}") String maintenanceDatabase,
      @Value("${gameforge.database.skip-auto-create-database:false}") boolean skipAutoCreate) {
    PostgresDatabaseBootstrap.ensureDatabaseExists(
        jdbcUrl, username, password, maintenanceDatabase, skipAutoCreate);
    return new PostgresDatabaseBootstrapMarker();
  }
}
