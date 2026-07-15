# Contributing

> 贡献规范。当前是个人项目，但规范有助于未来协作和 AI 辅助开发。

## 1. 项目当前状态

- **个人项目**：单维护者
- **私有仓库**：https://github.com/hxd0818/cmms
- **不强制 PR 流程**：可以直接推送 `main`
- **规范目的**：保持代码质量，便于 AI 辅助开发（Claude Code 等）

## 2. 开发流程

### 2.1 任何改动前

1. 阅读 [CLAUDE.md](./CLAUDE.md)（项目级规范）
2. 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md)（理解整体设计）
3. 阅读 [docs/plans/](./docs/plans/) 中对应阶段的实施计划

### 2.2 复杂功能（>3 个文件）

必须先写设计文档：

```bash
# 1. 在 docs/plans/ 写设计
touch docs/plans/YYYY-MM-DD-<feature>-design.md

# 2. 设计包含：
#    - 目标（解决什么问题）
#    - 方案对比（2-3 种，权衡）
#    - 推荐方案 + 理由
#    - 实施步骤
#    - 测试策略

# 3. 待爸爸确认后再实施
```

### 2.3 简单改动

直接 TDD：
```
1. 写测试 → 验证失败
2. 实现 → 验证通过
3. 重构（可选）
4. commit
```

## 3. Git 规范

### 3.1 分支

- `main`：主开发分支（个人项目允许直接推送）
- `feat/<feature-name>`：复杂功能分支（如有多步开发）
- `fix/<bug-description>`：bug 修复分支

### 3.2 Commit Message 格式（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**：
- `feat`：新功能
- `fix`：bug 修复
- `refactor`：重构（不改功能）
- `chore`：杂项（依赖升级、配置）
- `docs`：文档
- `test`：测试
- `perf`：性能优化
- `ci`：CI/CD

**scope**（可选）：模块名，如 `guest`、`meeting`、`auth`、`db`、`ui`

**示例**：
```
feat(guest): add Excel batch import with BullMQ async pipeline

- lib/queue/guest-import.queue.ts: queue + worker registration
- lib/domain/guest/importer.ts: ExcelJS parser with phone dedup
- app/(staff)/guests/import: upload UI with sonner toast
```

### 3.3 提交粒度

- 一个任务一个 commit（参考 Phase 1 实施计划的任务粒度）
- 不要在一次 commit 里做多个不相关改动
- **严禁 commit 包含 `TODO` / 注释代码** 的最终代码
- **严禁 `--no-verify` 跳过 hooks**（除非维护者明确同意）

## 4. 代码规范

### 4.1 TypeScript

- 必须开 strict mode（`tsconfig.json` 已配置）
- 必须开 `noUncheckedIndexedAccess`
- 优先用 `type` 而非 `interface`（除非需要 declaration merging）
- 严禁 `any`（用 `unknown` + 类型守卫）
- 公共函数必须有显式返回类型

### 4.2 命名

| 类型 | 约定 | 示例 |
|---|---|---|
| 文件（组件） | PascalCase | `GuestForm.tsx` |
| 文件（其他） | kebab-case | `field-encryption.ts` |
| 函数/变量 | camelCase | `createGuest` |
| 类型 | PascalCase | `GuestCreateInput` |
| 常量 | SCREAMING_SNAKE | `STATUS_TRANSITIONS` |
| 枚举值 | SCREAMING_SNAKE | `VIP_A`, `SUPER_ADMIN` |
| React 组件 | PascalCase | `function GuestForm()` |
| React hooks | camelCase + `use` | `useForm` |
| Server Actions | camelCase + verb | `createGuest`, `deleteGuest` |

### 4.3 错误处理

- 严禁 swallow 错误（`try { ... } catch {}`）
- 业务错误用 `lib/shared/errors.ts` 的 AppError 子类
- Server Action 入口用 `handleError(e)` 转 ActionResult
- 日志用 `logger`（Pino），不要 `console.log`

### 4.4 不可变性

- 用 spread operator 或 `structuredClone` 创建新对象，不要 mutate
- React state 必须 immutable 更新
- 数据库实体读出来后视为只读

### 4.5 函数大小

- < 50 行为佳，> 100 行考虑拆分
- 单一职责，一个函数做一件事

### 4.6 文件大小

- < 400 行为佳，> 800 行必须拆分
- 一个文件只做一件事（高内聚）

## 5. 测试规范

详见 [TESTING.md](./TESTING.md)。简要：

- 新功能必须 TDD（先写测试 → 实现）
- 业务规则必须有单元测试
- 核心用户流程必须有 E2E 测试
- Coverage：lib/domain/ 80%+

## 6. UI 规范

- 使用 shadcn/ui 组件，不重复造轮子
- 不允许 emoji（用文字如 "success" 而非 "checkmark"）
- 不允许 CSS 渐变（用纯色）
- 中文文案（用户面）
- 移动端适配（工作人员端 PC + 移动响应式，嘉宾端 mobile-first）
- 表单必须有 label + 校验提示

## 7. 文档规范

### 7.1 必须更新文档的场景

| 场景 | 必须更新 |
|---|---|
| 新功能上线 | `CHANGELOG.md` |
| 新领域模块 | `lib/domain/<module>/README.md` |
| 新加密字段 | `SECURITY.md` 加密字段表 |
| 新端口/资源 | `CLAUDE.md`、`README.md`、`DEVELOPMENT.md` |
| 新增测试类型 | `TESTING.md` |
| 架构变化 | `ARCHITECTURE.md`、`docs/plans/` 新设计 |

### 7.2 文档语言

- 用户面（README、UI 文本）：中文
- 代码注释：英文（国际标准）
- 设计文档：中文为主，代码示例英文

## 8. 用户纠正记录

参考 [CLAUDE.md "已记录的纠正"](./CLAUDE.md#5-已记录的纠正)。当用户纠正错误时：

1. **立即记录**：在 CLAUDE.md 添加纠正条目
2. **复述理解**：向用户复述，确保不再犯同样错误
3. **更新流程**：调整工作流程避免重复错误

## 9. Pull Request 规范（如启用协作）

如果未来启用 PR 流程：

```markdown
## 摘要
[1-3 句话描述改动]

## 改动类型
- [ ] feat: 新功能
- [ ] fix: bug 修复
- [ ] refactor: 重构
- [ ] docs: 文档
- [ ] test: 测试
- [ ] chore: 杂项

## 测试计划
- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 手动验证核心场景
- [ ] CHANGELOG.md 已更新

## 关联
Closes #<issue>
```

## 10. 行为准则

- **尊重用户**：称呼"爸爸"，中文沟通
- **质疑精神**：发现需求矛盾或更优实现，主动提出
- **诚实**：不知道就说不知道，不编造
- **不偷工减料**：不省略测试、不写 TODO、不注释代码
- **不越界**：不修改无关文件、不"顺手"重构

## 11. AI 协作规范

本项目与 Claude Code 等 AI 协作开发。AI 助手必须：

- 遵守 [CLAUDE.md](./CLAUDE.md) 所有规则
- 复杂功能先写设计，待确认后实施
- 每个任务 TDD
- 每个任务一个 commit
- 阶段完成更新 CHANGELOG.md
- 端口/资源严格隔离（参考 D:\work\CLAUDE.md "用户纠正学习机制"）

## 12. 联系方式

- Issues：https://github.com/hxd0818/cmms/issues
- 安全漏洞：见 [SECURITY.md](./SECURITY.md#11-漏洞报告)
