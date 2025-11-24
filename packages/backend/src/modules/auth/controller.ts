import type { UserService } from "@/modules/user/service";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { signJwtToken } from "./utils";
import { AppInstance } from "@/types";
import { ErrorUnauthorized } from "@/types/error";
import { ErrorAuthFailed, ErrorBanned } from "./error";

declare module "fastify" {
  interface FastifyContextConfig {
    /**
     * 是否禁用用户登录访问（允许公开访问呢）
     * @default false
     */
    disableAuth?: boolean;
    /**
     * 是否为管理员权限才能访问
     * @default false
     */
    requireAdmin?: boolean;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; username: string; role: string };
    user: { id: string; username: string; role: string };
  }
}

interface RegisterOptions {
  server: AppInstance;
  userService: UserService;
}

export const registerController = (options: RegisterOptions) => {
  const { server, userService } = options;

  // 根据配置给路由添加 swagger 安全定义
  server.addHook("onRoute", (routeOptions) => {
    const { disableAuth } = routeOptions.config || {};

    if (!disableAuth && routeOptions.schema) {
      routeOptions.schema.security = routeOptions.schema.security || [];
      (routeOptions.schema.security as any[]).push({ bearerAuth: [] });
    }
  });

  server.addHook("preHandler", async (request) => {
    const { disableAuth, requireAdmin } = request.routeOptions.config;
    if (!disableAuth) {
      try {
        await request.jwtVerify();
      } catch (err) {
        console.error(err);
        throw new ErrorUnauthorized();
      }

      if (requireAdmin && request.user.role !== UserRole.ADMIN) {
        throw new ErrorBanned();
      }
    }
  });

  server.post(
    "/auth/login",
    {
      config: {
        disableAuth: true,
      },
      schema: {
        description: "用户登录",
        tags: ["auth"],
        body: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: {
              type: "string",
            },
            password: {
              type: "string",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              token: { type: "string", description: "JWT 令牌" },
            },
          },
        },
      },
    },
    async (request) => {
      const { username, password } = request.body as {
        username: string;
        password: string;
      };

      // 查找用户
      const user = await userService.findByUsername(username);
      if (!user || user.isDeleted) {
        throw new ErrorAuthFailed();
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new ErrorAuthFailed();
      }

      // 检查用户是否被封禁
      if (user.isBanned) {
        throw new ErrorBanned();
      }

      // 生成 JWT 令牌
      const token = signJwtToken(server, user);

      return {
        token,
      };
    },
  );

  server.post(
    "/auth/renew",
    {
      schema: {
        description: "续期 JWT 令牌",
        tags: ["auth"],
        response: {
          200: {
            type: "object",
            properties: {
              token: { type: "string", description: "新的 JWT 令牌" },
            },
          },
          401: {
            type: "object",
            properties: {
              error: { type: "string", description: "错误信息" },
            },
          },
        },
      },
    },
    async (request) => {
      // 已经在 preHandler 中验证了 JWT，这里直接生成新的令牌
      const user = request.user;
      const newToken = signJwtToken(server, user);

      return {
        token: newToken,
      };
    },
  );
};
