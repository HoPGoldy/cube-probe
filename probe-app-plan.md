# Cube-Auth 探针 Web 应用实现计划

## 1. 应用概述

- 创建一个探针监控应用，支持创建服务(Service)和接口(EndPoint)
- 每个 Service 下可创建多个 EndPoint
- EndPoint 可指定 URL、自定义 Header 列表和 Cron 表达式
- 使用 node-cron 调度任务进行接口监控
- Service 级别的参数可作为 EndPoint 的默认值

## 2. 数据库模型设计

### 2.1 Service 模型

- `id`: 主键
- `name`: 服务名称
- `url`: 服务基础 URL (可选)
- `headers`: 自定义请求头 JSON (可选)
- `cronExpression`: 默认 Cron 表达式 (可选)
- `enabled`: 是否启用 (默认为 true)
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 2.2 EndPoint 模型

- `id`: 主键
- `hostId`: 关联 Service 的外键
- `name`: 接口名称
- `url`: 接口 URL (如果为空则使用 Service 的 URL)
- `headers`: 自定义请求头 JSON (如果为空则使用 Service 的 headers)
- `cronExpression`: Cron 表达式 (如果为空则使用 Service 的 cronExpression)
- `enabled`: 是否启用 (默认为 true)
- `timeout`: 请求超时时间 (可选)
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 2.3 ProbeResult 模型

- `id`: 主键
- `endPointId`: 关联 EndPoint 的外键
- `status`: HTTP 状态码
- `responseTime`: 响应时间 (毫秒)
- `timestamp`: 检查时间戳
- `success`: 是否成功 (布尔值)
- `message`: 详细信息或错误消息
- `createdAt`: 创建时间

## 3. 后端实现

### 3.1 依赖添加

- 安装 node-cron for 任务调度
- 安装 axios for HTTP 请求
- 安装其他可能需要的 HTTP 监控相关依赖

### 3.2 调度服务实现

- 创建 CronService 负责管理和调度探针任务
- 根据 EndPoint 配置动态添加/删除/更新 cron 任务
- 实现 HTTP 请求逻辑，支持自定义 headers
- 实现结果记录和错误处理

### 3.3 API 接口实现

- Service 相关接口：
  - GET /api/services - 获取所有服务
  - POST /api/services - 创建服务
  - GET /api/services/:id - 获取特定服务
  - PUT /api/services/:id - 更新服务
  - DELETE /api/services/:id - 删除服务

- EndPoint 相关接口：
  - GET /api/services/:hostId/endpoints - 获取服务下所有接口
  - POST /api/services/:hostId/endpoints - 创建接口
  - GET /api/endpoints/:id - 获取特定接口
  - PUT /api/endpoints/:id - 更新接口
  - DELETE /api/endpoints/:id - 删除接口

- 结果和监控相关接口：
  - GET /api/endpoints/:id/results - 获取接口的探针结果
  - GET /api/services/:hostId/results - 获取服务下所有接口的结果
  - GET /api/dashboard/overview - 获取整体监控概览

### 3.4 DTOs 和验证

- 创建 Service 和 EndPoint 的创建/更新 DTO
- 添加参数验证和错误处理

## 4. 前端实现

### 4.1 新增页面

- 服务管理页面 (Services Management)
- 接口管理页面 (Endpoints Management)
- 探针结果页面 (Probe Results)
- 监控仪表板 (Dashboard)

### 4.2 组件开发

- Service 表单组件 (创建/编辑 Service)
- EndPoint 表单组件 (创建/编辑 EndPoint)
- EndPoint 列表组件 (显示 EndPoint 列表)
- 结果图表组件 (显示响应时间图表)
- 状态指示器组件 (显示服务/接口状态)

### 4.3 页面路由

- 添加新页面的路由配置
- 更新导航菜单

## 5. 功能实现要点

### 5.1 参数继承逻辑

- 实现 EndPoint 从 Service 继承参数的逻辑
- 当 EndPoint 的参数为空时，使用 Service 的对应参数

### 5.2 调度管理

- 实现动态调度任务的添加、更新和删除
- 支持启用/禁用单个 EndPoint 的监控任务
- 支持启用/禁用整个 Service 的监控

### 5.3 响应处理

- 记录每次请求的详细信息
- 区分成功/失败的响应
- 记录响应时间和错误信息

## 6. 整合到现有系统

- 遵循现有的代码结构和命名约定
- 使用现有的认证和授权机制
- 整合到现有的 UI/UX 设计风格
- 使用现有的状态管理方案 (Jotai)
- 遵循现有的 API 设计模式

## 7. 测试和验证

- 编写单元测试验证业务逻辑
- 编写端到端测试验证前端功能
- 验证 Cron 任务的正确调度
- 验证参数继承逻辑的正确性
