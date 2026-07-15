# Security

> CMMS 处理 VIP 嘉宾的敏感信息（手机号、身份证号、行程），安全设计是第一优先级。

## 1. 威胁模型

| 威胁               | 影响                   | 当前对策                            |
| ------------------ | ---------------------- | ----------------------------------- |
| **数据库被拖库**   | 所有嘉宾信息泄露       | AES-256-GCM 字段加密（手机/身份证） |
| **嘉宾链接泄露**   | 嘉宾行程、住宿信息暴露 | 有状态 Token + 一键吊销 + 短有效期  |
| **工作人员越权**   | 看到不该看的 VIP 信息  | CASL 角色权限 + 字段级脱敏          |
| **会话劫持**       | 接管工作人员账号       | JWT + 8 小时过期 + HTTP-Only Cookie |
| **Excel 导入注入** | 恶意数据破坏报表       | Zod schema 严格校验 + 类型转换      |
| **XSS**            | 盗取 session           | React 默认转义 + CSP（Nginx 配置）  |
| **CSRF**           | 工作人员被钓鱼触发操作 | NextAuth v5 自带 CSRF token         |
| **暴力破解登录**   | 接管账号               | 待加：登录失败次数限制（Phase 4）   |

## 2. 字段级加密

### 2.1 实现位置

```
lib/db/field-encryption.ts      ← AES-256-GCM 加解密 + 脱敏
lib/db/prisma-extensions.ts     ← Prisma $extends 透明拦截
lib/db/client.ts                ← 应用 extension
```

### 2.2 当前加密字段

| Model | Field    | 加密方式              |
| ----- | -------- | --------------------- |
| Guest | phone    | AES-256-GCM + 随机 IV |
| Guest | idNumber | AES-256-GCM + 随机 IV |

### 2.3 加新加密字段

```typescript
// lib/db/prisma-extensions.ts
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Guest: ['phone', 'idNumber'],
  // 添加：
  Meeting: ['secretNotes'], // 例
};
```

无需改业务代码，Prisma `$extends` 自动处理。

### 2.4 密钥管理

- 密钥：`FIELD_ENCRYPTION_KEY` 环境变量（32 字节 hex，64 字符）
- 生成：`openssl rand -hex 32`
- **⚠️ 一旦生成不可更改**：改密钥需先解密所有数据，再用新密钥重新加密
- **必须备份**：丢失密钥 = 所有加密数据永久不可恢复
- 不要 commit 到仓库（`.env` 已在 `.gitignore`）
- 生产环境通过密码管理器（1Password / Bitwarden）或 KMS 分发

### 2.5 验证加密生效

```bash
# 直接查数据库，应看到密文（enc: 前缀）
docker exec cmms-postgres psql -U cmms -d cmms -c \
  "SELECT phone FROM guests LIMIT 3;"
# 输出：enc:8J+Z3...（密文）

# 通过 Prisma client 查询，看到明文（应用层自动解密）
node -e "const {prisma} = require('./lib/db/client'); prisma.guest.findFirst().then(g => console.log(g.phone))"
# 输出：13812345678（明文）
```

## 3. 认证与会话

### 3.1 工作人员（NextAuth v5）

- **策略**：JWT（无状态，8 小时过期）
- **存储**：HTTP-Only Cookie（`Secure` + `SameSite=Strict`）
- **密码哈希**：bcrypt（cost factor = 12）
- **CSRF**：NextAuth v5 内置

### 3.2 嘉宾/陪同/司机（有状态 Token）

**为什么不用 JWT**：

- JWT 无状态，无法主动吊销
- 嘉宾手机丢失场景下，链接泄露 = 永久泄露
- 有状态 Token + DB 可以一键吊销

**实现**：

```
lib/auth/tokens.ts
  - generateToken() → 返回 { raw, hash }
  - hashToken(raw) → HMAC-SHA256(secret, raw)
  - verifyGuestToken(raw) → 查 DB，校验过期/吊销
  - revokeGuestToken(meetingGuestId) → 设置 revokedAt

prisma/schema.prisma
  - GuestAccessToken（meetingGuestId, tokenHash, expiresAt, revokedAt）
  - DriverAccessToken（transportOrderId, tokenHash, expiresAt, revokedAt）
```

**安全特性**：

- 仅存 HMAC 哈希到 DB（数据库泄露无法复用 token）
- `expiresAt` 短期有效（会议开始前 3 天到会议结束后 2 天）
- `revokedAt` 支持立即吊销
- `lastAccessedAt` + `accessCount` 用于审计和异常检测

### 3.3 Token 二次校验（可选加固）

短信链接含一次性 PIN：

```
https://cmms.example.com/g/abc123?pin=4829
```

进入页面要求输入手机后 4 位匹配。即使链接泄露，无 PIN 仍不能访问。

## 4. 权限模型（CASL）

### 4.1 角色

```
lib/auth/abilities.ts

SUPER_ADMIN  → 全权
VIEWER       → 只读 Guest/Meeting/MeetingGuest/AgendaItem
MeetingOwner (per-meeting) → 本会议全权  [Phase 2]
ReceptionLead → 本会议接待任务  [Phase 2]
ReceptionStaff → 本会议签到（敏感字段脱敏）[Phase 2]
ResourceCoordinator → 仅自己负责模块 [Phase 2]
```

### 4.2 前后端共享

```typescript
// 同一份 abilities 规则
import { defineAbilityFor } from '@/lib/auth/abilities';

// 前端：控制 UI 显示
const ability = defineAbilityFor({ role: session.user.role });
{ability.can('delete', 'Guest') && <DeleteButton />}

// 后端：Server Action 入口拦截
const { ability } = await getContext();
assertAuthorized(ability, 'delete', 'Guest');
```

### 4.3 字段级脱敏

```typescript
// 查询层动态脱敏（计划在 Phase 2 实现）
async function getGuestForUser(guestId, user) {
  const guest = await guestRepo.findById(guestId);
  return {
    ...guest,
    phone: user.role === 'ReceptionStaff' ? maskPhone(guest.phone) : guest.phone,
    idNumber: user.role === 'ReceptionStaff' ? maskIdNumber(guest.idNumber) : guest.idNumber,
  };
}
```

脱敏示例：

- 手机：`138****5678`
- 身份证：`110101********1234`

## 5. 输入验证

### 5.1 Zod schema 边界校验

所有外部输入（表单、Excel、API）必须经过 Zod schema：

```typescript
// lib/shared/guest.ts
export const guestCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式错误')
    .optional(),
  email: z.string().email().optional(),
  idNumber: z
    .string()
    .regex(/^[1-9]\d{16}[\dXx]$/)
    .optional(),
  // ...
});
```

### 5.2 Server Action 强制校验

```typescript
// app/actions/guest.actions.ts
export async function createGuest(input) {
  const data = guestCreateSchema.parse(input); // ZodError 自动转 ActionResult
  // ...
}
```

ZodError 在 `lib/actions/utils.ts` 的 `handleError` 中转为结构化错误。

### 5.3 SQL 注入防护

- Prisma 全部参数化查询，**禁止 `$queryRawUnsafe`**
- 如必须 raw SQL，用 `$queryRaw` 模板字符串：
  ```typescript
  await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`; // ✓ 参数化
  // await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`);  // ❌ SQL 注入
  ```

## 6. XSS 与 CSRF

### 6.1 XSS

- React 默认转义所有插值，**禁止 `dangerouslySetInnerHTML`**（除非源数据完全可信）
- Nginx CSP header（生产环境）：
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  ```

### 6.2 CSRF

- NextAuth v5 内置 CSRF token
- Server Actions 自带 origin 校验
- Cookie 加 `SameSite=Strict`

## 7. 日志与审计

### 7.1 应用日志（Pino）

```typescript
// 结构化 JSON，不输出敏感字段明文
logger.info({ userId, action: 'guest.create', guestId }, 'guest created');
// ❌ logger.info({ phone: '13812345678' }, '...')  // 不要 log 明文
```

### 7.2 审计日志（AuditLog 模型，Phase 4）

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  actorType   ActorType  // USER / GUEST_PORTAL / DRIVER_PORTAL / SYSTEM
  actorId     String?
  actorRole   String?
  action      String   // CREATE / UPDATE / DELETE / CHECK_IN
  entityType  String   // Guest / Meeting / TransportOrder
  entityId    String
  before      Json?
  after       Json?
  source      String?  // IP + User-Agent
  createdAt   DateTime @default(now())
}
```

所有写操作通过装饰器/中间件自动记录。

### 7.3 Token 访问审计

每次嘉宾/司机端访问，自动更新 `lastAccessedAt` 和 `accessCount`。异常访问（如短时间内大量请求）应告警（Phase 4）。

## 8. 数据保护

### 8.1 数据最小化

Excel 导入只收集必要字段：

- 必填：姓名
- 强烈建议：手机
- 可选：邮箱、单位、职务、等级、身份证、饮食标签、备注

### 8.2 软删除

`Guest.deletedAt` 软删除，不实际删除数据。便于误删恢复和审计。

### 8.3 数据导出脱敏

Excel 导出根据导出者角色自动脱敏：

- SuperAdmin / MeetingOwner：明文
- Viewer / 其他：手机和身份证脱敏

### 8.4 数据保留策略（建议）

- Guest 软删除数据：保留 1 年后真删
- AuditLog：保留 3 年
- Token：过期 + revoked 后 30 天清理

## 9. 安全审计检查清单

### 部署前

- [ ] FIELD_ENCRYPTION_KEY 已生成且备份
- [ ] NEXTAUTH_SECRET 已生成
- [ ] 数据库密码 ≥ 32 字符
- [ ] admin 默认密码已修改
- [ ] viewer 默认密码已修改
- [ ] HTTPS 证书已配置
- [ ] CSP header 已配置
- [ ] 防火墙限制 5434/6381 仅本机访问

### 每月

- [ ] 检查 Sentry 错误趋势（异常可能表示攻击）
- [ ] 审查 AuditLog 异常（大量失败登录、权限拒绝）
- [ ] 审查 Token accessCount 异常（短时间内暴增）
- [ ] 检查备份可恢复性

### 每季度

- [ ] 跑 `pnpm audit` 检查依赖漏洞
- [ ] 跑 `docker scout` 检查镜像漏洞
- [ ] 恢复演练（从备份恢复到测试环境）
- [ ] 审查工作人员权限（离职/调岗及时调整）

### 年度

- [ ] 轮换 NEXTAUTH_SECRET（注意会让所有 session 失效）
- [ ] 评估 FIELD_ENCRYPTION_KEY 是否需要轮换（高难度，需重新加密所有数据）

## 10. 已知限制（待加固）

| 项                        | 当前状态 | 计划                         |
| ------------------------- | -------- | ---------------------------- |
| 登录失败次数限制          | 未实现   | Phase 4 加 rate limiting     |
| Two-Factor Authentication | 未实现   | 不在 MVP 范围                |
| IP 白名单                 | 未实现   | Phase 4 可选                 |
| 数据库 TDE（透明加密）    | 未启用   | 单组织内部系统暂不需要       |
| 容器以 root 运行          | 当前默认 | Phase 4 加 `USER node`       |
| 依赖漏洞扫描              | 未自动化 | Phase 4 加 Dependabot / Snyk |

## 11. 漏洞报告

如发现安全漏洞，**请勿在 GitHub Issues 公开**。请通过以下方式私密报告：

- 私有 GitHub Security Advisory
- 直接联系项目维护者

会在 48 小时内响应。
