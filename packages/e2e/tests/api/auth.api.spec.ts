import { test, expect } from "@playwright/test";
import { shaWithSalt } from "../../fixtures/api";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3500";
const PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? "admin";

test.describe("认证 API", () => {
  test("未认证请求受保护接口返回 401", async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/monitored-host/list`);
    expect(resp.status()).toBe(401);
  });

  test("错误密码登录返回失败", async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { password: shaWithSalt("wrong-password-123", "admin") },
    });
    expect(resp.ok()).toBeFalsy();
  });

  test("正确密码登录返回 JWT token", async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { password: shaWithSalt(PASSWORD, "admin") },
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.token).toBe("string");
    expect(body.data.token.length).toBeGreaterThan(0);
  });

  test("JWT token 可以访问受保护接口", async ({ request }) => {
    const loginResp = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { password: shaWithSalt(PASSWORD, "admin") },
    });
    const { data } = await loginResp.json();

    const resp = await request.post(`${BASE_URL}/api/monitored-host/list`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("续期接口返回新 token", async ({ request }) => {
    const loginResp = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { password: shaWithSalt(PASSWORD, "admin") },
    });
    const { data } = await loginResp.json();

    const resp = await request.post(`${BASE_URL}/api/auth/renew`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.token).toBe("string");
  });
});
