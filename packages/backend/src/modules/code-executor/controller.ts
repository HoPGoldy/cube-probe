import type { AppInstance } from "@/types";
import type { CodeExecutorService } from "./service";
import { Type } from "typebox";
import { SchemaCodeExecuteRequest, SchemaCodeExecuteResponse } from "./schema";

interface RegisterOptions {
  server: AppInstance;
  codeExecutorService: CodeExecutorService;
}

export const registerController = (options: RegisterOptions) => {
  const { server, codeExecutorService } = options;

  /**
   * 执行代码
   */
  server.post(
    "/code-executor/execute",
    {
      config: {
        disableAuth: true, // 如需要认证，请改为 false
      },
      schema: {
        summary: "执行代码",
        description: "在安全沙箱环境中执行前端传入的 JavaScript 代码",
        tags: ["code-executor"],
        body: SchemaCodeExecuteRequest,
        response: {
          200: SchemaCodeExecuteResponse,
        },
      },
    },
    async (request) => {
      const result = await codeExecutorService.execute(request.body);
      return result;
    },
  );

  /**
   * 验证代码语法
   */
  server.post(
    "/code-executor/validate",
    {
      config: {
        disableAuth: true, // 如需要认证，请改为 false
      },
      schema: {
        summary: "验证代码语法",
        description: "验证 JavaScript 代码语法是否正确（不执行代码）",
        tags: ["code-executor"],
        body: Type.Object({
          code: Type.String({ description: "要验证的代码" }),
        }),
        response: {
          200: Type.Object({
            valid: Type.Boolean({ description: "代码是否有效" }),
            error: Type.Optional(Type.String({ description: "错误信息" })),
          }),
        },
      },
    },
    async (request) => {
      const result = await codeExecutorService.validate(request.body.code);
      return result;
    },
  );
};
