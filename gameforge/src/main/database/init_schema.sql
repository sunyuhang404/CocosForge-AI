-- 在业务库 game_forge 上执行：\c game_forge 或连接串指向该库
-- users 须先于 session（session.user_id → users）
-- session / message / game_asset：BIGSERIAL 主键；会话业务 UUID 为 session_uuid
-- users：不额外建索引（仅主键与 email 唯一约束）
-- session_uuid：PostgreSQL 13+ 用 gen_random_uuid()；12 及以下需 CREATE EXTENSION pgcrypto

CREATE TYPE "SessionStatus" AS ENUM ('PLANNING', 'DEVELOPING', 'DONE');
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');
CREATE TYPE "AssetType" AS ENUM ('PLAN', 'CODE', 'IMAGE', 'BUILD');

CREATE TABLE users (
  id BIGSERIAL NOT NULL,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(200),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE session (
  id BIGSERIAL NOT NULL,
  session_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '新游戏项目',
  status "SessionStatus" NOT NULL DEFAULT 'PLANNING',
  root_dir TEXT NOT NULL,
  user_id BIGINT REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT session_pkey PRIMARY KEY (id),
  CONSTRAINT session_session_uuid_key UNIQUE (session_uuid)
);

CREATE INDEX session_user_id_idx ON session (user_id);

CREATE TABLE message (
  id BIGSERIAL NOT NULL,
  session_id BIGINT NOT NULL,
  role "MessageRole" NOT NULL,
  content TEXT NOT NULL,
  is_game_related BOOLEAN,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT message_pkey PRIMARY KEY (id),
  CONSTRAINT message_session_id_fkey FOREIGN KEY (session_id) REFERENCES session (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX message_session_id_created_at_idx ON message (session_id, created_at);

CREATE TABLE game_asset (
  id BIGSERIAL NOT NULL,
  session_id BIGINT NOT NULL,
  type "AssetType" NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT game_asset_pkey PRIMARY KEY (id),
  CONSTRAINT game_asset_session_id_fkey FOREIGN KEY (session_id) REFERENCES session (id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX game_asset_session_id_type_created_at_idx ON game_asset (session_id, type, created_at);

-- updated_at 由触发器刷新；不对 updated_at 建索引
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER session_set_updated_at
  BEFORE UPDATE ON session
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
