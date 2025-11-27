import type { Prisma } from "@db/client";
import { Type } from "typebox";

export const SchemaApplicationDetail = Type.Object({
  id: Type.String(),
  name: Type.String(),
  tokenKey: Type.Optional(Type.String()),
  subTitle: Type.Optional(Type.String()),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

type SchemaApplicationDetailType = Type.Static<typeof SchemaApplicationDetail>;

const SchemaApplicationEditable = Type.Object({
  name: Type.String({
    description: "应用名称",
    minLength: 1,
    maxLength: 64,
  }),
  subTitle: Type.Union([
    Type.String({
      description: "应用副标题",
      minLength: 0,
      maxLength: 256,
    }),
    Type.Null(),
  ]),
  tokenKey: Type.Union([
    Type.String({
      description: "Token字段名",
      minLength: 8,
      maxLength: 256,
    }),
    Type.Null(),
  ]),
});

export const SchemaApplicationCreate = SchemaApplicationEditable;

export type SchemaApplicationCreateType = Type.Static<
  typeof SchemaApplicationCreate
>;

export const SchemaApplicationUpdate = Type.Intersect([
  Type.Object({
    id: Type.String({ description: "应用 ID" }),
  }),
  Type.Partial(SchemaApplicationEditable),
]);

export type SchemaApplicationUpdateType = Type.Static<
  typeof SchemaApplicationUpdate
>;

type ApplicationModel = Prisma.ApplicationGetPayload<Record<string, never>>;

export const createApplicationDetailVo = (
  data: ApplicationModel,
): SchemaApplicationDetailType => {
  return {
    id: data.id,
    name: data.name ?? "",
    subTitle: data.subTitle ?? undefined,
    tokenKey: data.tokenKey ?? undefined,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
};
