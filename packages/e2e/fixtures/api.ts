import { test as base, expect, APIRequestContext } from "@playwright/test";
import crypto from "crypto";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3500";
const LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "admin";

/**
 * 与前后端保持一致的加盐 SHA-512
 */
export const shaWithSalt = (str: string, saltValue: string): string => {
  const salt = crypto.createHash("sha512").update(saltValue).digest("hex");
  const saltedMessage = salt + str;
  const hash = crypto.createHash("sha512").update(saltedMessage).digest("hex");
  return hash.toUpperCase();
};

let cachedToken: string | null = null;

/**
 * 登录并获取 JWT token（带缓存）
 */
async function getAuthToken(request: APIRequestContext): Promise<string> {
  if (cachedToken) return cachedToken;

  const resp = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { password: shaWithSalt(LOGIN_PASSWORD, "admin") },
  });

  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.success).toBe(true);
  cachedToken = body.data.token;
  return cachedToken!;
}

/**
 * 带认证的 API 测试 fixture
 * 提供 api（带 Authorization header 的 request context）和裸 request
 */
export const test = base.extend<{
  /** 已认证的请求辅助工具 */
  authedRequest: {
    get: (url: string) => ReturnType<APIRequestContext["get"]>;
    post: (url: string, data?: any) => ReturnType<APIRequestContext["post"]>;
    put: (url: string, data?: any) => ReturnType<APIRequestContext["put"]>;
    delete: (
      url: string,
      data?: any,
    ) => ReturnType<APIRequestContext["delete"]>;
  };
  /** 原始 JWT token */
  authToken: string;
}>({
  authToken: async ({ request }, use) => {
    const token = await getAuthToken(request);
    await use(token);
  },
  authedRequest: async ({ request, authToken }, use) => {
    const headers = { Authorization: `Bearer ${authToken}` };

    await use({
      get: (url: string) => request.get(`${BASE_URL}${url}`, { headers }),
      post: (url: string, data?: any) =>
        request.post(`${BASE_URL}${url}`, { data, headers }),
      put: (url: string, data?: any) =>
        request.put(`${BASE_URL}${url}`, { data, headers }),
      delete: (url: string, data?: any) =>
        request.delete(`${BASE_URL}${url}`, { data, headers }),
    });
  },
});

export { expect };
