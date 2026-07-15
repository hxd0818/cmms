# Development

> 完整的开发环境搭建、日常开发命令、调试技巧。

## 1. 环境要求

| 工具            | 最低版本 | 备注                                                  |
| --------------- | -------- | ----------------------------------------------------- |
| Node.js         | 22.13+   | pnpm 11 强制要求（用 `node --version` 确认）          |
| pnpm            | 11.13+   | `npm install -g pnpm`                                 |
| Docker Desktop  | 最新     | 用于 PostgreSQL + Redis                               |
| Git             | 2.40+    |                                                       |
| VS Code（推荐） | 最新     | 安装 ESLint、Prettier、Tailwind CSS IntelliSense 扩展 |

可选：

- PostgreSQL GUI：`pnpm exec prisma studio`（无需额外工具）
- Redis GUI：`redis-insight`（可选）
- API 测试：Hoppscotch / Postman

## 2. 首次搭建

```bash
# 1. Clone
git clone https://github.com/hxd0818/cmms.git
cd cmms

# 2. 安装依赖
pnpm install
# 首次安装时 pnpm 会列出未批准的 build scripts，参考 .npmrc 配置已忽略

# 3. 复制并填好环境变量
cp .env.example .env

# 编辑 .env，填入两个密钥：
# - NEXTAUTH_SECRET: openssl rand -base64 32
# - FIELD_ENCRYPTION_KEY: openssl rand -hex 32

# 4. 启动 PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# 5. 验证容器健康
docker compose -f docker/docker-compose.yml ps
# 应看到 cmms-postgres 和 cmms-redis 都是 healthy

# 6. 运行数据库迁移 + 种子数据
pnpm exec prisma migrate dev
pnpm db:seed

# 7. 启动开发服务器
pnpm dev
# → http://localhost:3010

# 8. 另开终端启动后台 Worker（处理 Excel 导入等异步任务）
pnpm worker:start
```

打开 http://localhost:3010/login，用 `admin@cmms.local` / `admin123` 登录。

## 3. 日常开发命令

### 开发服务器

```bash
pnpm dev                  # Next.js dev server (port 3010, 自动热重载)
pnpm worker:start         # BullMQ worker (独立终端)
```

**首次访问功能前**，确保两个都启动：

- `pnpm dev` 提供 Web 界面
- `pnpm worker:start` 处理 Excel 导入、通知等异步任务

### 数据库操作

```bash
# 修改 prisma/schema.prisma 后
pnpm exec prisma migrate dev --name <migration_name>

# 仅生成 client（不创建 migration，用于 dev 快速迭代）
pnpm db:generate

# 重置数据库（开发期，会清空所有数据！）
pnpm exec prisma migrate reset

# 重新 seed
pnpm db:seed

# 可视化数据库（浏览器 GUI）
pnpm exec prisma studio
# → http://localhost:5555

# 直接连接 PostgreSQL（psql）
docker exec -it cmms-postgres psql -U cmms -d cmms
```

### 质量检查

```bash
pnpm lint                 # ESLint 检查
pnpm typecheck            # TypeScript 严格检查
pnpm format               # Prettier 自动修复
pnpm format:check         # CI 用，不修复只检查

# 测试
pnpm test                 # Vitest 单元测试（一次性运行）
pnpm test:watch           # Vitest watch 模式
pnpm test:ui              # Vitest UI（浏览器）
pnpm test:e2e             # Playwright E2E（会自动启动 dev server）

# 仅跑某个测试文件
pnpm test tests/unit/guest/schema.test.ts
pnpm test:e2e tests/e2e/guests.spec.ts

# 推送前自检（必须全绿）
pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

### Docker 操作

```bash
# 启动
docker compose -f docker/docker-compose.yml up -d

# 停止
docker compose -f docker/docker-compose.yml down

# 停止 + 清空数据（注意：会丢失所有数据！）
docker compose -f docker/docker-compose.yml down -v

# 查看日志
docker logs cmms-postgres -f
docker logs cmms-redis -f

# 进入容器
docker exec -it cmms-postgres bash
docker exec -it cmms-redis redis-cli
```

## 4. 项目结构与开发范式

### 4.1 添加新领域模块（参考 Guest 模块）

按以下顺序，每步完成 commit：

```bash
# 1. Prisma schema + migration
# 修改 prisma/schema.prisma，加 model + enum
pnpm exec prisma migrate dev --name add_<module>
pnpm db:generate

# 2. 共享 Zod schema
# 创建 lib/shared/<module>.ts

# 3. 领域三层
# 创建 lib/domain/<module>/{types,repository,service}.ts
# Repository: CRUD + 软删除 + 搜索 + 分页
# Service: 业务规则 + 错误处理 + 状态机

# 4. 测试（TDD：先写测试，再实现）
# 创建 tests/unit/<module>/{schema,repository,service}.test.ts

# 5. CASL 权限
# 修改 lib/auth/abilities.ts，加 AppSubject

# 6. Server Actions
# 创建 app/actions/<module>.actions.ts

# 7. UI
# 创建 app/(staff)/<module>/{page,[id]/page,new/page,...}.tsx
# 创建 components/<module>/{Form,List,...}.tsx

# 8. E2E 测试
# 创建 tests/e2e/<module>.spec.ts
```

详见 `lib/domain/guest/` 作为参考实现。

### 4.2 添加新加密字段

```typescript
// lib/db/prisma-extensions.ts
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Guest: ['phone', 'idNumber'],
  // 加新字段：
  // SomeModel: ['secretField'],
};
```

无需改其他代码，Prisma `$extends` 拦截器自动处理。

### 4.3 添加新 Server Action

```typescript
// app/actions/<module>.actions.ts
'use server';

import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';

export async function doSomething(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'SomeSubject');

    const data = someSchema.parse(input);
    const result = await someService.create(data);
    revalidatePath('/some-path');

    return { ok: true, data: { id: result.id } };
  } catch (e) {
    return handleError(e);
  }
}
```

### 4.4 添加 shadcn 组件

```bash
pnpm dlx shadcn@4.12.0 add <component-name>
# 注意：用 4.12 版本（4.13 与 Next.js 16 有兼容问题）
```

## 5. 调试技巧

### 5.1 Prisma 查询日志

开发环境下，Prisma 自动打印所有 SQL 查询。如需更详细日志：

```bash
# .env 中临时调整
LOG_LEVEL=debug
```

### 5.2 BullMQ 任务监控

```bash
# 安装 Bull Dashboard（可选）
pnpm add -g @bull-board/api @bull-board/express
# 或直接看 Redis
docker exec -it cmms-redis redis-cli KEYS 'bull:*'
```

### 5.3 字段加密验证

直接查数据库验证加密生效：

```bash
docker exec cmms-postgres psql -U cmms -d cmms -c "SELECT phone FROM guests LIMIT 3;"
# 应看到 enc: 开头的密文，而不是明文手机号
```

应用层读出来是明文：

```bash
docker exec cmms-postgres psql -U cmms -d cmms -c "SELECT name, phone FROM guests LIMIT 3;"
# 注意：psql 看到的是密文；通过 Prisma client 查询是明文
```

### 5.4 Token 调试

```bash
# 看所有有效 token
docker exec cmms-postgres psql -U cmms -d cmms -c \
  "SELECT id, meeting_guest_id, expires_at, revoked_at FROM guest_access_tokens;"

# 吊销某 token（开发期手动）
docker exec cmms-postgres psql -U cmms -d cmms -c \
  "UPDATE guest_access_tokens SET revoked_at = NOW() WHERE meeting_guest_id = '<id>';"
```

### 5.5 E2E 测试调试

```bash
# 仅跑某个测试
pnpm test:e2e guests.spec.ts

# 显示浏览器窗口（headed mode）
pnpm exec playwright test --headed

# 暂停模式（点击页面会暂停）
pnpm exec playwright test --debug

# 查看 trace（失败后）
pnpm exec playwright show-trace test-results/<test-name>/trace.zip
```

## 6. 常见问题

### Q: 启动报 `EPERM: operation not permitted`

A: pnpm corepack 在 Windows 需要管理员权限。改用 `npm install -g pnpm`。

### Q: `pnpm install` 后报 `[ERR_PNPM_IGNORED_BUILDS]`

A: 已在 `pnpm-workspace.yaml` 配置 `onlyBuiltDependencies`。CI 模式用 `pnpm install --config.dangerouslyAllowAllBuilds=true`。

### Q: 启动 dev server 报 "Another next dev server is already running"

A: 之前的进程没杀干净。`taskkill //F //IM node.exe`（Windows）或 `pkill -f "next dev"`。

### Q: 端口 3010 被占用

A: CMMS 故意避开 3000/3001。如 3010 也被占（少见），改 `package.json` 的 `dev` script 和 `.env` 的 `NEXTAUTH_URL`。

### Q: Prisma migrate 报数据库连接失败

A: 确认 Docker 容器健康：`docker compose -f docker/docker-compose.yml ps`。`.env` 中 `DATABASE_URL` 端口应为 `5434`。

### Q: shadcn Button 不支持 asChild

A: shadcn 4.12 用 @base-ui/react（不是 Radix），不支持 asChild。用 `<Link className={buttonVariants()}>` 替代。

### Q: middleware.ts 报错

A: Next.js 16 已改名 `middleware.ts` → `proxy.ts`。本项目用 `proxy.ts`，且 `export default auth`。

### Q: Edge runtime 报 Prisma 错误

A: Edge runtime 不支持 Prisma。NextAuth 配置拆为 dual config（`lib/auth/config.ts` Edge-safe + `lib/auth/index.ts` Node 完整）。proxy.ts 用 Edge-safe 版本。

## 7. 开发流程建议

### 7.1 新功能开发

```
1. 在 docs/plans/ 写设计（如复杂）或直接进入实施
2. git checkout -b feat/<feature-name>
3. TDD：先写测试 → 验证失败 → 实现 → 验证通过
4. 每个任务一个 commit（conventional commits）
5. 推送前自检：pnpm lint && typecheck && format:check && test && build
6. 合并到 main（个人项目可推送 main）
7. 更新 CHANGELOG.md
```

### 7.2 Bug 修复

```
1. 写复现测试（验证 bug 存在）
2. 修复实现
3. 测试通过（验证 bug 消失）
4. commit: fix(<scope>): <description>
```

### 7.3 重构

```
1. 确保现有测试覆盖良好
2. 小步重构，每步保持测试绿色
3. commit: refactor(<scope>): <description>
```

## 8. 编辑器配置建议

### VS Code 推荐扩展

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Prisma
- TypeScript Vue Plugin (Volar)（可选）
- Error Lens

### VS Code settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## 9. 资源链接

- [Next.js 16 文档](https://nextjs.org/docs)
- [Prisma 7 文档](https://www.prisma.io/docs)
- [NextAuth v5 文档](https://authjs.dev)
- [CASL 文档](https://casl.js.org)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [BullMQ](https://docs.bullmq.io)
- 项目内设计文档：`docs/plans/2026-07-15-cmms-design.md`
