import type { WebAuthnService } from "./service";
import {
  RegisterVerificationRequestSchema,
  RegisterVerificationResponseSchema,
  LoginOptionsRequestSchema,
  LoginVerificationRequestSchema,
  LoginVerificationResponseSchema,
} from "./schema";
import { AppInstance } from "@/types";
import { signJwtToken } from "../auth/utils";
import Type from "typebox";
import { ErrorVerificationFailed } from "./error";
import { ErrorNeedLogin } from "@/modules/auth/error";

interface RegisterOptions {
  server: AppInstance;
  webAuthnService: WebAuthnService;
}

export const registerController = (options: RegisterOptions) => {
  const { server, webAuthnService } = options;

  // 是否启用 WebAuthn
  server.post(
    "/webauthn/enabled",
    {
      config: {
        disableAuth: true,
      },
      schema: {
        description: "检查 WebAuthn 是否已启用",
        tags: ["webauthn"],
      },
    },
    async () => {
      try {
        await webAuthnService.getWebAuthnConfig();
        return { enabled: true };
      } catch (error) {
        return { enabled: false };
      }
    },
  );

  // 获取注册选项
  server.post(
    "/webauthn/registration-options",
    {
      schema: {
        description: "获取 WebAuthn 注册选项",
        tags: ["webauthn"],
      },
    },
    async (request) => {
      const options = await webAuthnService.generateRegistrationOptions(
        request.user.id,
      );

      return options;
    },
  );

  // 验证注册响应
  server.post(
    "/webauthn/registration-verification",
    {
      schema: {
        description: "验证 WebAuthn 注册响应",
        tags: ["webauthn"],
        body: RegisterVerificationRequestSchema,
        response: {
          200: RegisterVerificationResponseSchema,
        },
      },
    },
    async (request) => {
      const { credential, credentialName } = request.body;

      const result = await webAuthnService.verifyRegistrationResponse(
        request.user.id,
        credentialName,
        credential,
      );

      if (!result.verified) {
        throw new ErrorVerificationFailed();
      }

      return {
        verified: true,
        user: {
          id: result.user.id,
          username: result.user.username,
        },
      };
    },
  );

  // 获取登录选项
  server.post(
    "/webauthn/login-options",
    {
      config: {
        disableAuth: true,
      },
      schema: {
        description: "获取 WebAuthn 登录选项",
        tags: ["webauthn"],
        body: LoginOptionsRequestSchema,
      },
    },
    async (request) => {
      const { username } = request.body;
      const options =
        await webAuthnService.generateAuthenticationOptions(username);

      return options;
    },
  );

  // 验证登录响应
  server.post(
    "/webauthn/login-verification",
    {
      config: {
        disableAuth: true,
      },
      schema: {
        description: "验证 WebAuthn 登录响应",
        tags: ["webauthn"],
        body: LoginVerificationRequestSchema,
        response: {
          200: LoginVerificationResponseSchema,
        },
      },
    },
    async (request) => {
      const { username, credential } = request.body;

      const result = await webAuthnService.verifyAuthenticationResponse(
        username,
        credential,
      );

      if (!result.verified) {
        throw new ErrorNeedLogin();
      }

      // 生成 JWT 令牌
      const token = signJwtToken(server, result.user);

      return {
        verified: true,
        token,
      };
    },
  );

  // 获取用户的凭证列表
  server.post(
    "/webauthn/credentials",
    {
      schema: {
        description: "获取当前用户的 WebAuthn 凭证列表",
        tags: ["webauthn"],
        response: {
          // 200: LoginVerificationResponseSchema,
        },
      },
    },
    async (request) => {
      const credentials = await webAuthnService.getUserCredentials(
        request.user.id,
      );

      return credentials;
    },
  );

  // 删除特定凭证
  server.post(
    "/webauthn/credentials/delete",
    {
      schema: {
        description: "删除用户的特定 WebAuthn 凭证",
        tags: ["webauthn"],
        body: Type.Object({
          credentialId: Type.String(),
        }),
      },
    },
    async (request) => {
      const userId = request.user.id;
      const { credentialId } = request.body;

      await webAuthnService.deleteUserCredential(credentialId, userId);
      return { message: "凭证删除成功" };
    },
  );
};
