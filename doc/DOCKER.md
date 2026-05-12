## docker-compose.yml配置

version: '3.8'

networks:
store-net:
driver: bridge

services:

# --- 新增：PostgreSQL (用于 AI Agent 数据存储) ---

postgres:
image: postgres:15-alpine
container_name: postgres
restart: always
ports: - "5432:5432"
environment:
POSTGRES_USER: admin
POSTGRES_PASSWORD: "your_password"
POSTGRES_DB: game_forge
TZ: Asia/Shanghai
volumes: - ./postgres/data:/var/lib/postgresql/data
networks: - store-net

# --- 新增：ChromaDB (用于 RAG 向量检索，如果不需要可删掉) ---

chromadb:
image: chromadb/chroma:latest
container_name: chromadb
restart: always
ports: - "8000:8000"
volumes: - ./chroma/data:/index_data
networks: - store-net

# 1. MySQL 数据库

mysql:
image: mysql:8.0
container_name: mysql
restart: always
healthcheck:
test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost", "-uroot", "-p123123"]
interval: 5s # 每5秒检查一次
timeout: 5s # 检查超时
retries: 10 # 重试次数
start_period: 10s # 启动前10秒不检查

    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "123123"
      TZ: Asia/Shanghai
    volumes:
      - ./mysql/data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d # 自动执行初始化SQL
    networks:
      - store-net

# 2. Redis 缓存

redis:
image: redis:7.0
container_name: redis
restart: always
ports: - "6379:6379"
command: redis-server --appendonly yes
volumes: - ./redis/data:/data
networks: - store-net

# 3. Nacos 注册中心 (配置为连接外部 MySQL)

nacos:
image: nacos/nacos-server:v2.3.2
container_name: nacos
restart: always

    # --- 核心改进：先休眠 15 秒再执行原有的启动脚本 ---
    # command: sh -c "sleep 15 && /home/nacos/bin/docker-startup.sh"
    ports:
      - "8848:8848"
      - "9848:9848"
      - "9849:9849"
    environment:
      - MODE=standalone
      - SPRING_DATASOURCE_PLATFORM=mysql
      - MYSQL_SERVICE_HOST=mysql
      - MYSQL_SERVICE_PORT=3306
      - MYSQL_SERVICE_DB_NAME=nacos_config
      - MYSQL_SERVICE_USER=root
      - MYSQL_SERVICE_PASSWORD=123123
      - JVM_XMS=512m
      - JVM_XMX=512m
      # --- 核心修复：添加以下参数 ---
      - MYSQL_SERVICE_DB_PARAM=characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    depends_on:
      mysql:
        condition: service_healthy # 关键：只有mysql健康了，nacos才启动
    networks:
      - store-net

# 4. RocketMQ NameServer

rmqnamesrv:
image: apache/rocketmq:5.1.4
container_name: rmqnamesrv
restart: always
ports: - "9876:9876"
environment: - MAX_POSSIBLE_HEAP=100000000
command: sh mqnamesrv
networks: - store-net

# 5. RocketMQ Broker

rmqbroker:
image: apache/rocketmq:5.1.4
container_name: rmqbroker
restart: always
ports: - "10909:10909" - "10911:10911"
environment: - NAMESRV_ADDR=rmqnamesrv:9876 - MAX_POSSIBLE_HEAP=200000000
volumes: - ./rocketmq/broker/conf/broker.conf:/home/rocketmq/conf/broker.conf - ./rocketmq/broker/logs:/home/rocketmq/logs - ./rocketmq/broker/store:/home/rocketmq/store # 注意：这里的路径必须是镜像内实际存在的路径
command: sh mqbroker -c /home/rocketmq/conf/broker.conf
depends_on: - rmqnamesrv
networks: - store-net

# 6. RocketMQ Dashboard

rmqdashboard:
image: apacherocketmq/rocketmq-dashboard:latest
container_name: rmqdashboard
restart: always
ports: - "8081:8082" # 映射我们发现的8082内部端口
environment: - NAMESRV_ADDR=rmqnamesrv:9876
depends_on: - rmqbroker
networks: - store-net

# 7. MongoDB

mongodb:
image: mongo:4.4
container_name: mongodb
restart: always
ports: - "27017:27017"
volumes: - ./mongo/data:/data/db
networks: - store-net
