# CMMS 会务管理系统

> Conference Management & Member Service — 一款以接待运营为核心的通用会务管理平台。

[![CI](https://github.com/hxd0818/cmms/actions/workflows/ci.yml/badge.svg)](https://github.com/hxd0818/cmms/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#license)

## 项目特点

- **以接待运营为核心**：不是日程发布系统，而是覆盖接送/住宿/餐饮/礼品/陪同全链路的运营工具
- **跨会议嘉宾沉淀**：VIP 档案长期累积，同一嘉宾参加多场会议只存一份
- **三端架构**：工作人员端（PC/H5）+ 嘉宾/陪同端（H5 扫码）+ 司机端（H5 链接）
- **现场实操导向**：任务看板、签到扫码、状态机驱动，服务真实接待场景
- **VIP 数据安全**：手机/身份证字段加密存储、有状态 token 可吊销、字段级权限脱敏

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端+后端 | Next.js (App Router + Turbopack) | 16.2.10 |
| 运行时 | React | 19.2.4 |
| UI | shadcn/ui + Tailwind CSS | 4.12 / v4 |
| 表单 | React Hook Form + Zod | 7.81 / 4.4 |
| 数据获取 | TanStack Query + RSC | 5.101 |
| ORM | Prisma | 7.8 |
| 数据库 | PostgreSQL | 16 |
| 缓存/队列 | Redis + BullMQ | 7 / 5.80 |
| 认证 | Auth.js (NextAuth v5) | beta.31 |
| 权限 | CASL.js | 7.0 |
| 测试 | Vitest + Playwright | 4.1 / 1.61 |
| 包管理 | pnpm | 11.13 |

## 快速开始

### 环境要求

- Node.js ≥ 22.13（pnpm 11 要求）
- Docker Desktop（用于 PostgreSQL + Redis）
- pnpm 11+（`npm install -g pnpm`）

### 启动开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量模板并填好密钥
cp .env.example .env
# 编辑 .env，生成 NEXTAUTH_SECRET 和 FIELD_ENCRYPTION_KEY（见文件注释）

# 3. 启动 PostgreSQL + Redis 容器
docker compose -f docker/docker-compose.yml up -d

# 4. 运行数据库迁移 + 种子数据
pnpm exec prisma migrate dev
pnpm db:seed

# 5. 启动 Web 开发服务器（端口 3010）
pnpm dev

# 6. 另开一个终端启动后台 Worker（处理 Excel 导入等任务）
pnpm worker:start
```

访问 http://localhost:3010/login，使用种子账号登录：
- `admin@cmms.local` / `admin123`（管理员）
- `viewer@cmms.local` / `viewer123`（只读用户）

### 端口分配

本项目刻意避开本机其他项目占用的端口：

| 服务 | 端口 | 备注 |
|---|---|---|
| Web (Next.js) | 3010 | cdep 用 3000、ccidscan 用 3001 |
| PostgreSQL | 5434 | cdep 用 5432、ccidscan 用 5433 |
| Redis | 6381 | cdep 用 6379 |

## 项目状态

| 阶段 | 状态 | 内容 |
|---|---|---|
| Phase 0 | ✅ 完成 (`v0.1.0-foundation`) | 项目骨架、认证、CI |
| Phase 1 | ✅ 完成 (`v0.2.0-guest-module`) | 嘉宾信息库（参考实现） |
| Phase 2 | 🚧 计划已就绪 | Meeting/Reception/Transport/Driver |
| Phase 3 | 🚧 计划已就绪 | Lodging/Catering/Gift/Fee/360 视图 |
| Phase 4 | 🚧 计划已就绪 | 报表/通知/审计/生产硬化 |

详见 [CHANGELOG.md](./CHANGELOG.md) 与 [docs/plans/](./docs/plans/)。

## 文档导航

| 文档 | 内容 |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构概览（一图读懂） |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 开发环境详细指南 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 生产部署流程 |
| [SECURITY.md](./SECURITY.md) | 安全设计与最佳实践 |
| [TESTING.md](./TESTING.md) | 测试策略与覆盖目标 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献规范 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录 |
| [CLAUDE.md](./CLAUDE.md) | AI 辅助开发项目级规范 |
| [docs/plans/](./docs/plans/) | 设计文档与各阶段实施计划 |

## 项目结构

```
cmms/
├── app/                    # Next.js App Router
│   ├── (staff)/            # 工作人员端路由组（需登录）
│   │   ├── dashboard/
│   │   ├── guests/
│   │   └── meetings/
│   ├── guest/[token]/      # 嘉宾/陪同扫码端
│   ├── driver/[token]/     # 司机端
│   ├── actions/            # Server Actions
│   └── api/                # Route Handlers
├── components/             # UI 组件
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── guests/
│   └── ...
├── lib/
│   ├── domain/             # 领域模块（按业务划分）
│   │   ├── guest/
│   │   ├── meeting/
│   │   └── ...
│   ├── auth/               # 认证与权限
│   ├── db/                 # Prisma client + 字段加密
│   ├── queue/              # BullMQ 队列定义
│   ├── shared/             # 共享 Zod schema + 错误类
│   └── utils/
├── prisma/                 # Schema + migrations + seed
├── worker/                 # 独立 worker 进程入口
├── tests/                  # 单元测试 + E2E 测试
├── docker/                 # Docker Compose + 数据目录
└── docs/                   # 文档
    └── plans/              # 设计与实施计划
```

## License

Proprietary — 内部使用，未授权禁止复制、分发、商用。

## 联系方式

- 仓库：https://github.com/hxd0818/cmms
- Issues：https://github.com/hxd0818/cmms/issues
