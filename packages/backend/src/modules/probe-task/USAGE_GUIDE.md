# Probe Task Scheduling 使用指南

本项目提供了两种探测任务调度方式：**CronService**（基于 cron 表达式）和 **IntervalProbeService**（基于固定间隔）。

## 🎯 调度方式对比

| 特性 | CronService | IntervalProbeService |
|------|-------------|---------------------|
| **调度模式** | Cron 表达式 | 固定时间间隔（秒） |
| **时间精度** | 秒级（6 位 cron） | 秒级 |
| **配置复杂度** | 较高（需要理解 cron） | 低（只需秒数） |
| **适用场景** | 定时任务、特定时间点 | 持续监控、固定间隔 |
| **示例** | `*/30 * * * * *`（每30秒） | `30`（每30秒） |
| **灵活性** | 高（支持复杂时间规则） | 低（仅支持固定间隔） |
| **易用性** | 需要学习 cron 语法 | 简单直观 |

## 🚀 如何选择

### 使用 CronService（推荐场景）

- ✅ 需要在特定时间点执行任务（如每天凌晨1点）
- ✅ 需要复杂的调度规则（如工作日的9-18点每小时）
- ✅ 需要避开特定时间段
- ✅ 需要在多个时间点执行不同的探测

**示例：**
```typescript
// 每天凌晨 1 点执行
cronExpression: "0 0 1 * * *"

// 工作日每小时执行
cronExpression: "0 0 * * * 1-5"

// 每 5 分钟执行
cronExpression: "0 */5 * * * *"
```

### 使用 IntervalProbeService（推荐场景）

- ✅ 需要持续不断地监控服务
- ✅ 只需要固定间隔的简单调度
- ✅ 团队成员不熟悉 cron 表达式
- ✅ 需要高频率的监控（如每 10 秒一次）
- ✅ 需要动态调整监控频率

**示例：**
```typescript
// 每 10 秒执行（高频监控）
intervalSeconds: 10

// 每 30 秒执行（常规监控）
intervalSeconds: 30

// 每 5 分钟执行（低频监控）
intervalSeconds: 300
```

## 📦 在项目中启用

### 1. 同时使用两种服务（推荐）

在 `build-service.ts` 中，两个服务已经初始化，但 IntervalProbeService 默认未启动：

```typescript
// 启动 Cron 调度服务
await cronService.startProbeScheduler();

// 启动间隔调度服务（取消注释以启用）
await intervalProbeService.startProbeScheduler();
```

**优势：** 可以根据不同的监控端点选择合适的调度方式。

### 2. 只使用 CronService

保持默认配置，不需要任何修改。适合已经熟悉 cron 表达式的团队。

### 3. 只使用 IntervalProbeService

注释掉 CronService 的启动：

```typescript
// await cronService.startProbeScheduler();  // 注释掉
await intervalProbeService.startProbeScheduler();
```

## 💡 数据库集成建议

为了支持两种调度方式，可以扩展数据库 Schema：

```prisma
model EndPoint {
  id              String   @id @default(uuid())
  
  // 现有字段
  cron            String?  // Cron 表达式（可选）
  
  // 新增字段
  intervalSeconds Int?     // 间隔秒数（可选）
  scheduleMode    String   @default("cron") // "cron" | "interval"
  
  // ... 其他字段
}

model Service {
  id              String   @id @default(uuid())
  
  // 现有字段
  cron            String?
  
  // 新增字段
  intervalSeconds Int?
  scheduleMode    String   @default("cron")
  
  // ... 其他字段
}
```

## 🔧 API 使用示例

### CronService 方式

```typescript
// 添加 cron 调度任务
await endPointService.create({
  name: "API Health Check",
  url: "https://api.example.com/health",
  cron: "*/30 * * * * *", // 每 30 秒
  enabled: true
});
```

### IntervalProbeService 方式

```typescript
// 方式 1: 直接使用服务
await intervalProbeService.addEndpointToScheduler("endpoint-id", 30);

// 方式 2: 通过数据库配置（需要修改 EndPointService）
await endPointService.create({
  name: "API Health Check",
  url: "https://api.example.com/health",
  intervalSeconds: 30, // 每 30 秒
  scheduleMode: "interval",
  enabled: true
});
```

## 🎛️ 运行时控制

### IntervalProbeService 支持更灵活的控制

```typescript
// 暂停任务（不删除）
await intervalProbeService.pauseEndpoint("endpoint-id");

// 恢复任务
await intervalProbeService.resumeEndpoint("endpoint-id");

// 手动触发一次探测
await intervalProbeService.triggerManualProbe("endpoint-id");

// 更新间隔时间
await intervalProbeService.updateEndpointInScheduler("endpoint-id", 60);

// 查看所有活动任务
const status = intervalProbeService.getActiveTasksStatus();
console.log(status);
```

### CronService 的控制

```typescript
// CronService 主要通过数据库更新来控制
await endPointService.update(id, {
  enabled: false  // 停止调度
});

await endPointService.update(id, {
  cron: "*/60 * * * * *"  // 修改调度规则
});
```

## 📊 监控和调试

两种服务都会输出详细的日志：

```bash
# CronService 日志
[Cron] Scheduled probe for endpoint xxx with cron: */30 * * * * *
[Cron] Probe completed for endpoint xxx: Status 200, Response time: 123ms

# IntervalProbeService 日志
[Interval] Scheduled probe for endpoint xxx with interval: 30s
[Interval] Probe completed for endpoint xxx: Status 200, Response time: 123ms
[Interval] Paused probe for endpoint xxx
[Interval] Resumed probe for endpoint xxx
```

## ⚠️ 注意事项

1. **避免重复调度：** 确保同一个 endpoint 不要同时在两个服务中调度
2. **资源消耗：** 高频率的间隔调度可能增加系统负载
3. **错误处理：** 两种服务都有完善的错误处理，失败不会影响其他任务
4. **最小间隔：** IntervalProbeService 建议最小间隔 >= 5 秒

## 🔍 常见问题

### Q: 可以同时使用两种调度方式吗？
**A:** 可以。两个服务是独立的，可以同时运行。但建议为不同的 endpoint 选择合适的调度方式。

### Q: 如何迁移现有的 cron 任务到 interval 模式？
**A:** 计算等效的秒数即可。例如 `*/30 * * * * *` 等于 `intervalSeconds: 30`。

### Q: IntervalProbeService 支持暂停功能吗？
**A:** 支持。使用 `pauseEndpoint()` 和 `resumeEndpoint()` 方法。

### Q: 哪个服务性能更好？
**A:** 两者性能相近。IntervalProbeService 在任务管理上更轻量，CronService 在复杂调度上更强大。

## 📚 相关文档

- [CronService 文档](./cron-service.ts)
- [IntervalProbeService 文档](./INTERVAL_SERVICE.md)
- [测试用例](./\__tests__)
