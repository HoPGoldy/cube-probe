import { test, expect } from "../../fixtures/api";

test.describe("探针环境变量 API", () => {
  let createdEnvId: string;

  test("创建环境变量", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-env/add", {
      key: "E2E_TEST_VAR",
      value: "test-value-123",
      isSecret: false,
      desc: "e2e test variable",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("获取环境变量列表", async ({ authedRequest }) => {
    const resp = await authedRequest.get("/api/probe-env/list");
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.list).toBeDefined();
    expect(Array.isArray(body.data.list)).toBe(true);

    const found = body.data.list.find(
      (e: { key: string }) => e.key === "E2E_TEST_VAR",
    );
    expect(found).toBeDefined();
    expect(found.value).toBe("test-value-123");
    createdEnvId = found.id;
  });

  test("更新环境变量", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-env/update", {
      id: createdEnvId,
      value: "updated-value-456",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("更新后值已变更", async ({ authedRequest }) => {
    const resp = await authedRequest.get("/api/probe-env/list");
    const body = await resp.json();

    const found = body.data.list.find(
      (e: { id: string }) => e.id === createdEnvId,
    );
    expect(found.value).toBe("updated-value-456");
  });

  test("创建 secret 环境变量时值应隐藏", async ({ authedRequest }) => {
    const createResp = await authedRequest.post("/api/probe-env/add", {
      key: "E2E_SECRET_VAR",
      value: "my-secret",
      isSecret: true,
    });
    expect(createResp.ok()).toBeTruthy();

    const listResp = await authedRequest.get("/api/probe-env/list");
    const body = await listResp.json();

    const found = body.data.list.find(
      (e: { key: string }) => e.key === "E2E_SECRET_VAR",
    );
    expect(found).toBeDefined();
    expect(found.value).toBe("******");

    // 清理
    await authedRequest.post("/api/probe-env/delete", { id: found.id });
  });

  test("删除环境变量", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-env/delete", {
      id: createdEnvId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("删除后列表中不再包含该变量", async ({ authedRequest }) => {
    const resp = await authedRequest.get("/api/probe-env/list");
    const body = await resp.json();

    const found = body.data.list.find(
      (e: { id: string }) => e.id === createdEnvId,
    );
    expect(found).toBeUndefined();
  });
});
