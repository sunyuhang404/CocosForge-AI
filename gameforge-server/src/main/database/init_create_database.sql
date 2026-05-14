-- PostgreSQL：在维护库（如默认库 postgres）上执行。
-- 或由 Java 服务启动时在 main 中自动执行等效逻辑（PostgresDatabaseBootstrap，需 CREATEDB 权限）。
-- 表结构由 Flyway 在首次连上业务库后迁移（见 src/main/resources/db/migration/V1__init_schema.sql）。
--
-- 与 DATABASE_URL / POSTGRES_DB 默认库名一致：game_forge

CREATE DATABASE game_forge WITH ENCODING 'UTF8';
