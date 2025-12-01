# 通知模块设计方案

## 概述

通知模块用于在探测失败/恢复时，通过 Webhook 方式发送告警通知到钉钉、飞书、企业微信等平台。

## 核心理念

1. **事件驱动** - 基于探测结果事件触发通知，而不是轮询检查
2. **统一 Webhook** - 所有渠道本质都是 HTTP POST，通过模板适配不同平台格式
3. **防抖动** - 支持配置连续失败 N 次后才通知，避免网络抖动导致误报
4. **状态恢复通知** - 不仅通知故障，也通知服务恢复
5. **独立模块** - 规则与 EndPoint 解耦，支持灵活的多对多关联

---

## 数据模型

### NotificationChannel（通知渠道）

存储 Webhook 配置，如钉钉群、飞书群等。

```prisma
model NotificationChannel {
  id           String             @id @default(uuid())
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  name         String             // 渠道名称，如 "运维钉钉群"
  webhookUrl   String             // Webhook 地址
  headers      Json?              // 自定义请求头（如 Authorization）
  bodyTemplate String             // 请求体模板（支持变量替换）
  enabled      Boolean            @default(true)

  rules        NotificationRule[]
}
```

### NotificationRule（通知规则）

定义什么情况下、通知到哪个渠道。

```prisma
enum NotificationScopeType {
  ALL       // 全局规则，所有端点
  HOST      // 指定 Host（Service）下所有端点
  ENDPOINT  // 指定单个端点
}

model NotificationRule {
  id                  String              @id @default(uuid())
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  name                String              // 规则名称
  enabled             Boolean             @default(true)

  // 作用范围
  scopeType           NotificationScopeType @default(ALL)
  hostId              String?             // scopeType 为 HOST 时必填
  endpointId          String?             // scopeType 为 ENDPOINT 时必填

  // 触发条件
  consecutiveFailures Int      @default(3)  // 连续失败 N 次后触发
  cooldownMinutes     Int      @default(30) // 冷却时间（分钟）
  notifyOnRecovery    Boolean  @default(true) // 恢复时是否通知

  // 关联
  channelId           String
  channel             NotificationChannel @relation(fields: [channelId], references: [id])
  host                Service?            @relation(fields: [hostId], references: [id])
  endpoint            EndPoint?           @relation(fields: [endpointId], references: [id])

  @@index([hostId])
  @@index([endpointId])
}
```

### NotificationLog（通知记录）

记录通知发送历史，用于排查和审计。

```prisma
model NotificationLog {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())
  ruleId      String
  endpointId  String
  eventType   String   // FAILURE / RECOVERY
  title       String
  content     String
  success     Boolean
  errorMsg    String?

  @@index([ruleId])
  @@index([endpointId])
  @@index([createdAt])
}
```

---

## 内存状态

以下状态存储在内存中，无需持久化：

```typescript
// NotificationService 内部
private endpointStatus: Map<string, {
  consecutiveFailures: number;    // 连续失败次数
  currentStatus: 'UP' | 'DOWN';   // 当前状态
  lastNotifiedAt: Date | null;    // 上次通知时间（用于冷却）
}> = new Map();
```

**为什么不存数据库？**

- 读写频繁（每次探测都更新）
- 临时状态，无需持久化
- 进程重启后重新计算即可

---

## 规则匹配逻辑

当端点探测结果产生时，查找所有匹配的规则：

1. **scopeType = ALL** - 匹配所有端点
2. **scopeType = HOST** - `hostId` 等于该端点所属 Service 的 ID
3. **scopeType = ENDPOINT** - `endpointId` 等于该端点 ID

同一个端点可以匹配多条规则，都会触发（发送到不同渠道）。

### 匹配查询示例

假设探测结果为：

- `endpointId`: `ep-123`
- 该端点所属 `serviceId`（hostId）: `svc-456`

查询匹配规则的 SQL 逻辑：

```sql
SELECT * FROM NotificationRule
WHERE enabled = true
  AND (
    scopeType = 'ALL'                                    -- 全局规则
    OR (scopeType = 'HOST' AND hostId = 'svc-456')       -- Host 级规则
    OR (scopeType = 'ENDPOINT' AND endpointId = 'ep-123') -- 端点级规则
  )
```

对应 Prisma 查询：

```typescript
const rules = await prisma.notificationRule.findMany({
  where: {
    enabled: true,
    OR: [
      { scopeType: "ALL" },
      { scopeType: "HOST", hostId: endpoint.serviceId },
      { scopeType: "ENDPOINT", endpointId: endpoint.id },
    ],
  },
  include: { channel: true },
});
```

---

## 通知触发流程

```
探测执行 (IntervalProbeService)
    ↓
保存结果 (ProbeResult)
    ↓
通知服务处理 (NotificationService.processProbeResult)
    ↓
更新内存状态 (consecutiveFailures, currentStatus)
    ↓
检测状态变化 (UP→DOWN 或 DOWN→UP)
    ↓
查找匹配的规则
    ↓
检查触发条件（连续失败次数、冷却时间）
    ↓
渲染模板 & 发送 Webhook
    ↓
记录日志 (NotificationLog)
```

### 状态变化时序示例

```
时间轴 →

端点探测:    ✓   ✓   ✗   ✗   ✗   ✓   ✓
连续失败:    0   0   1   2   3   0   0
状态:       UP  UP  UP  UP  DOWN UP  UP
                          ↑       ↑
                       通知故障  通知恢复
                    (达到3次阈值)
```

---

## 请求体模板

使用 `{{变量}}` 语法，支持以下变量：

| 变量                              | 说明          | 示例                    |
| --------------------------------- | ------------- | ----------------------- |
| `{{eventType}}`                   | 事件类型      | `FAILURE` / `RECOVERY`  |
| `{{endpoint.name}}`               | 端点名称      | `健康检查`              |
| `{{endpoint.url}}`                | 端点 URL      | `/api/health`           |
| `{{service.name}}`                | 服务名称      | `生产环境 API`          |
| `{{details.status}}`              | HTTP 状态码   | `500`                   |
| `{{details.responseTime}}`        | 响应时间 (ms) | `1234`                  |
| `{{details.message}}`             | 错误信息      | `Internal Server Error` |
| `{{details.consecutiveFailures}}` | 连续失败次数  | `3`                     |
| `{{timestamp}}`                   | 触发时间      | `2025-12-01T10:00:00Z`  |

### 钉钉模板示例

```json
{
  "msgtype": "markdown",
  "markdown": {
    "title": "{{eventType}} - {{endpoint.name}}",
    "text": "### {{eventType}}\n- **服务**: {{service.name}}\n- **端点**: {{endpoint.name}}\n- **URL**: {{endpoint.url}}\n- **状态码**: {{details.status}}\n- **消息**: {{details.message}}\n- **时间**: {{timestamp}}"
  }
}
```

### 飞书模板示例

```json
{
  "msg_type": "text",
  "content": {
    "text": "[{{eventType}}] {{service.name}} - {{endpoint.name}}\n{{details.message}}\n时间: {{timestamp}}"
  }
}
```

### 通用 Webhook 模板

```json
{
  "event": "{{eventType}}",
  "service": "{{service.name}}",
  "endpoint": "{{endpoint.name}}",
  "url": "{{endpoint.url}}",
  "status": {{details.status}},
  "message": "{{details.message}}",
  "timestamp": "{{timestamp}}"
}
```

---

## 规则配置示例

### 示例 1：全局故障通知

所有端点连续失败 3 次后通知钉钉。

```yaml
name: "全局故障通知"
scopeType: ALL
hostId: null
endpointId: null
channelId: "钉钉运维群"
consecutiveFailures: 3
cooldownMinutes: 30
notifyOnRecovery: true
```

### 示例 2：指定 Host 下所有端点

生产环境 API 下任意端点失败都通知。

```yaml
name: "生产环境告警"
scopeType: HOST
hostId: "生产环境 API"
endpointId: null
channelId: "飞书告警群"
consecutiveFailures: 2
cooldownMinutes: 15
notifyOnRecovery: true
```

### 示例 3：关键接口单独配置

订单接口失败 1 次就立即通知飞书。

```yaml
name: "订单接口告警"
scopeType: ENDPOINT
hostId: null
endpointId: "订单接口"
channelId: "飞书告警群"
consecutiveFailures: 1 # 更敏感
cooldownMinutes: 10 # 冷却更短
notifyOnRecovery: true
```

### 示例 4：测试环境宽松策略

测试环境连续 5 次才通知，恢复不通知。

```yaml
name: "测试环境故障"
scopeType: HOST
hostId: "测试环境 API"
endpointId: null
channelId: "钉钉运维群"
consecutiveFailures: 5
cooldownMinutes: 60
notifyOnRecovery: false
```

---

## 模块结构

```
packages/backend/src/modules/notification/
├── service.ts              # 通知服务主逻辑
├── controller.ts           # API 接口（渠道/规则 CRUD）
├── schema.ts               # TypeBox 类型定义
├── template.ts             # 模板渲染工具
└── __tests__/
    └── service.test.ts
```

---

## API 接口设计

### 通知渠道

| 方法 | 路径                           | 说明         |
| ---- | ------------------------------ | ------------ |
| POST | `/notification/channel/create` | 创建渠道     |
| POST | `/notification/channel/update` | 更新渠道     |
| POST | `/notification/channel/delete` | 删除渠道     |
| POST | `/notification/channel/list`   | 渠道列表     |
| POST | `/notification/channel/test`   | 发送测试通知 |

### 通知规则

| 方法 | 路径                        | 说明     |
| ---- | --------------------------- | -------- |
| POST | `/notification/rule/create` | 创建规则 |
| POST | `/notification/rule/update` | 更新规则 |
| POST | `/notification/rule/delete` | 删除规则 |
| POST | `/notification/rule/list`   | 规则列表 |

### 通知记录

| 方法 | 路径                     | 说明         |
| ---- | ------------------------ | ------------ |
| POST | `/notification/log/list` | 通知记录列表 |

---

## 前端页面

1. **通知渠道管理** - 配置 Webhook URL、请求头、消息模板
2. **通知规则管理** - 配置作用范围、触发条件、关联渠道
3. **通知记录** - 查看历史通知，排查问题
4. **测试通知** - 验证渠道配置是否正确

---

## 与现有系统集成

在 `IntervalProbeService` 中集成：

```typescript
// interval-service.ts
const result = await this.saveProbeResult(...);

// 异步处理通知，不阻塞探测
this.notificationService.processProbeResult(result).catch(err => {
  console.error('[Notification] Failed to process:', err);
});
```

---

## 进程重启影响

重启后内存状态清空：

- 连续失败计数从 0 开始
- 状态默认 UP

**影响**：如果端点仍在故障，需要重新累计失败次数才会触发通知。

**可接受原因**：

- 重启不频繁
- 最多延迟几次探测（如 3 次 × 10 秒 = 30 秒）
- 无数据丢失风险
