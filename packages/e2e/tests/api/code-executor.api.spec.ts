import { test, expect } from "../../fixtures/api";

test.describe("代码执行 API", () => {
  test("执行简单代码", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/code-executor/execute", {
      code: 'const result = { success: true, message: "hello from e2e" }; result;',
      timeout: 5000,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.success).toBe(true);
    expect(typeof body.data.executionTime).toBe("number");
    expect(Array.isArray(body.data.logs)).toBe(true);
  });

  test("执行超时代码返回错误", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/code-executor/execute", {
      code: "while(true) {}",
      timeout: 500,
    });
    // 超时可能返回 200 但 success=false，或返回错误状态码
    const body = await resp.json();
    if (resp.ok()) {
      expect(body.data.success).toBe(false);
    }
  });

  test("验证合法代码语法", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/code-executor/validate", {
      code: "const x = 1; return { result: { success: true } }",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(true);
  });

  test("验证非法代码语法返回错误", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/code-executor/validate", {
      code: "const x = {{{",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(false);
    expect(body.data.error).toBeTruthy();
  });
});
