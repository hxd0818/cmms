# Deployment

> 生产环境部署指南。当前推荐：单机 Docker Compose（单组织内部系统，不需要 K8s）。

## 1. 部署架构

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │   Nginx (HTTPS) │  ← Let's Encrypt 证书
              │   反向代理       │
              └────────┬────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│  Next.js Web    │          │    Worker       │
│  (port 3000     │          │  (BullMQ async) │
│   内网)         │          │                 │
└────────┬────────┘          └────────┬────────┘
         │                            │
         └──────────┬─────────────────┘
                    ▼
         ┌─────────────────┐
         │  PostgreSQL 16  │
         │  + Redis 7      │
         │  (持久化卷)     │
         └─────────────────┘
```

## 2. 生产环境清单

### 2.1 服务器要求

- CPU: 2 核+
- 内存: 4GB+
- 磁盘: 50GB+（含数据库历史）
- OS: Ubuntu 22.04 LTS 或 Debian 12
- Docker 24+
- Docker Compose v2+

### 2.2 域名与证书

- 一个域名（如 `cmms.example.com`）
- Let's Encrypt 免费证书（用 certbot 自动续期）

### 2.3 必备密钥

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 生成 FIELD_ENCRYPTION_KEY（数据库字段加密）
openssl rand -hex 32
# ⚠️ 一旦确定后不可更改，否则已加密数据无法解密！
# 务必备份到密码管理器（如 1Password、Bitwarden）

# 数据库密码（生产用强密码）
openssl rand -base64 24 | tr -d '/+=' | head -c 32

# Redis 密码
openssl rand -base64 24 | tr -d '/+=' | head -c 32
```

## 3. 部署步骤

### 3.1 服务器初始化

```bash
# SSH 到服务器
ssh user@your-server

# 安装 Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# 安装 docker-compose-plugin（已在 get.docker.com 中包含）

# 安装 Git
sudo apt update && sudo apt install -y git

# Clone 仓库
git clone https://github.com/hxd0818/cmms.git
cd cmms
```

### 3.2 配置生产环境

```bash
# 创建生产 .env（不要复用 .env.example）
cp .env.example .env.production

# 编辑 .env.production，填入：
# - DATABASE_URL（用强密码）
# - REDIS_URL（用强密码）
# - NEXTAUTH_SECRET（用上面生成的）
# - NEXTAUTH_URL=https://cmms.example.com
# - FIELD_ENCRYPTION_KEY（用上面生成的，⚠️ 永久保存）
# - NODE_ENV=production
# - LOG_LEVEL=info
```

### 3.3 创建生产 Docker Compose

```yaml
# docker/docker-compose.prod.yml
services:
  web:
    image: cmms:latest
    build: .
    restart: always
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks: [internal]
    healthcheck:
      test: ['CMD', 'wget', '--quiet', '--spider', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    image: cmms:latest
    build: .
    restart: always
    command: pnpm worker:start
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks: [internal]

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres-backups:/backups  # 挂载备份目录
    networks: [internal]
    healthcheck:
      test: ['CMD-SHELL', f'pg_isready -U $${POSTGRES_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks: [internal]
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '$REDIS_PASSWORD', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    restart: always
    ports: ['80:80', '443:443']
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./docker/certbot:/var/www/certbot
    networks: [internal]
    depends_on: [web]

networks:
  internal:

volumes:
  postgres_data:
  redis_data:
```

### 3.4 Nginx 配置

```nginx
# docker/nginx.conf
events {}
http {
  server {
    listen 80;
    server_name cmms.example.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
      root /var/www/certbot;
    }

    location / {
      return 301 https://$host$request_uri;
    }
  }

  server {
    listen 443 ssl http2;
    server_name cmms.example.com;

    ssl_certificate /etc/letsencrypt/live/cmms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cmms.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Upload limit for Excel import
    client_max_body_size 10M;

    location / {
      proxy_pass http://web:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

### 3.5 首次部署

```bash
# 1. 申请 SSL 证书
sudo apt install -y certbot
sudo certbot certonly --standalone -d cmms.example.com

# 2. 构建镜像
docker compose -f docker/docker-compose.prod.yml build

# 3. 启动数据库
docker compose -f docker/docker-compose.prod.yml up -d postgres redis

# 4. 等待健康
docker compose -f docker/docker-compose.prod.yml ps  # 等待 healthy

# 5. 运行数据库迁移
docker compose -f docker/docker-compose.prod.yml run --rm web \
  pnpm exec prisma migrate deploy

# 6. 创建超级管理员（一次性）
docker compose -f docker/docker-compose.prod.yml run --rm web \
  pnpm exec tsx prisma/seed/index.ts
# ⚠️ 立即修改 admin 密码！

# 7. 启动所有服务
docker compose -f docker/docker-compose.prod.yml up -d

# 8. 验证
curl https://cmms.example.com/api/health
```

## 4. 持续部署（CD）

GitHub Actions 自动部署（可选）：

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push image
        run: |
          docker build -t cmms:${{ github.ref_name }} .
          docker tag cmms:${{ github.ref_name }} cmms:latest
          # Push to registry (GHCR / Docker Hub / 自建)
      - name: SSH deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/cmms
            git pull
            docker compose -f docker/docker-compose.prod.yml pull
            docker compose -f docker/docker-compose.prod.yml up -d --remove-orphans
            docker compose -f docker/docker-compose.prod.yml exec -T web \
              pnpm exec prisma migrate deploy
```

## 5. 数据库备份

### 5.1 自动备份脚本

```bash
# /opt/cmms/backup.sh
#!/bin/bash
set -e

BACKUP_DIR=/opt/cmms/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# 全量逻辑备份
docker exec cmms-postgres-prod pg_dump -U $DB_USER $DB_NAME | gzip > \
  $BACKUP_DIR/cmms_$TIMESTAMP.sql.gz

# 清理旧备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: cmms_$TIMESTAMP.sql.gz"
```

加入 crontab：

```bash
# 每日凌晨 3 点备份
0 3 * * * /opt/cmms/backup.sh >> /var/log/cmms-backup.log 2>&1
```

### 5.2 WAL 持续归档（增量）

启用 PostgreSQL WAL 归档，可恢复到任意时间点（PITR）：

```yaml
# docker/postgres-custom.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backups/wal/%f && cp %p /backups/wal/%f'
archive_timeout = 60s
```

### 5.3 恢复演练（每季度）

```bash
# 在测试环境验证备份可用
docker run --rm \
  -v $(pwd)/backups/cmms_20260715_030000.sql.gz:/backup.sql.gz \
  postgres:16-alpine \
  sh -c "gunzip -c /backup.sql.gz | psql -h <test-db> -U cmms cmms"
```

## 6. 监控

### 6.1 健康检查

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'ok' });
  } catch (e) {
    return NextResponse.json({ status: 'error', db: 'fail' }, { status: 503 });
  }
}
```

### 6.2 日志聚合

应用日志通过 Pino 输出 JSON，由 Docker 收集：

```bash
# 查看实时日志
docker compose -f docker/docker-compose.prod.yml logs -f web worker

# 导出最近 1 小时日志
docker compose -f docker/docker-compose.prod.yml logs --since 1h web > web.log
```

### 6.3 Sentry（错误监控）

```bash
# .env.production 加
SENTRY_DSN=https://xxx@sentry.io/123
```

应用启动时自动初始化 Sentry（如已配置）。

### 6.4 简单 Prometheus metrics（可选）

后续可加 `/api/metrics` 端点暴露 Prometheus 格式指标。

## 7. 升级流程

### 7.1 应用升级

```bash
cd /opt/cmms
git pull origin main
docker compose -f docker/docker-compose.prod.yml build
docker compose -f docker/docker-compose.prod.yml up -d
# 自动滚动更新（先启动新容器 → 健康检查 → 切换流量 → 关旧容器）
```

### 7.2 数据库 schema 升级

```bash
# 总是用 prisma migrate deploy（非 dev），只应用已 commit 的 migrations
docker compose -f docker/docker-compose.prod.yml exec -T web \
  pnpm exec prisma migrate deploy

# ⚠️ 禁止在生产用 prisma migrate dev（会创建新 migration）
```

### 7.3 回滚

```bash
# 回滚到上一个镜像版本
docker compose -f docker/docker-compose.prod.yml down
docker tag cmms:v0.2.0 cmms:latest  # 改 tag 指向上个版本
docker compose -f docker/docker-compose.prod.yml up -d

# 数据库回滚（需要先备份当前数据库！）
# Prisma 不自动生成 down migration，需手动写 SQL
```

## 8. 故障处理

### 数据库无法启动

```bash
# 检查数据卷
docker compose -f docker/docker-compose.prod.yml logs postgres

# 如果数据损坏，从备份恢复：
docker compose -f docker/docker-compose.prod.yml down postgres
docker volume rm cmms_postgres_data
docker volume create cmms_postgres_data
docker compose -f docker/docker-compose.prod.yml up -d postgres
# 等待启动，然后恢复备份
gunzip -c /opt/cmms/backups/cmms_<latest>.sql.gz | \
  docker exec -i cmms-postgres-prod psql -U cmms cmms
```

### 字段加密密钥泄露

- ⚠️ **极其严重**：FIELD_ENCRYPTION_KEY 泄露 = 所有加密字段可被解密
- 立即步骤：
  1. 评估泄露范围（哪些数据可能被获取）
  2. 通知受影响嘉宾
  3. 轮换密钥（需要先解密所有数据，再换密钥重新加密）

### Redis 故障

```bash
# BullMQ 任务队列丢失 → 重新触发失败的导入任务
# 应用层状态不会丢（在 PostgreSQL）
docker compose -f docker/docker-compose.prod.yml restart redis
```

## 9. 安全检查清单（部署前）

- [ ] 所有密钥使用强随机值（`openssl rand`）
- [ ] FIELD_ENCRYPTION_KEY 已备份到密码管理器（不可丢失！）
- [ ] 数据库密码、Redis 密码已配置
- [ ] HTTPS 证书已申请且自动续期
- [ ] admin@cmms.local 默认密码已修改
- [ ] viewer@cmms.local 已删除或密码已改
- [ ] Sentry DSN 已配置
- [ ] 数据库备份脚本已加入 crontab
- [ ] 一次完整的备份+恢复演练已完成
- [ ] 防火墙只放行 80/443 端口
- [ ] SSH 禁止密码登录（仅 key）
- [ ] Docker 容器未使用 root 用户

## 10. 性能调优

### 10.1 PostgreSQL

```conf
# docker/postgres-custom.conf
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB
max_connections = 100
```

### 10.2 Next.js

```typescript
// next.config.ts 增加
export default {
  experimental: {
    // 启用 React Compiler（Next.js 16）
    reactCompiler: true,
  },
  // 静态资源缓存
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
```

### 10.3 Nginx 启用 gzip/brotli

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```
