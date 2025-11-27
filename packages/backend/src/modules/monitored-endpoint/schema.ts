import { EndPoint, ProbeResult, Service } from "@db/client";
import { Type } from "typebox";

// Service Schemas
export const SchemaServiceCreate = Type.Object({
  name: Type.String({
    description: "服务名称",
    minLength: 1,
    maxLength: 100,
  }),
  url: Type.Optional(Type.String({ description: "服务基础URL" })),
  headers: Type.Optional(Type.Any({ description: "自定义请求头JSON" })),
  intervalTime: Type.Optional(
    Type.Integer({ description: "默认探测间隔时间(秒)", minimum: 1 }),
  ),
  enabled: Type.Optional(Type.Boolean({ description: "是否启用" })),
});

export type SchemaServiceCreateType = Type.Static<typeof SchemaServiceCreate>;

export const SchemaServiceUpdate = Type.Intersect([
  Type.Partial(SchemaServiceCreate),
  Type.Object({
    id: Type.String({ description: "服务ID" }),
  }),
]);

export type SchemaServiceUpdateType = Type.Static<typeof SchemaServiceUpdate>;

export const SchemaServiceDetail = Type.Object({
  id: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  name: Type.String(),
  url: Type.Union([Type.String(), Type.Null()]),
  headers: Type.Union([Type.Any(), Type.Null()]),
  intervalTime: Type.Union([Type.Integer(), Type.Null()]),
  enabled: Type.Boolean(),
});

export type SchemaServiceDetailType = Type.Static<typeof SchemaServiceDetail>;

// EndPoint Schemas
export const SchemaEndPointCreate = Type.Object({
  serviceId: Type.String({ description: "关联服务ID" }),
  name: Type.String({
    description: "接口名称",
    minLength: 1,
    maxLength: 100,
  }),
  url: Type.Optional(Type.String({ description: "接口URL" })),
  method: Type.Optional(
    Type.String({
      description: "HTTP请求方法",
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    }),
  ),
  headers: Type.Optional(Type.Any({ description: "自定义请求头JSON" })),
  intervalTime: Type.Optional(
    Type.Integer({ description: "探测间隔时间(秒)", minimum: 1 }),
  ),
  enabled: Type.Optional(Type.Boolean({ description: "是否启用" })),
  timeout: Type.Optional(
    Type.Integer({
      description: "请求超时时间(毫秒)",
      minimum: 1,
      maximum: 300000,
    }), // Max 5 minutes
  ),
  bodyContentType: Type.Optional(
    Type.String({
      description: "请求体编码类型",
      enum: ["json", "x-www-form-urlencoded", "xml"],
    }),
  ),
  bodyContent: Type.Optional(Type.String({ description: "请求体内容" })),
});

export type SchemaEndPointCreateType = Type.Static<typeof SchemaEndPointCreate>;

export const SchemaEndPointUpdate = Type.Intersect([
  Type.Partial(SchemaEndPointCreate),
  Type.Object({
    id: Type.String({ description: "接口ID" }),
  }),
]);

export type SchemaEndPointUpdateType = Type.Static<typeof SchemaEndPointUpdate>;

export const SchemaEndPointDetail = Type.Object({
  id: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  serviceId: Type.String(),
  name: Type.String(),
  url: Type.Union([Type.String(), Type.Null()]),
  method: Type.Union([Type.String(), Type.Null()]),
  headers: Type.Union([Type.Any(), Type.Null()]),
  intervalTime: Type.Union([Type.Integer(), Type.Null()]),
  enabled: Type.Boolean(),
  timeout: Type.Union([Type.Integer(), Type.Null()]),
  bodyContentType: Type.Union([Type.String(), Type.Null()]),
  bodyContent: Type.Union([Type.String(), Type.Null()]),
});

export type SchemaEndPointDetailType = Type.Static<typeof SchemaEndPointDetail>;

// ProbeResult Schemas
export const SchemaProbeResultCreate = Type.Object({
  endPointId: Type.String({ description: "关联接口ID" }),
  status: Type.Optional(
    Type.Integer({ description: "HTTP状态码", minimum: 100, maximum: 599 }),
  ),
  responseTime: Type.Optional(
    Type.Integer({
      description: "响应时间(毫秒)",
      minimum: 0,
      maximum: 300000,
    }),
  ),
  timestamp: Type.String({ format: "date-time", description: "检查时间戳" }),
  success: Type.Boolean({ description: "是否成功" }),
  message: Type.Optional(Type.String({ description: "详细信息或错误消息" })),
});

export type SchemaProbeResultCreateType = Type.Static<
  typeof SchemaProbeResultCreate
>;

export const SchemaProbeResultDetail = Type.Object({
  id: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  endPointId: Type.String(),
  status: Type.Union([Type.Integer(), Type.Null()]),
  responseTime: Type.Union([Type.Integer(), Type.Null()]),
  timestamp: Type.String({ format: "date-time" }),
  success: Type.Boolean(),
  message: Type.Union([Type.String(), Type.Null()]),
});

export type SchemaProbeResultDetailType = Type.Static<
  typeof SchemaProbeResultDetail
>;

// Helper functions to create VO (Value Objects)
export const createServiceDetailVo = (
  data: Service,
): SchemaServiceDetailType => {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    name: data.name,
    url: data.url,
    headers: data.headers,
    intervalTime: data.intervalTime,
    enabled: data.enabled,
  };
};

export const createEndPointDetailVo = (
  data: EndPoint,
): SchemaEndPointDetailType => {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    serviceId: data.serviceId,
    name: data.name,
    url: data.url,
    method: data.method,
    headers: data.headers,
    intervalTime: data.intervalTime,
    enabled: data.enabled,
    timeout: data.timeout,
    bodyContentType: data.bodyContentType,
    bodyContent: data.bodyContent,
  };
};

export const createProbeResultDetailVo = (
  data: ProbeResult,
): SchemaProbeResultDetailType => {
  return {
    id: data.id,
    createdAt: data.createdAt.toISOString(),
    endPointId: data.endPointId,
    status: data.status,
    responseTime: data.responseTime,
    timestamp: data.timestamp.toISOString(),
    success: data.success,
    message: data.message,
  };
};
