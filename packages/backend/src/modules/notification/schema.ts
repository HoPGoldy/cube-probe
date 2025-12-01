import { Type, Static } from "typebox";
import type {
  NotificationChannel,
  NotificationRule,
  NotificationLog,
} from "@db/client";

// ==================== NotificationScopeType ====================
export const SchemaNotificationScopeType = Type.Union(
  [Type.Literal("ALL"), Type.Literal("HOST"), Type.Literal("ENDPOINT")],
  {
    description: "规则作用范围：ALL(全局)、HOST(指定服务)、ENDPOINT(指定端点)",
  },
);

// ==================== Channel Schemas ====================

export const SchemaChannelCreate = Type.Object({
  name: Type.String({
    description: "渠道名称",
    minLength: 1,
    maxLength: 100,
  }),
  webhookUrl: Type.String({
    description: "Webhook 地址",
    minLength: 1,
  }),
  headers: Type.Optional(Type.Any({ description: "自定义请求头 JSON" })),
  bodyTemplate: Type.String({
    description: "请求体模板",
    minLength: 1,
  }),
  enabled: Type.Optional(Type.Boolean({ description: "是否启用" })),
});

export type SchemaChannelCreateType = Static<typeof SchemaChannelCreate>;

export const SchemaChannelUpdate = Type.Object({
  id: Type.String({ description: "渠道 ID" }),
  name: Type.Optional(
    Type.String({
      description: "渠道名称",
      minLength: 1,
      maxLength: 100,
    }),
  ),
  webhookUrl: Type.Optional(
    Type.String({
      description: "Webhook 地址",
      minLength: 1,
    }),
  ),
  headers: Type.Optional(Type.Any({ description: "自定义请求头 JSON" })),
  bodyTemplate: Type.Optional(
    Type.String({
      description: "请求体模板",
      minLength: 1,
    }),
  ),
  enabled: Type.Optional(Type.Boolean({ description: "是否启用" })),
});

export type SchemaChannelUpdateType = Static<typeof SchemaChannelUpdate>;

export const SchemaChannelDelete = Type.Object({
  id: Type.String({ description: "渠道 ID" }),
});

export type SchemaChannelDeleteType = Static<typeof SchemaChannelDelete>;

export const SchemaChannelDetail = Type.Object({
  id: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  name: Type.String(),
  webhookUrl: Type.String(),
  headers: Type.Union([Type.Any(), Type.Null()]),
  bodyTemplate: Type.String(),
  enabled: Type.Boolean(),
});

export type SchemaChannelDetailType = Static<typeof SchemaChannelDetail>;

export const SchemaChannelTest = Type.Object({
  id: Type.String({ description: "渠道 ID" }),
});

export type SchemaChannelTestType = Static<typeof SchemaChannelTest>;

// ==================== Rule Schemas ====================

export const SchemaRuleCreate = Type.Object({
  name: Type.String({
    description: "规则名称",
    minLength: 1,
    maxLength: 100,
  }),
  enabled: Type.Optional(Type.Boolean({ description: "是否启用" })),
  scopeType: Type.Optional(SchemaNotificationScopeType),
  hostId: Type.Optional(
    Type.Union([Type.String(), Type.Null()], {
      description: "服务 ID (scopeType 为 HOST 时必填)",
    }),
  ),
  endpointId: Type.Optional(
    Type.Union([Type.String(), Type.Null()], {
      description: "端点 ID (scopeType 为 ENDPOINT 时必填)",
    }),
  ),
  consecutiveFailures: Type.Optional(
    Type.Integer({
      description: "连续失败 N 次后触发",
      minimum: 1,
      maximum: 100,
      default: 3,
    }),
  ),
  cooldownMinutes: Type.Optional(
    Type.Integer({
      description: "冷却时间(分钟)",
      minimum: 0,
      maximum: 1440, // 最大 1 天
      default: 30,
    }),
  ),
  notifyOnRecovery: Type.Optional(
    Type.Boolean({
      description: "恢复时是否通知",
      default: true,
    }),
  ),
  channelId: Type.String({ description: "通知渠道 ID" }),
});

export type SchemaRuleCreateType = Static<typeof SchemaRuleCreate>;

export const SchemaRuleUpdate = Type.Object({
  id: Type.String({ description: "规则 ID" }),
  name: Type.Optional(
    Type.String({
      description: "规则名称",
      minLength: 1,
      maxLength: 100,
    }),
  ),
  enabled: Type.Optional(Type.Boolean({ description: "是否启用" })),
  scopeType: Type.Optional(SchemaNotificationScopeType),
  hostId: Type.Optional(
    Type.Union([Type.String(), Type.Null()], {
      description: "服务 ID",
    }),
  ),
  endpointId: Type.Optional(
    Type.Union([Type.String(), Type.Null()], {
      description: "端点 ID",
    }),
  ),
  consecutiveFailures: Type.Optional(
    Type.Integer({
      description: "连续失败 N 次后触发",
      minimum: 1,
      maximum: 100,
    }),
  ),
  cooldownMinutes: Type.Optional(
    Type.Integer({
      description: "冷却时间(分钟)",
      minimum: 0,
      maximum: 1440,
    }),
  ),
  notifyOnRecovery: Type.Optional(
    Type.Boolean({
      description: "恢复时是否通知",
    }),
  ),
  channelId: Type.Optional(Type.String({ description: "通知渠道 ID" })),
});

export type SchemaRuleUpdateType = Static<typeof SchemaRuleUpdate>;

export const SchemaRuleDelete = Type.Object({
  id: Type.String({ description: "规则 ID" }),
});

export type SchemaRuleDeleteType = Static<typeof SchemaRuleDelete>;

export const SchemaRuleDetail = Type.Object({
  id: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  name: Type.String(),
  enabled: Type.Boolean(),
  scopeType: SchemaNotificationScopeType,
  hostId: Type.Union([Type.String(), Type.Null()]),
  endpointId: Type.Union([Type.String(), Type.Null()]),
  consecutiveFailures: Type.Integer(),
  cooldownMinutes: Type.Integer(),
  notifyOnRecovery: Type.Boolean(),
  channelId: Type.String(),
  channel: Type.Optional(SchemaChannelDetail),
  host: Type.Optional(
    Type.Union([
      Type.Object({
        id: Type.String(),
        name: Type.String(),
      }),
      Type.Null(),
    ]),
  ),
  endpoint: Type.Optional(
    Type.Union([
      Type.Object({
        id: Type.String(),
        name: Type.String(),
      }),
      Type.Null(),
    ]),
  ),
});

export type SchemaRuleDetailType = Static<typeof SchemaRuleDetail>;

// ==================== Log Schemas ====================

export const SchemaLogList = Type.Object({
  ruleId: Type.Optional(Type.String({ description: "规则 ID" })),
  endpointId: Type.Optional(Type.String({ description: "端点 ID" })),
  limit: Type.Optional(
    Type.Integer({
      description: "返回数量限制",
      minimum: 1,
      maximum: 1000,
      default: 100,
    }),
  ),
});

export type SchemaLogListType = Static<typeof SchemaLogList>;

export const SchemaLogDetail = Type.Object({
  id: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  ruleId: Type.String(),
  endpointId: Type.String(),
  eventType: Type.String(),
  title: Type.String(),
  content: Type.String(),
  success: Type.Boolean(),
  errorMsg: Type.Union([Type.String(), Type.Null()]),
});

export type SchemaLogDetailType = Static<typeof SchemaLogDetail>;

// ==================== VO Conversion Functions ====================

export const createChannelDetailVo = (
  data: NotificationChannel,
): SchemaChannelDetailType => {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    name: data.name,
    webhookUrl: data.webhookUrl,
    headers: data.headers,
    bodyTemplate: data.bodyTemplate,
    enabled: data.enabled,
  };
};

export const createRuleDetailVo = (
  data: NotificationRule & {
    channel?: NotificationChannel | null;
    host?: { id: string; name: string } | null;
    endpoint?: { id: string; name: string } | null;
  },
): SchemaRuleDetailType => {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    name: data.name,
    enabled: data.enabled,
    scopeType: data.scopeType,
    hostId: data.hostId,
    endpointId: data.endpointId,
    consecutiveFailures: data.consecutiveFailures,
    cooldownMinutes: data.cooldownMinutes,
    notifyOnRecovery: data.notifyOnRecovery,
    channelId: data.channelId,
    channel: data.channel ? createChannelDetailVo(data.channel) : undefined,
    host: data.host ? { id: data.host.id, name: data.host.name } : null,
    endpoint: data.endpoint
      ? { id: data.endpoint.id, name: data.endpoint.name }
      : null,
  };
};

export const createLogDetailVo = (
  data: NotificationLog,
): SchemaLogDetailType => {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    ruleId: data.ruleId,
    endpointId: data.endpointId,
    eventType: data.eventType,
    title: data.title,
    content: data.content,
    success: data.success,
    errorMsg: data.errorMsg,
  };
};
