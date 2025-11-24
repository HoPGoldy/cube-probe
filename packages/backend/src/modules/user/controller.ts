import { Type } from "typebox";
import type { UserService } from "./service";
import {
  createUserDetailVo,
  SchemaChangePassword,
  SchemaUserCreate,
  SchemaUserDetail,
  SchemaUserUpdate,
} from "./schema";
import type { AppInstance } from "@/types";
import {
  SchemaCommonListFilter,
  createCommonListSchema,
  createCommonListVo,
} from "@/types/schema";
import { ErrorWrongUser } from "./error";

interface RegisterOptions {
  server: AppInstance;
  userService: UserService;
}

export const registerController = (options: RegisterOptions) => {
  const { server, userService } = options;

  server.post(
    "/user/me",
    {
      schema: {
        description: "获取当前用户详情",
        tags: ["user"],
        response: {
          200: SchemaUserDetail,
        },
      },
    },
    async (request) => {
      const user = await userService.findById(request.user.id);
      if (!user) {
        throw new ErrorWrongUser();
      }

      return createUserDetailVo(user);
    },
  );

  server.post(
    "/user/detail",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "获取用户详情",
        tags: ["user"],
        body: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: SchemaUserDetail,
        },
      },
    },
    async (request) => {
      const { id } = request.body;
      const user = await userService.findById(id);
      if (!user) {
        throw new ErrorWrongUser();
      }

      return createUserDetailVo(user);
    },
  );

  server.post(
    "/user/list",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "获取用户列表",
        tags: ["user"],
        body: SchemaCommonListFilter,
        response: {
          200: createCommonListSchema(SchemaUserDetail),
        },
      },
    },
    async (request) => {
      const { items, total } = await userService.findAll(request.body);
      return createCommonListVo(items.map(createUserDetailVo), total);
    },
  );

  server.post(
    "/user/create",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "创建用户",
        tags: ["user"],
        body: SchemaUserCreate,
        response: {
          200: SchemaUserDetail,
        },
      },
    },
    async (request) => {
      const user = await userService.create(request.body);
      return createUserDetailVo(user);
    },
  );

  server.post(
    "/user/update",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "更新用户",
        tags: ["user"],
        body: SchemaUserUpdate,
        response: {
          200: SchemaUserDetail,
        },
      },
    },
    async (request) => {
      const user = await userService.update(request.body);
      return createUserDetailVo(user);
    },
  );

  server.post(
    "/user/delete",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "删除用户",
        tags: ["user"],
        body: Type.Object({
          id: Type.String(),
        }),
      },
    },
    async (request) => {
      const { id } = request.body;
      await userService.fakeDelete(id);
      return { success: true };
    },
  );

  server.post(
    "/user/ban",
    {
      config: {
        requireAdmin: true,
      },
      schema: {
        description: "封禁/解封用户",
        tags: ["user"],
        body: Type.Object({
          id: Type.String(),
          isBanned: Type.Boolean(),
        }),
      },
    },
    async (request) => {
      await userService.update(request.body);
      return { success: true };
    },
  );

  server.post(
    "/user/change-password",
    {
      schema: {
        description: "修改密码",
        tags: ["user"],
        body: SchemaChangePassword,
      },
    },
    async (request) => {
      await userService.changePassword(request.user.id, request.body);
      return { success: true };
    },
  );
};
