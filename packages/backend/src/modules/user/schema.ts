import { User } from "@prisma/client";
import { Type } from "typebox";

export const SchemaUserDetail = Type.Object({
  id: Type.String(),
  username: Type.String(),
  email: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  role: Type.String(),
  isBanned: Type.Boolean(),
});

type SchemaUserDetailType = Type.Static<typeof SchemaUserDetail>;

export const SchemaUserCreate = Type.Object({
  username: Type.String({
    description: "用户名",
    minLength: 3,
    maxLength: 20,
  }),
  email: Type.Optional(Type.String({ description: "邮箱" })),
  phone: Type.Optional(Type.String({ description: "手机号" })),
  role: Type.Union([Type.Literal("USER"), Type.Literal("ADMIN")], {
    description: "用户角色",
  }),
  passwordHash: Type.String({ description: "密码哈希" }),
});

export type SchemaUserCreateType = Type.Static<typeof SchemaUserCreate>;

export const SchemaUserUpdate = Type.Intersect([
  Type.Partial(SchemaUserCreate),
  Type.Object({
    id: Type.String({ description: "用户ID" }),
    isBanned: Type.Optional(Type.Boolean({ description: "是否封禁" })),
  }),
]);

export type SchemaUserUpdateType = Type.Static<typeof SchemaUserUpdate>;

export const SchemaChangePassword = Type.Object({
  oldP: Type.String({
    minLength: 8,
    maxLength: 512,
  }),
  newP: Type.String({
    minLength: 8,
    maxLength: 512,
  }),
});

export type SchemaChangePasswordType = Type.Static<typeof SchemaChangePassword>;

export const createUserDetailVo = (data: User): SchemaUserDetailType => {
  const { passwordHash, isDeleted, ...rest } = data;

  return {
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
  };
};
