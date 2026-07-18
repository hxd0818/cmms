# CMMS 会务管理系统 — 产品需求文档 (PRD)

> Conference Management & Member Service
> 版本: v2.0 | 更新: 2026-07-18 | 状态: 已实现

---

## 目录

1. [产品概述](#1-产品概述)
2. [用户角色与权限矩阵](#2-用户角色与权限矩阵)
3. [用户故事](#3-用户故事)
4. [功能模块详述](#4-功能模块详述)
5. [业务流程](#5-业务流程)
6. [三端门户](#6-三端门户)
7. [边界条件与错误处理](#7-边界条件与错误处理)
8. [数据校验规则](#8-数据校验规则)
9. [UI/UX 规格](#9-uiux-规格)
10. [非功能需求](#10-非功能需求)
11. [安全架构](#11-安全架构)
12. [通知触发规则](#12-通知触发规则)
13. [数据保留策略](#13-数据保留策略)
14. [技术架构](#14-技术架构)
15. [约束与假设](#15-约束与假设)
16. [已知限制与待改进项](#16-已知限制与待改进项)
17. [术语表](#17-术语表)

---

## 1. 产品概述

### 1.1 定位

CMMS 是一款以接待运营为核心的通用会务管理平台。覆盖从会前筹备到会后总结的全链路：嘉宾管理、议程编排、接送调度、住宿分配、餐饮安排、礼品发放、接待陪同、费用统计。

### 1.2 适用场景

- 行业峰会 / 论坛 / 研讨会
- 企业年会 / 经销商大会
- 政府接待 / 外事活动
- 任何需要 VIP 接待的多人会议

### 1.3 核心差异

| 差异点 | 说明 |
|---|---|
| 会议独立资源池 | 每场会议管理自己的车辆/酒店房间/餐桌，互不干扰 |
| 跨会议嘉宾沉淀 | VIP 档案长期累积，同一嘉宾参加多场会议只存一份 |
| 四端门户 | 工作人员端 + 嘉宾端 + 司机端 + 接待端，各看各的 |
| 字典后台可配置 | 21 类 96+ 个枚举标签集中管理，管理员改标签不需要改代码 |
| 状态机驱动 | 会议/签到/接送/住宿/餐饮/礼品各有严格状态转换规则 |
| 费用自动化 | 任务完成自动生成费用记录，减少人工录入 |

---

## 2. 用户角色与权限矩阵

### 2.1 系统级角色

| 角色 | 数据范围 | 读取 | 写入 | 管理功能 |
|---|---|---|---|---|
| SUPER_ADMIN | 全局 | 全部 | 全部 | 用户管理 / 字典管理 / 审计日志 / 会议人员 |
| VIEWER | 全局 | 全部（手机/身份证脱敏） | 禁止 | 禁止访问审计日志和用户管理 |

### 2.2 会议级角色（MeetingStaff）

通过「人员」标签页分配，存储在 MeetingStaff 表。当前系统已定义 10 种角色，但 RBAC 执行层目前只区分 SUPER_ADMIN / VIEWER。会议级角色的细粒度权限控制为待改进项。

| 角色 | 说明 |
|---|---|
| OWNER | 会议负责人 |
| RECEPTION_LEAD | 签到主管 |
| RECEPTION_STAFF | 签到员 |
| TRANSPORT_LEAD | 接送主管 |
| TRANSPORT_STAFF | 接送员 |
| LODGING_LEAD | 住宿主管 |
| CATERING_LEAD | 餐饮主管 |
| GIFT_LEAD | 礼品主管 |
| FINANCE | 财务 |
| STAFF | 通用工作人员 |

### 2.3 操作权限矩阵

| 操作 | 需要的 CASL 权限 | SUPER_ADMIN | VIEWER |
|---|---|---|---|
| 创建嘉宾 | create, Guest | Y | N |
| 编辑嘉宾 | update, Guest | Y | N |
| 删除嘉宾 | delete, Guest | Y | N |
| 查看嘉宾 | read, Guest | Y | Y（脱敏） |
| 创建/编辑/删除会议 | create/update/delete, Meeting | Y | N |
| 切换会议状态 | update, Meeting | Y | N |
| 添加/移除/编辑会议嘉宾 | create/delete/update, MeetingGuest | Y | N |
| 创建/删除议程 | create/delete, AgendaItem | Y | N |
| 编辑议程 | update, AgendaItem | Y | N |
| 签到/批量签到/标记状态 | update, MeetingGuest | Y | N |
| 创建接送/分配车辆/状态更新 | create/update, TransportOrder | Y | N |
| 创建/删除车辆 | create/delete, Vehicle | Y | N |
| 创建住宿/分配房间/状态更新 | create/update, LodgingOrder | Y | N |
| 创建酒店/添加房间 | create, Hotel | Y | N |
| 创建餐饮/分配餐桌 | create/update, CateringOrder | Y | N |
| 创建/删除餐桌 | create/delete, CateringOrder | Y | N |
| 创建礼品/订单/发放 | create/update, Gift/GiftOrder | Y | N |
| 创建接待/分配/取消 | create/delete, Companion | Y | N |
| 创建/删除费用 | create/delete, FeeRecord | Y | N |
| 分配任务 | update, all | Y | N |
| 查看我的任务 | （仅需登录） | Y | Y |
| 发放/吊销嘉宾 Token | update, MeetingGuest | Y | N |
| 发放司机 Token | update, TransportOrder | Y | N |
| 管理 RSVP | update, MeetingGuest | Y | N |
| 分配室友 | update, LodgingOrder | Y | N |
| 用户 CRUD | manage, all | Y | N |
| 字典编辑 | update, all | Y | N |
| 会议人员管理 | manage, all | Y | N |
| 查看审计日志 | （VIEWER 被禁止 read AuditLog） | Y | N |

---

## 3. 用户故事

### 3.1 会前筹备

| # | 角色 | 故事 |
|---|---|---|
| US-01 | 管理员 | 作为管理员，我想创建会议并填写基本信息，以便开始筹备工作 |
| US-02 | 管理员 | 作为管理员，我想为会议分配工作人员角色，以便明确各自职责 |
| US-03 | 管理员 | 作为管理员，我想从嘉宾库搜索并添加嘉宾到会议，以便确定参会名单 |
| US-04 | 管理员 | 作为管理员，我想通过 Excel 批量导入会议嘉宾，以便快速完成大规模名单录入 |
| US-05 | 管理员 | 作为管理员，我想设置嘉宾的主从关系和规格继承，以便随行人员自动继承主嘉宾的接送/住宿安排 |
| US-06 | 管理员 | 作为管理员，我想编排会议议程并检测演讲嘉宾时间冲突，以便确保议程不冲突 |
| US-07 | 管理员 | 作为管理员，我想为本场会议添加车辆和酒店房间，以便管理独立资源池 |
| US-08 | 管理员 | 作为管理员，我想创建接送任务并分配车辆，以便安排嘉宾接送 |
| US-09 | 管理员 | 作为管理员，我想创建住宿订单并分配房间，以便安排嘉宾住宿 |
| US-10 | 管理员 | 作为管理员，我想创建餐饮安排并分配餐桌，以便安排嘉宾用餐 |

### 3.2 会中执行

| # | 角色 | 故事 |
|---|---|---|
| US-11 | 签到员 | 作为签到员，我想在签到台搜索嘉宾并一键签到，以便快速完成签到 |
| US-12 | 签到员 | 作为签到员，我想批量选择多位嘉宾一起签到，以便处理集中到达的高峰 |
| US-13 | 签到员 | 作为签到员，我想在看板上看到各签到状态的嘉宾分布，以便掌握现场进度 |
| US-14 | 接送员 | 作为接送员，我想在「我的任务」页面看到分配给我的全部接送任务，以便按顺序执行 |
| US-15 | 司机 | 作为司机，我想通过链接打开我的任务页面并更新状态，以便会务组实时掌握接送进度 |
| US-16 | 接待员 | 作为接待员，我想通过链接查看我负责的嘉宾的完整行程，以便做好全程接待 |
| US-17 | 接待员 | 作为接待员，我想为嘉宾生成行程链接并转发，以便嘉宾自己查看安排 |

### 3.3 会后总结

| # | 角色 | 故事 |
|---|---|---|
| US-18 | 财务 | 作为财务，我想查看按类别汇总的费用统计，以便核算会议成本 |
| US-19 | 管理员 | 作为管理员，我想导出会议概览/嘉宾名单/费用明细到 Excel，以便归档和汇报 |
| US-20 | 管理员 | 作为管理员，我想查看审计日志追溯所有操作，以便审计合规 |

### 3.4 嘉宾体验

| # | 角色 | 故事 |
|---|---|---|
| US-21 | 嘉宾 | 作为嘉宾，我想通过链接查看自己的完整行程（接送/住宿/餐饮/议程/礼品），以便提前了解安排 |
| US-22 | 嘉宾 | 作为嘉宾，我想在行程页面看到接送司机信息，以便到达后联系 |

### 3.5 系统管理

| # | 角色 | 故事 |
|---|---|---|
| US-23 | 管理员 | 作为管理员，我想创建系统用户并分配角色，以便控制访问权限 |
| US-24 | 管理员 | 作为管理员，我想在后台修改枚举标签的文字，以便适配业务术语变化 |
| US-25 | 管理员 | 作为管理员，我想查看嘉宾的跨会议历史，以便了解 VIP 的完整接待记录 |

---

## 4. 功能模块详述

### 4.1 控制台

**统计卡片**：嘉宾总数 / 会议总数 / 进行中会议数
**近期会议**：未来 30 天的会议列表（最多 5 条），点击跳转会议详情
**快捷操作**：新建会议按钮

### 4.2 我的任务

按类型分组显示分配给当前用户的任务：
- 接送任务：嘉宾名 + 路线 + 时间 + 状态
- 住宿任务：嘉宾名 + 酒店/房号 + 日期 + 状态
- 餐饮任务：嘉宾名 + 餐类 + 时间 + 状态
- 礼品任务：嘉宾名 + 礼品名/数量 + 状态

每条可点击跳转到对应会议管理页面。

### 4.3 嘉宾库

**字段清单**：

| 字段 | 类型 | 必填 | 校验规则 |
|---|---|---|---|
| 姓名 | String(100) | 是 | 1-100 字符 |
| 性别 | Enum | 否 | MALE / FEMALE / OTHER |
| 手机 | String | 否 | 正则 `^1[3-9]\d{9}$`，全局唯一，AES-256-GCM 加密 |
| 邮箱 | String | 否 | 合法邮箱格式 |
| 单位 | String(200) | 否 | |
| 职务 | String(100) | 否 | |
| 等级 | Enum | 否 | 默认 C，可选 VIP-A / VIP-B / A / B / C |
| 身份证号 | String | 否 | 正则 `^[1-9]\d{16}[\dXx]$`，加密存储 |
| 饮食标签 | String[] | 否 | 如：清真、素食 |
| 备注 | String(2000) | 否 | |

**功能**：
- 列表分页（20 条/页），支持搜索（姓名/手机/单位）和等级筛选
- VIEWER 角色手机显示为 `138****1234`，身份证显示为 `110********1234`
- 创建/编辑/软删除
- Excel 批量导入（模板下载 → 填写 → 上传 → BullMQ 异步处理）
- 嘉宾详情页（Guest 360）：基本信息 + 会议参与历史 + 跨会议接待任务

**空状态**：「暂无数据」
**错误状态**：服务端错误显示 `加载失败`

### 4.4 会议管理

**字段清单**：

| 字段 | 类型 | 必填 | 校验规则 |
|---|---|---|---|
| 会议名称 | String(200) | 是 | 1-200 字符 |
| 会议编号 | String(50) | 是 | 正则 `/^[A-Z0-9-]+$/i`，全局唯一 |
| 状态 | Enum | 是 | 默认 DRAFT |
| 开始时间 | DateTime | 是 | |
| 结束时间 | DateTime | 是 | 必须晚于开始时间 |
| 场地 | String(200) | 否 | |
| 说明 | String(2000) | 否 | |

**状态机**：
```
DRAFT → PLANNING → ONGOING → COMPLETED
  ↓        ↓         ↓           ↑
CANCELED  CANCELED  CANCELED   (终态)
```

**会议详情页（指挥中心）** — 12 个标签页：

| 标签 | 内容 | 验收标准 |
|---|---|---|
| 详情 | 统计卡片网格（嘉宾数/议程数/签到统计/接送分配率/住宿分配率/餐饮数/礼品待发/接待数/费用合计） | 每张卡片点击可跳转对应标签页 |
| 嘉宾 | 主嘉宾+随行列表，侧滑面板查看接待任务 | 主嘉宾一行，随行缩进显示 |
| 议程 | 时间线 + 创建表单 | 创建时检测演讲嘉宾时间冲突 |
| 签到 | 4 列看板 + 搜索 + 批量签到 | 看板每 5 秒轮询刷新 |
| 接送 | 订单列表 + 车辆管理 + 搜索式分配 | 分配时检测容量和拼车 |
| 住宿 | 订单列表 + 酒店/房间管理 + 室友分配 | 分配时检测日期重叠 |
| 餐饮 | 订单列表 + 餐桌分配 | 分配时检测餐桌容量 |
| 礼品 | 订单列表 + 发放按钮 | 发放时扣减库存 + 生成费用 |
| 接待 | 接待分配列表 + 新增接待人员 | 可分享接待端门户链接 |
| 费用 | 分类汇总卡片 + 记录列表 | 自动费用来自任务完成 |
| 人员 | 工作人员角色分配 | 10 种会议角色 |
| 资源 | 车辆/酒店房间/餐桌集中管理 | 每类有列表+内联添加+删除 |

### 4.5 会议嘉宾

**主从关系**：
- 主嘉宾（PRIMARY）：独立参会
- 随行人员：关联到主嘉宾（primaryMeetingGuestId），角色：秘书/安保/翻译/家属/助理/司机
- 规格继承：`inheritTransport=true` 时计入主嘉宾的接送容量；`inheritLodging=true` 时同住
- 等级覆盖：`levelOverride` 可单独覆盖嘉宾等级

**RSVP 状态**：PENDING（待确认）/ CONFIRMED（已确认）/ DECLINED（已拒绝）

**签到状态**：NOT_ARRIVED / CHECKED_IN / IN_HOUSE / DEPARTED / NO_SHOW

**批量导入 Excel 格式**：

| 列 | 说明 |
|---|---|
| 姓名 * | |
| 手机 | 用于匹配嘉宾库已有记录 |
| 分组标签 | 逗号分隔 |
| 接待角色 | 主嘉宾/秘书/安保/翻译/家属/助理/司机 |
| 主嘉宾手机 | 填入则关联为主嘉宾的随行 |
| 等级覆盖 | VIP-A / VIP-B / A / B / C（留空使用默认） |

**导入规则**：主嘉宾必须在随行之前出现（同一文件内按行序处理）。

### 4.6 议程管理

**议程类型（12 种）**：主题演讲 / 圆桌讨论 / 茶歇 / 用餐 / 参观 / 闭门会 / 调研 / 沙龙 / 评审 / 路演 / 答辩 / 其他

**演讲嘉宾冲突检测**：同一演讲嘉宾（speakerIds）不可在时间重叠的两个议程项中出现。

### 4.7 接送调度

#### 4.7.1 车辆（每场会议独立）

| 字段 | 校验 |
|---|---|
| 车牌号 * | 同一会议内唯一 |
| 车型 | 轿车/商务车/大巴/其他 |
| 座位数 | 整数 1-60 |
| 司机姓名 * | 1-50 字符 |
| 司机电话 * | 正则 `^1[3-9]\d{9}$` |
| 所属车队 | 选填 |

#### 4.7.2 接送状态机

```
UNASSIGNED → ASSIGNED → EN_ROUTE → PICKED_UP → COMPLETED
     ↓          ↓          ↓            ↓          ↑
  CANCELED   CANCELED   CANCELED    CANCELED   (终态)
                ↓
            REASSIGNED → ASSIGNED
```

#### 4.7.3 拼车容量计算

```
已占座位 = Σ(每个同时间段订单的主嘉宾(1) + inheritTransport 随行(N))
本次需求 = 1 + 当前订单的 inheritTransport 随行数
如果 已占 + 本次需求 > 座位数 → 拒绝
```

#### 4.7.4 搜索式车辆分配弹窗

- 搜索：车牌/司机/车队/车型
- 每辆车显示：车牌（粗体）+ 类型 Badge + 座位数 + 司机名 + 电话 + 车队
- 选中后查询座位占用：显示「已占 X/Y 座，剩余 Z 座」
- 有其他乘客时按钮文字变为「确认拼车」，弹出浏览器确认框

#### 4.7.5 自动费用

状态变为 COMPLETED 时自动创建 FeeRecord（类别：TRANSPORT，金额：0，财务后补实际金额）。

### 4.8 住宿管理

#### 4.8.1 住宿状态机

```
UNASSIGNED → RESERVED → CHECKED_IN → CHECKED_OUT
                ↓           ↓              ↑
           ROOM_CHANGED  ROOM_CHANGED   (终态)
```

#### 4.8.2 房间冲突检测

同一房间在日期范围 [checkInAt, checkOutAt) 内不可被两个非取消订单重叠预订。

#### 4.8.3 室友

`roommateIds` 字段存储同房其他订单 ID，手动多选。

#### 4.8.4 自动费用

状态变为 CHECKED_OUT 时自动创建 FeeRecord（类别：LODGING，金额：0）。

### 4.9 餐饮管理

- 创建订单时自动从嘉宾档案同步 `dietaryTags` 到 `specialDietary`
- 餐桌分配时检测：同一餐桌同一时间段已分配人数 + 1 ≤ 容量

### 4.10 礼品管理

- 创建订单时检测库存：`stock >= quantity`
- 发放使用事务（`prisma.$transaction`）：库存递减 + 标记 DELIVERED + 自动费用（`unitPrice × quantity`）
- 发放时状态必须为 PENDING，否则拒绝

### 4.11 接待人员

- 接待人员库为全局共享（跨会议复用）
- 分配范围：全程 / 会议期间 / 用餐 / 接送 / 住宿
- 接待端门户：显示每位嘉宾的完整接待信息

### 4.12 费用管理

**自动生成规则**：

| 触发事件 | 类别 | 金额 |
|---|---|---|
| 接送 → COMPLETED | TRANSPORT | 0（财务后补） |
| 住宿 → CHECKED_OUT | LODGING | 0 |
| 礼品 → DELIVERED | GIFT | 单价 × 数量 |

所有自动费用为 fire-and-forget（`.catch(() => {})`），不阻塞主操作。

### 4.13 资源管理

每场会议独立的资源池，在「资源」标签页集中管理：
- 车辆：列表 + 内联添加（6 字段表单）+ 删除
- 酒店房间：酒店列表 + 添加酒店 + 按酒店添加房间（房号 + 房型）
- 餐桌：列表 + 内联添加（桌名 + 容量 + 类型）+ 删除

### 4.14 人员管理

为会议分配系统用户 + 会议角色（10 种）。同一用户在同一会议只能有一个角色。

### 4.15 用户管理（仅 SUPER_ADMIN）

| 操作 | 规则 |
|---|---|
| 创建 | 姓名 + 邮箱（唯一）+ 初始密码（bcrypt 12 轮）+ 角色 |
| 编辑 | 姓名 / 角色 / 重置密码（留空不修改） |
| 删除 | 不能删除自己 |

### 4.16 字典管理（仅 SUPER_ADMIN）

- 21 个分类，96+ 个标签
- 行内编辑标签文本，切换可见性
- 1 分钟内存缓存，客户端通过 DictProvider + useDbDict() 获取
- DB 优先，代码层 DICTIONARY 常量兜底

### 4.17 审计日志（仅 SUPER_ADMIN）

- 48 个日志点覆盖全部 Server Action
- fire-and-forget（不阻塞操作）
- 字段：时间 / 操作者 ID / 操作者角色 / 动作 / 实体类型 / 实体 ID / 变更前 / 变更后
- 分页 50 条/页

---

## 5. 业务流程

### 5.1 会议全生命周期

```
┌──────────────────────────────────────────────────────┐
│ DRAFT（草稿）                                         │
│  1. 创建会议，填写基本信息                             │
│  2. 分配工作人员角色（人员标签页）                      │
│  3. 添加嘉宾（单个搜索添加 或 Excel 批量导入）          │
│  4. 设置主从关系/等级覆盖/继承标志                      │
├──────────────────────────────────────────────────────┤
│ PLANNING（筹备中）                                     │
│  5. 编排议程（演讲嘉宾冲突检测）                        │
│  6. 管理资源：添加车辆/酒店房间/餐桌                    │
│  7. 创建接待任务：                                     │
│     - 接送订单 → 分配车辆（拼车容量检测）               │
│     - 住宿订单 → 分配房间（日期冲突检测）               │
│     - 餐饮订单 → 分配餐桌（容量检测）                   │
│     - 礼品订单                                        │
│     - 接待人员分配                                     │
│  8. 分享链接给嘉宾/司机/接待人员                        │
│  9. 分配任务给工作人员                                 │
├──────────────────────────────────────────────────────┤
│ ONGOING（进行中）                                      │
│  10. 签到台运作（看板 + 搜索 + 批量签到）               │
│  11. 司机自更新状态（出发→接到→送达）                   │
│  12. 工作人员在「我的任务」查看并执行                   │
│  13. 礼品发放（库存扣减 + 自动费用）                    │
│  14. 任务完成 → 自动生成费用                           │
├──────────────────────────────────────────────────────┤
│ COMPLETED（已结束）                                    │
│  15. 费用汇总 + Excel 导出                             │
│  16. 审计日志追溯                                      │
│  17. 嘉宾档案沉淀（Guest 360 跨会议视图）               │
└──────────────────────────────────────────────────────┘
```

### 5.2 签到流程

1. 工作人员打开 `/meetings/[id]/reception`
2. 看到 4 列看板：待签到 / 已签到 / 在场 / 已离场+未到
3. 搜索栏输入姓名/单位筛选待签到嘉宾
4. 单个签到：点击嘉宾卡片上的「签到」按钮
5. 批量签到：勾选多位嘉宾 → 点击浮动操作栏的「批量签到」
6. 签到后：CHECKED_IN → 点击「入场」→ IN_HOUSE
7. 离场：IN_HOUSE → 点击「离场」→ DEPARTED
8. 未到：NOT_ARRIVED → 标记 NO_SHOW（终态）
9. 看板每 5 秒自动轮询刷新

### 5.3 接送分配流程

1. 在接送标签页创建订单（选嘉宾/接送类型/上车地点/时间/下车地点/航班）
2. 点击「分配车辆」→ 弹出搜索式分配弹窗
3. 输入车牌/司机搜索，每辆车显示详情卡片
4. 选中车辆 → 系统查询该车辆在该时间点的座位占用
5. 显示「已占 X/Y 座，剩余 Z 座」
6. 若有其他乘客：按钮变为「确认拼车」→ 弹出确认
7. 确认分配 → 订单状态变为 ASSIGNED
8. 可发放司机 Token → 司机通过链接自更新状态

### 5.4 嘉宾端分享流程

1. 工作人员在嘉宾管理 Sheet 面板点击「生成分享链接」
2. 系统生成 HMAC Token（30 天有效）→ 返回 `/guest/{token}` URL
3. 复制到剪贴板 → 通过微信/短信发给嘉宾
4. 嘉宾打开链接 → 看到完整行程（无需登录）

### 5.5 接待端分享流程

1. 工作人员在接待标签页点击分享图标 → 复制 `/companion/{id}` URL
2. 接待人员打开链接 → 看到分配到的每位嘉宾的完整信息
3. 接待人员点击「分享嘉宾行程给本人」→ 生成嘉宾端链接
4. 复制 → 转发给嘉宾

---

## 6. 三端门户

### 6.1 嘉宾端 `/guest/[token]`

| 项目 | 说明 |
|---|---|
| 认证 | HMAC-SHA256 Token，30 天有效，可吊销 |
| 页面内容 | 会议信息 + RSVP 状态 + 接送 + 住宿 + 餐饮 + 议程 + 礼品 + 接待人员 |
| 交互 | 纯只读 |
| 安全 | Token Hash 存库，原值仅返回一次 |
| 空状态 | 「链接无效或已过期，请联系会务组」 |

### 6.2 司机端 `/driver/[token]`

| 项目 | 说明 |
|---|---|
| 认证 | HMAC Token，7 天有效 |
| 页面内容 | 当日同车全部任务（当前任务高亮）+ 车辆信息 |
| 交互 | 状态更新按钮：出发→接到→送达 |
| API | POST `/api/driver/[token]/update` |

### 6.3 接待端 `/companion/[token]`

| 项目 | 说明 |
|---|---|
| 认证 | Companion ID（CUID，不可猜测但非 HMAC） |
| 页面内容 | 每位嘉宾的完整接待信息（档案/接送/住宿/餐饮/议程） |
| 交互 | 「分享嘉宾行程给本人」按钮（生成嘉宾端链接） |
| API | POST `/api/companion/share-guest` |

---

## 7. 边界条件与错误处理

### 7.1 嘉宾

| 场景 | 处理 |
|---|---|
| 手机号已存在 | ConflictError「Guest with phone {phone} already exists」 |
| 编辑时手机与他人冲突 | ConflictError「Phone {phone} already in use」 |
| 删除有随行的嘉宾 | ValidationError「该嘉宾有 N 位随行人员，请先迁移或删除随行」 |
| 嘉宾不存在 | NotFoundError → 404 页面 |

### 7.2 会议

| 场景 | 处理 |
|---|---|
| 编号已存在 | ConflictError「Meeting with code {code} already exists」 |
| 状态已是目标状态 | ValidationError「Meeting already in status {current}」 |
| 非法状态转换 | ValidationError「Invalid status transition: {current} -> {target}」 |

### 7.3 会议嘉宾

| 场景 | 处理 |
|---|---|
| 嘉宾已在会议中 | ValidationError「该嘉宾已在此会议中」 |
| 主嘉宾不存在 | NotFoundError「MeetingGuest (primary)」 |
| 主嘉宾不在同一会议 | ValidationError「主嘉宾必须在同一会议中」 |
| 删除有随行的会议嘉宾 | ValidationError「该嘉宾有 N 位随行人员」 |

### 7.4 议程

| 场景 | 处理 |
|---|---|
| 演讲嘉宾时间冲突 | ConflictError「演讲嘉宾在 {start} ~ {end} 已有议程「{title}」」 |
| 结束时间 ≤ 开始时间 | ConflictError「结束时间必须晚于开始时间」 |

### 7.5 接送

| 场景 | 处理 |
|---|---|
| 座位不足 | ValidationError「车辆座位不足: 已占 X + 本次需求 Y = Z > 容量 N」 |
| 非法状态转换 | ValidationError「非法状态转换: {current} -> {target}」 |

### 7.6 住宿

| 场景 | 处理 |
|---|---|
| 房间日期重叠 | ConflictError「该房间在此日期范围已被预订」 |
| 退房时间 ≤ 入住时间 | Zod 校验「退房时间必须晚于入住时间」 |

### 7.7 餐饮

| 场景 | 处理 |
|---|---|
| 餐桌超容量 | ValidationError「餐桌容量 N，已分配 M 人」 |

### 7.8 礼品

| 场景 | 处理 |
|---|---|
| 库存不足 | ConflictError「礼品「{name}」库存不足（剩 {stock}）」 |
| 非 PENDING 状态发放 | ConflictError「订单状态为 {status}，不可发放」 |

### 7.9 用户

| 场景 | 处理 |
|---|---|
| 邮箱已存在 | 「邮箱已存在」 |
| 删除自己 | 「不能删除自己」 |

### 7.10 登录

| 场景 | 处理 |
|---|---|
| 5 次失败 | RateLimitError「登录尝试过多，请 5 分钟后再试」 |
| Redis 不可用 | Fail-open（允许继续尝试） |

---

## 8. 数据校验规则

### 8.1 Zod Schema 清单

| Schema | 文件 | 校验内容 |
|---|---|---|
| guestCreateSchema | lib/shared/guest.ts | 姓名/手机正则/邮箱/身份证正则/等级 |
| meetingCreateSchema | lib/shared/meeting.ts | 名称/编号正则/日期 refine(end>start) |
| agendaCreateSchema | lib/shared/agenda.ts | 标题/类型/日期 refine |
| vehicleCreateSchema | lib/shared/transport.ts | 车牌/车型/容量 1-60/司机/电话正则 |
| transportCreateSchema | lib/shared/transport.ts | 类型/地点/时间 |
| hotelCreateSchema | lib/shared/lodging.ts | 名称/地址 |
| lodgingCreateSchema | lib/shared/lodging.ts | 日期 refine(checkOut>checkIn) |
| cateringCreateSchema | lib/shared/catering.ts | 餐类/时间 |
| giftCreateSchema | lib/shared/gift.ts | 名称/库存≥0/单价≥0 |
| companionCreateSchema | lib/shared/gift.ts | 姓名/电话正则(可选)/角色 |
| feeCreateSchema | lib/shared/gift.ts | 类别/金额≥0 |

### 8.2 正则规则

| 字段 | 正则 | 说明 |
|---|---|---|
| 手机 | `^1[3-9]\d{9}$` | 11 位中国手机号 |
| 身份证 | `^[1-9]\d{16}[\dXx]$` | 18 位身份证 |
| 会议编号 | `/^[A-Z0-9-]+$/i` | 大写字母/数字/连字符 |

---

## 9. UI/UX 规格

### 9.1 设计系统

- **主题**：Warm Professional（暖色 stone 基调）
- **主色**：stone-900（深灰黑），非渐变
- **背景**：#fafaf9（暖白）
- **侧边栏**：白色背景 + 右边框分隔
- **圆角**：10px（全局 `--radius-md`）
- **阴影**：暖色调低对比 `0 1px 3px rgba(28,25,23,0.04)`
- **字体**：系统字体栈（PingFang SC / Microsoft YaHei / Noto Sans CJK SC）
- **无远程资源**：不引用 CDN 字体或外部库

### 9.2 交互模式

| 模式 | 实现 |
|---|---|
| 表单提交 | Server Action + toast 反馈 + router.refresh() |
| 删除确认 | 浏览器 confirm() → action → toast |
| 加载状态 | 按钮 disabled + 文字切换（「创建中...」） |
| 空状态 | 居中灰色提示文字 |
| 页面过渡 | fadeIn 动画（0.2s） |
| 表格行 hover | 背景色变为 #fafaf9 |
| 标签页导航 | MeetingTabs 横向标签 + 下划线高亮 |
| 侧滑面板 | Sheet 组件（嘉宾任务详情） |
| 弹窗 | Dialog 组件（分配/添加） |

### 9.3 空状态文案

| 页面 | 文案 |
|---|---|
| 嘉宾列表 | 暂无数据 |
| 会议列表 | 暂无数据 |
| 议程 | 暂无议程，请使用上方表单添加 |
| 会议嘉宾 | 暂无嘉宾，点击右上角添加 |
| 看板列 | 暂无 |
| 接送 | 暂无接送任务 |
| 住宿 | 暂无住宿订单 |
| 餐饮 | 暂无餐饮订单 |
| 礼品 | 暂无礼品订单 |
| 接待 | 暂无接待分配 |
| 费用 | 暂无费用记录 |
| 车辆 | 暂无车辆，点击右上角添加 |
| 酒店 | 暂无酒店，请先新增酒店 |
| 餐桌 | 暂无餐桌，点击右上角添加 |
| 工作人员 | 暂无工作人员，点击右上角添加 |
| 我的任务 | 暂无分配给你的任务 |
| Dashboard | 未来 30 天暂无计划会议 |
| 审计日志 | 暂无审计记录 |
| 接待端 | 暂无接待任务 |
| 嘉宾详情-会议 | 该嘉宾暂未参加任何会议 |
| 嘉宾详情-任务 | 暂无接待任务 |

### 9.4 禁止事项

- 禁止 WebSocket（用 5 秒轮询替代）
- 禁止 emoji（用文字替代）
- 禁止 UI 渐变（用纯色）
- 禁止 `<SelectValue />`（用手动 `<span>` 映射 dict 标签）
- 禁止 fetch/axios 直调（用 Server Actions）

---

## 10. 非功能需求

### 10.1 性能

| 指标 | 目标 |
|---|---|
| 页面首屏加载 | < 2 秒（本地开发环境） |
| API 响应 | < 500ms（常规查询） |
| 审计日志写入 | 异步 fire-and-forget，不阻塞主操作 |
| 字典缓存 | 1 分钟内存缓存，减少 DB 查询 |
| 批量导入 | BullMQ 异步处理，不阻塞 UI |
| 看板轮询 | 5 秒间隔，TanStack Query 缓存 |

### 10.2 可用性

| 指标 | 目标 |
|---|---|
| 单点故障 | Docker 容器自动重启 |
| 健康检查 | `/api/health` 端点（DB SELECT 1） |
| Rate limit | Fail-open（Redis 不可用时不阻塞登录） |
| 数据备份 | scripts/backup.sh（gzip pg_dump，保留 7 份） |

### 10.3 并发控制

| 场景 | 当前实现 | 风险 |
|---|---|---|
| 礼品发放 | prisma.$transaction（原子） | 无风险 |
| 车辆容量分配 | 先读后写（非事务） | 并发分配可能超容量 |
| 餐桌容量 | 先读后写（非事务） | 并发分配可能超容量 |
| 房间冲突 | 先查后写（非事务） | 并发分配可能冲突 |
| 状态转换 | 先读后写（非事务） | 并发操作可能破坏状态机 |
| Token 发放 | prisma.upsert（原子） | 无风险 |

**待改进**：为高风险操作添加乐观锁或数据库级约束。

---

## 11. 安全架构

### 11.1 认证

- NextAuth v5 Credentials Provider
- JWT Session（8 小时 TTL）
- Dual Config（Edge-safe for proxy.ts，Node 完整 for API/auth）
- bcrypt 12 轮密码哈希

### 11.2 授权

- CASL 7 策略引擎
- SUPER_ADMIN：`can('manage', 'all')`
- VIEWER：只读 + 脱敏 + 禁止审计/用户管理
- 会议级角色（MeetingStaff）：已定义但未在 RBAC 层执行

### 11.3 数据加密

| 字段 | 加密方式 |
|---|---|
| Guest.phone | AES-256-GCM（Prisma $extends 透明加解密） |
| Guest.idNumber | AES-256-GCM |
| User.passwordHash | bcrypt 12 轮 |

### 11.4 字段脱敏

VIEWER 角色读取嘉宾时：
- 手机：`138****1234`（前 3 后 4）
- 身份证：`110********1234`（前 3 后 4，固定 8 星号不泄露长度）

### 11.5 Token 安全

| Token 类型 | 生成 | 存储 | TTL | 吊销 |
|---|---|---|---|---|
| 嘉宾端 | HMAC-SHA256(NEXTAUTH_SECRET, random) | tokenHash 入库 | 30 天 | revokedAt |
| 司机端 | HMAC-SHA256 | tokenHash 入库 | 7 天 | 无（待改进） |
| 接待端 | Companion ID（CUID） | 无额外存储 | 永久 | 无（待改进） |

### 11.6 速率限制

- 登录端点：5 次/5 分钟（Redis 滑动窗口）
- Fail-open 设计

### 11.7 审计

- 48 个日志点覆盖全部 Server Action
- fire-and-forget
- 记录：操作者/动作/实体/变更前后 JSON

---

## 12. 通知触发规则

通知系统模型已建（NotificationTemplate / NotificationLog），接口已实现（日志模式，无真实 SMS）。以下为规划中的通知触发规则：

| 事件 | 接收者 | 渠道 | 模板代码 |
|---|---|---|---|
| 嘉宾被添加到会议 | 嘉宾 | SMS/微信 | meeting.invite |
| 会议状态变更 | 会议嘉宾 | SMS | meeting.status_change |
| 接送分配车辆 | 司机 + 嘉宾 | SMS | transport.assigned |
| 接送出发 | 嘉宾 | SMS | transport.en_route |
| 接送已接到 | 会务组 | 系统 | transport.picked_up |
| 住宿分配房间 | 嘉宾 | SMS | lodging.reserved |
| 接待人员分配 | 接待人员 + 嘉宾 | SMS | companion.assigned |
| 嘉宾签到成功 | 会务组 | 系统 | guest.checkin |
| 嘉宾未到 | 会议负责人 | 系统 | guest.noshow |
| 礼品库存不足 | 礼品主管 | 系统 | gift.low_stock |
| 任务分配 | 被分配人 | 系统 | task.assigned |
| 嘉宾 Token 发放 | 嘉宾 | SMS | token.guest_link |

---

## 13. 数据保留策略

| 数据 | 策略 |
|---|---|
| 审计日志 | 永久保留（合规要求） |
| 嘉宾档案 | 软删除（deletedAt 标记），不物理删除 |
| GuestAccessToken | 30 天过期，可手动吊销 |
| DriverAccessToken | 7 天过期 |
| 数据库备份 | 保留最近 7 份（backup.sh） |
| 导入临时文件 | 上传目录 `tmp/uploads/`，处理后可手动清理 |

---

## 14. 技术架构

### 14.1 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端+后端 | Next.js (App Router, Turbopack) | 16.2.10 |
| 运行时 | React | 19.2.4 |
| UI | shadcn/ui + Tailwind CSS | 4.12 / v4 |
| 表单 | React Hook Form + Zod | 7.81 / 4.4 |
| ORM | Prisma | 7.8 |
| 数据库 | PostgreSQL | 16 |
| 缓存/队列 | Redis + BullMQ | 7 / 5.80 |
| 认证 | Auth.js (NextAuth v5) | beta.31 |
| 权限 | CASL.js | 7.0 |
| 测试 | Vitest + Playwright | 4.1 / 1.61 |
| 包管理 | pnpm | 11.13 |

### 14.2 领域分层

```
app/actions/*.actions.ts    ← Server Actions（入口：auth + validation）
        ↓
lib/domain/<module>/
  ├── types.ts              ← TypeScript 类型
  ├── repository.ts         ← Prisma 数据访问
  └── service.ts            ← 业务规则（状态机 + 冲突检测 + 费用钩子）
        ↓
lib/db/client.ts            ← Prisma Client + AES 加密扩展
```

### 14.3 端口分配

| 服务 | 端口 |
|---|---|
| Web (Next.js) | 3010 |
| PostgreSQL | 5434 |
| Redis | 6381 |

### 14.4 Docker

- 多阶段构建（deps → builder → runner）
- 非 root 用户运行
- Healthcheck 集成 `/api/health`
- 独立 project name（`cmms`）+ 自定义 network + bind mount

### 14.5 后台任务

BullMQ Worker 独立进程（`pnpm worker:start`）：
- `guest-import`：嘉宾 Excel 导入
- `meeting-guest-import`：会议嘉宾 Excel 导入（智能排序：主嘉宾优先）

---

## 15. 约束与假设

### 15.1 业务约束

| 约束 | 值 | 说明 |
|---|---|---|
| 单场会议嘉宾上限 | ~500 | 页面查询 pageSize 参数最大值 |
| 车辆座位上限 | 60 | Zod 校验 capacity ≤ 60 |
| 餐桌容量上限 | 30 | Zod 校验 capacity ≤ 30 |
| 嘉宾姓名长度 | 100 字符 | Zod 校验 |
| 备注长度 | 2000 字符 | Zod 校验 |
| 会议编号格式 | 大写字母+数字+连字符 | 正则校验 |
| Token TTL | 嘉宾 30 天 / 司机 7 天 | 过期自动失效 |

### 15.2 技术假设

- 单组织使用（无多租户）
- 中文界面（无 i18n）
- 无 WebSocket（用 5 秒轮询）
- 无 SMS 网关（通知系统预留接口）
- 管理员 trusted（无 CSRF Token，依赖 httpOnly Cookie SameSite=strict）

---

## 16. 已知限制与待改进项

| # | 限制 | 影响 | 优先级 |
|---|---|---|---|
| 1 | 会议级角色未在 RBAC 执行 | OWNER/RECEPTION_LEAD 等角色名义存在，实际权限仍为 SUPER_ADMIN/VIEWER 二分 | 高 |
| 2 | 并发控制不足 | 车辆容量/餐桌容量/房间冲突检测为先读后写，高并发下可能不一致 | 高 |
| 3 | 通知系统未接入 | 通知模型和接口已建，但无真实 SMS 发送，所有通知停留在 PENDING | 中 |
| 4 | 接待端 Token 安全较弱 | 使用 Companion ID 而非 HMAC Token | 中 |
| 5 | 司机端 Token 无吊销 | 无法中途撤销司机访问 | 低 |
| 6 | 餐饮无状态更新 UI | SCHEDULED/SEATED/FINISHED/CANCELED 状态枚举存在但无界面操作 | 低 |
| 7 | 室友容量未校验 | roommateIds 可设置但不检测房间实际容量 | 低 |
| 8 | inheritLodging 未使用 | 接送容量计算用了 inheritTransport，但住宿未用 inheritLodging | 低 |
| 9 | 批量导入无权限检查 | import.actions.ts 未调用 assertAuthorized | 低 |
| 10 | 时间戳未记录 | actualPickupAt/actualCheckInAt/actualCheckOutAt 字段存在但无操作设置 | 低 |

---

## 17. 术语表

| 术语 | 英文 | 说明 |
|---|---|---|
| 会务管理 | Conference Management | 会议的组织和接待运营 |
| 主嘉宾 | Primary Guest | 独立参会的 VIP，可携带随行人员 |
| 随行人员 | Entourage | 跟随主嘉宾参会的人员（秘书/安保/翻译等） |
| 签到 | Check-in | 嘉宾到达会场后的登记确认 |
| 接送调度 | Transport Dispatch | 安排车辆接送嘉宾的统筹工作 |
| 拼车 | Ride-sharing | 多位嘉宾共用一辆车 |
| 住宿分配 | Lodging Assignment | 为嘉宾分配酒店房间 |
| 餐饮安排 | Catering | 会议期间的用餐安排 |
| 礼品发放 | Gift Distribution | 向嘉宾发放会议礼品 |
| 接待人员 | Companion/Reception Host | 负责全程或特定环节陪同嘉宾的工作人员 |
| RSVP | Répondez s'il vous plaît | 嘉宾参会确认（待确认/已确认/已拒绝） |
| 行程门户 | Itinerary Portal | 嘉宾通过链接查看自己的参会行程 |
| 资源池 | Resource Pool | 会议专用的车辆/酒店/餐桌等资源 |
| 字典管理 | Dictionary Management | 枚举标签的后台配置系统 |
| 状态机 | State Machine | 业务对象状态转换的严格规则 |
| 审计日志 | Audit Log | 所有操作的追溯记录 |
| Guest 360 | — | 嘉宾跨会议的完整接待记录视图 |
| 指挥中心 | Command Center | 会议详情页的任务概览仪表盘 |

---

*文档完*
