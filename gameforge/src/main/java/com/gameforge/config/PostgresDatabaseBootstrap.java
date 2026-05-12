package com.gameforge.config;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Locale;
import org.postgresql.Driver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 在 Spring 初始化数据源之前执行：若业务库不存在则创建（需连接账号具备 CREATEDB 或等价权限）。
 *
 * <p>由 {@code com.gameforge.autoconfigure.PostgresDatabaseBootstrapAutoConfiguration} 中 {@code @Bean}
 * 方法形参上的 {@code @Value} 注入配置。
 *
 * <p>关闭自动建库：{@code gameforge.database.skip-auto-create-database=true}（或 {@code
 * GAMEFORGE_SKIP_AUTO_CREATE_DB=true}，见 {@code application.yml}）。
 */
public final class PostgresDatabaseBootstrap {

  private static final Logger log = LoggerFactory.getLogger(PostgresDatabaseBootstrap.class);

  private static final String PREFIX = "jdbc:postgresql://";

  private PostgresDatabaseBootstrap() {}

  public static void ensureDatabaseExists(
      String jdbcUrl,
      String username,
      String password,
      String maintenanceDatabase,
      boolean skipAutoCreate) {
    if (skipAutoCreate) {
      log.info("已跳过自动建库（gameforge.database.skip-auto-create-database=true）");
      return;
    }
    if (jdbcUrl == null || jdbcUrl.isBlank()) {
      throw new IllegalStateException("缺少 spring.datasource.url，无法自动建库");
    }
    jdbcUrl = jdbcUrl.trim();
    if (!jdbcUrl.startsWith(PREFIX)) {
      log.debug("非 {} 数据源，跳过自动建库: {}", PREFIX, jdbcUrl);
      return;
    }
    if (username == null || username.isBlank()) {
      throw new IllegalStateException("缺少 spring.datasource.username，无法自动建库");
    }
    password = password != null ? password : "";
    String maintenanceDb =
        (maintenanceDatabase != null ? maintenanceDatabase : "postgres")
            .trim()
            .toLowerCase(Locale.ROOT);

    PgTarget target = parsePostgresJdbcUrl(jdbcUrl);
    String database = target.database().toLowerCase(Locale.ROOT);

    if (!isSafeSqlIdentifier(database)) {
      log.error("spring.datasource.url 中的库名非法（仅允许小写字母、数字、下划线）: {}", database);
      throw new IllegalArgumentException("Invalid database name in JDBC URL: " + database);
    }
    if (!isSafeSqlIdentifier(maintenanceDb)) {
      log.error("gameforge.database.maintenance-database 非法: {}", maintenanceDb);
      throw new IllegalArgumentException("Invalid maintenance database: " + maintenanceDb);
    }

    new Driver();

    String adminUrl = PREFIX + target.host() + ":" + target.port() + "/" + maintenanceDb;
    try (Connection connection = java.sql.DriverManager.getConnection(adminUrl, username, password);
        Statement statement = connection.createStatement()) {
      if (databaseExists(statement, database)) {
        log.debug("数据库已存在，跳过 CREATE DATABASE: {}", database);
        return;
      }
      statement.executeUpdate("CREATE DATABASE " + database + " WITH ENCODING 'UTF8'");
      log.info("已自动创建数据库: {}", database);
    } catch (SQLException e) {
      log.error(
          "自动建库失败（连接维护库 {}）。可设置 gameforge.database.skip-auto-create-database=true"
              + " 或手工执行 src/main/database/init_create_database.sql",
          maintenanceDb,
          e);
      throw new IllegalStateException("PostgreSQL 自动建库失败: " + e.getMessage(), e);
    }
  }

  private record PgTarget(String host, int port, String database) {}

  /** 解析 {@code jdbc:postgresql://host:port/db}，支持省略端口（默认 5432）与 IPv6 {@code [...]}。 */
  private static PgTarget parsePostgresJdbcUrl(String jdbcUrl) {
    if (!jdbcUrl.startsWith(PREFIX)) {
      throw new IllegalArgumentException("仅支持 jdbc:postgresql:// 数据源 URL: " + jdbcUrl);
    }
    String rest = jdbcUrl.substring(PREFIX.length());
    int pathSlash = rest.indexOf('/');
    if (pathSlash < 0) {
      throw new IllegalArgumentException("JDBC URL 缺少数据库路径: " + jdbcUrl);
    }
    String hostPart = rest.substring(0, pathSlash);
    String dbPart = rest.substring(pathSlash + 1);
    int q = dbPart.indexOf('?');
    String database = (q >= 0 ? dbPart.substring(0, q) : dbPart).trim();
    if (database.isEmpty()) {
      throw new IllegalArgumentException("JDBC URL 中数据库名为空: " + jdbcUrl);
    }

    String host;
    int port;
    if (hostPart.startsWith("[")) {
      int closing = hostPart.indexOf(']');
      if (closing < 0) {
        throw new IllegalArgumentException("无效的 IPv6 host: " + jdbcUrl);
      }
      host = hostPart.substring(1, closing);
      if (hostPart.length() > closing + 1 && hostPart.charAt(closing + 1) == ':') {
        port = Integer.parseInt(hostPart.substring(closing + 2));
      } else {
        port = 5432;
      }
    } else {
      int colon = hostPart.lastIndexOf(':');
      if (colon > 0) {
        host = hostPart.substring(0, colon);
        port = Integer.parseInt(hostPart.substring(colon + 1));
      } else {
        host = hostPart;
        port = 5432;
      }
    }
    return new PgTarget(host, port, database);
  }

  private static boolean databaseExists(Statement statement, String database) throws SQLException {
    String literal = "'" + database.replace("'", "''") + "'";
    try (ResultSet rs =
        statement.executeQuery(
            "SELECT 1 FROM pg_database WHERE datname = " + literal + " LIMIT 1")) {
      return rs.next();
    }
  }

  private static boolean isSafeSqlIdentifier(String s) {
    return s != null && s.length() <= 63 && s.matches("[a-z][a-z0-9_]*");
  }
}
