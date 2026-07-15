# Testing

> 测试策略、约定、覆盖目标。

## 1. 测试金字塔

```
              ┌──────────┐
              │   E2E    │  ← Playwright（少，覆盖核心用户流）
              └────┬─────┘
         ┌─────────┴─────────┐
         │  Integration      │  ← Vitest + Testcontainers（关键路径）
         └─────────┬─────────┘
    ┌──────────────┴──────────────┐
    │        Unit Tests           │  ← Vitest（多，每个业务规则）
    └─────────────────────────────┘
    ┌─────────────────────────────┐
    │       Static Types          │  ← TypeScript strict + Zod
    └─────────────────────────────┘
```

## 2. 工具与版本

| 工具                      | 版本 | 用途                                 |
| ------------------------- | ---- | ------------------------------------ |
| Vitest                    | 4.1  | 单元测试 + 集成测试                  |
| @testing-library/react    | 16.3 | React 组件测试                       |
| @testing-library/jest-dom | 6.9  | DOM 断言扩展                         |
| jsdom                     | 29.1 | 浏览器环境模拟                       |
| Playwright                | 1.61 | E2E 测试（Chromium）                 |
| @vitejs/plugin-react      | 6.0  | Vitest React 支持                    |
| Zod                       | 4.4  | 运行时 schema 验证（也算一层"测试"） |

## 3. 目录结构

```
tests/
├── setup.ts                    # Vitest 全局 setup（jest-dom）
├── unit/                       # 单元测试（按领域模块组织）
│   ├── guest/
│   │   ├── schema.test.ts
│   │   ├── repository.test.ts
│   │   └── service.test.ts
│   ├── meeting/
│   ├── auth/
│   │   └── abilities.test.ts
│   ├── actions/
│   │   └── guest.test.ts
│   └── db/
│       └── field-encryption.test.ts
├── e2e/                        # E2E 测试（Playwright）
│   ├── login.spec.ts
│   ├── guests.spec.ts
│   ├── meetings.spec.ts
│   └── ...
└── integration/                # 集成测试（Phase 2+ 引入）
    └── transport-conflict.test.ts
```

## 4. 命令

```bash
# 一次性运行所有单元测试
pnpm test

# watch 模式（开发时持续运行）
pnpm test:watch

# 浏览器 UI（推荐，可筛选/调试）
pnpm test:ui

# 单个测试文件
pnpm test tests/unit/guest/schema.test.ts

# E2E（会自动启动 dev server）
pnpm test:e2e

# 单个 E2E 文件
pnpm test:e2e tests/e2e/guests.spec.ts

# E2E 调试模式（headed + 步进）
pnpm exec playwright test --headed --debug
```

## 5. 单元测试约定

### 5.1 命名

```
tests/unit/<module>/<file>.test.ts
```

对应 `lib/domain/<module>/<file>.ts`。

### 5.2 结构

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('guestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('rejects duplicate phone', async () => {
      // Arrange
      vi.mocked(repo.findByPhone).mockResolvedValue({ id: 'existing' } as never);

      // Act + Assert
      await expect(service.create({ phone: '138...', ... }))
        .rejects.toThrow(ConflictError);
    });
  });
});
```

### 5.3 Mock 策略

- **Repository**：Service 测试时 mock 掉（`vi.mock('@/lib/domain/<module>/repository')`）
- **Prisma**：Repository 测试时 mock 掉（`vi.mock('@/lib/db/client')`）
- **next-auth**：Server Action 测试时 mock `auth()` 返回值
- **Date / random**：用 `vi.useFakeTimers()` 控制

### 5.4 测试用例命名（中文友好）

- 用英文写测试名，但描述具体行为：
  - ✓ `it('rejects duplicate phone', ...)`
  - ✗ `it('test create', ...)`（太抽象）

## 6. E2E 测试约定

### 6.1 命名

```
tests/e2e/<feature>.spec.ts
```

### 6.2 结构

```typescript
import { test, expect } from '@playwright/test';

test.describe('Guest management', () => {
  test.beforeEach(async ({ page }) => {
    // 标准登录流程
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('creates a new guest via form', async ({ page }) => {
    const phone = `139${Date.now().toString().slice(-8)}`; // 唯一手机号
    await page.goto('/guests/new');
    await page.getByLabel('姓名 *').fill(`E2E_${Date.now()}`);
    await page.getByLabel('手机').fill(phone);
    await page.getByRole('button', { name: '创建' }).click();

    await expect(page).toHaveURL(/\/guests\/cmr/);
  });
});
```

### 6.3 选择器优先级

1. `getByRole`（最稳定）
2. `getByLabel`
3. `getByText`（注意 strict mode，可能匹配多个元素）
4. `data-testid`（最后选择）

### 6.4 数据隔离

- 用 `Date.now()` 或 `randomUUID()` 生成唯一数据（避免测试间冲突）
- 不要假设数据库有特定数据（除非是 seed 数据）
- 测试用数据库的清理策略：CI 每次 migrate reset；本地按需手动

### 6.5 避免反模式

- ❌ 不要 `page.waitForTimeout(5000)`（用 `expect(...).toBeVisible()` 等待）
- ❌ 不要测试外部依赖（如短信发送）
- ❌ 不要在 E2E 中 mock API（E2E 测的就是完整链路）

## 7. 测试场景覆盖目标

### 7.1 业务规则（每个规则一个测试）

| 模块         | 必测规则                          |
| ------------ | --------------------------------- |
| Guest        | 手机号去重、必填校验、软删除      |
| Meeting      | 状态机转换、code 唯一             |
| MeetingGuest | 一会议一嘉宾、随行关系、规格继承  |
| Agenda       | 演讲嘉宾时间冲突                  |
| Transport    | 车辆时间冲突、座位容量            |
| Lodging      | 房间日期冲突、同住人匹配          |
| Token        | 过期失效、吊销立即生效、HMAC 验证 |

### 7.2 E2E 核心流程

- ✓ Login（3 个：redirect / valid / invalid）
- ✓ Guest CRUD（5 个：list / create / validate / duplicate / edit）
- Meeting CRUD（Phase 2）
- 随行人员添加（Phase 2）
- 签到流程（Phase 2）
- 接送调度（Phase 2）
- 嘉宾扫码端访问（Phase 2）
- 司机扫码端访问（Phase 2）

### 7.3 覆盖率目标

- **lib/domain/**：80%+（业务核心）
- **lib/auth/**：90%+（安全关键）
- **lib/db/**：70%+（Prisma 客户端测试意义不大，但加密逻辑要 100%）
- **app/actions/**：80%+（API 边界）
- **app/(staff)/**：30%+（UI 主要靠 E2E，不需要每个组件测试）

查看覆盖率：

```bash
pnpm test -- --coverage
# 打开 coverage/index.html
```

## 8. CI 集成

GitHub Actions（`.github/workflows/ci.yml`）每次 push/PR 自动运行：

```
✓ Install dependencies
✓ Lint
✓ Type check
✓ Format check
✓ Prisma migrate deploy
✓ Prisma seed
✓ Unit tests
✓ Build
✓ Install Playwright browsers
✓ E2E tests
✓ Upload playwright-report artifact
```

CI 中 PostgreSQL 16 + Redis 7 作为 service containers 起来。

## 9. TDD 工作流

每个新功能按 TDD：

```
1. 写测试（描述预期行为）
   → 运行 → 确认失败（RED）
2. 写最小实现让测试通过
   → 运行 → 确认通过（GREEN）
3. 重构（保持测试绿色）
   → 运行 → 确认仍通过
4. commit
```

参考 superpowers:test-driven-development skill。

## 10. 测试数据

### 10.1 Seed 数据

`prisma/seed/index.ts` 提供：

- `admin@cmms.local` / `admin123`（SUPER_ADMIN）
- `viewer@cmms.local` / `viewer123`（VIEWER）

### 10.2 测试专用 fixture（Phase 2+ 引入）

如需更丰富的测试数据，创建 `prisma/seed/demo-meeting.ts`：

- 1 个会议 + 5 个嘉宾 + 2 辆车 + 3 个 transport orders
- 仅在开发环境手动运行：`pnpm exec tsx prisma/seed/demo-meeting.ts`

### 10.3 Factory 模式（可选）

如果测试数据准备变复杂，引入 `tests/factories/`：

```typescript
// tests/factories/guest.ts
export function buildGuest(overrides: Partial<GuestCreateData> = {}): GuestCreateData {
  return {
    name: `测试_${randomUUID().slice(0, 8)}`,
    level: 'C',
    dietaryTags: [],
    ...overrides,
  };
}
```

## 11. 性能测试

### 11.1 E2E 性能监控

Playwright 自带性能指标：

```typescript
test('guest list page loads fast', async ({ page }) => {
  const start = Date.now();
  await page.goto('/guests');
  await page.getByRole('table').waitFor();
  expect(Date.now() - start).toBeLessThan(2000); // < 2s
});
```

### 11.2 负载测试（可选，Phase 4）

用 k6 测试签到并发：

```javascript
// tests/load/check-in.k6.js
import http from 'k6/http';
export let options = { vus: 100, duration: '30s' };
export default function () {
  http.post('https://cmms.example.com/api/check-in', ...);
}
```

## 12. 常见问题

### Q: Vitest 找不到 `@/` 路径别名

A: 已在 `vitest.config.ts` 配置 alias。如仍失败，检查文件是否在 `tests/` 目录外（默认只匹配 `**/*.{test,spec}.{ts,tsx}`）。

### Q: Playwright 报 strict mode violation

A: 选择器匹配到多个元素。用 `getByRole` 替代 `getByText`，或加 `.first()` / `.last()` 缩小范围。

### Q: E2E 测试很慢

A:

- 减少 `test.beforeEach` 重复登录（用 `test.describe.serial` + 共享 session）
- 用 `testProjects` 并行不同浏览器（当前只 chromium）
- CI 上加 `--shard` 分片

### Q: Mock 不生效

A: 检查 mock 路径是否与 import 路径完全一致。`vi.mock('@/lib/...')` vs `vi.mock('../../lib/...')` 可能行为不同。

### Q: Coverage 不达标

A: 业务核心层（service.ts）必须高覆盖。Repository 层因 Prisma mock 复杂，可适当降低；用 integration test 补充。

## 13. 资源

- [Vitest 文档](https://vitest.dev)
- [Playwright 文档](https://playwright.dev)
- [Testing Library](https://testing-library.com)
- 项目示例：`tests/unit/guest/`（Phase 1 完整参考）
