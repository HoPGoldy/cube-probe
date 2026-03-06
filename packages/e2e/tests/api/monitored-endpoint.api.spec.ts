import { test, expect } from "../../fixtures/api";

test.describe("监控端点 API", () => {
  let hostId: string;
  let createdEndpointId: string;

  test("前置：创建测试用服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/create", {
      name: "e2e-endpoint-test-host",
      enabled: false,
    });
    expect(resp.ok()).toBeTruthy();
    hostId = (await resp.json()).data.id;
  });

  test("创建监控端点（CONFIG 模式）", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/create", {
      hostId,
      name: "e2e-test-endpoint",
      type: "CONFIG",
      url: "/status",
      method: "GET",
      intervalTime: 60,
      enabled: false,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("e2e-test-endpoint");
    expect(body.data.hostId).toBe(hostId);
    expect(body.data.url).toBe("/status");
    expect(body.data.enabled).toBe(false);
    createdEndpointId = body.data.id;
  });

  test("获取监控端点详情", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/get", {
      id: createdEndpointId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdEndpointId);
    expect(body.data.name).toBe("e2e-test-endpoint");
  });

  test("按服务 ID 获取端点列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/list", {
      hostId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const found = body.data.find(
      (e: { id: string }) => e.id === createdEndpointId,
    );
    expect(found).toBeDefined();
  });

  test("更新监控端点", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/update", {
      id: createdEndpointId,
      name: "e2e-test-endpoint-updated",
      timeout: 30,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("e2e-test-endpoint-updated");
    expect(body.data.timeout).toBe(30);
  });

  test("复制监控端点", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/copy", {
      id: createdEndpointId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).not.toBe(createdEndpointId);
    expect(body.data.hostId).toBe(hostId);

    // 清理
    await authedRequest.post("/api/endpoint/delete", { id: body.data.id });
  });

  test("删除监控端点", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/delete", {
      id: createdEndpointId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("删除后获取端点应失败", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/endpoint/get", {
      id: createdEndpointId,
    });
    expect(resp.ok()).toBeFalsy();
  });

  test("清理：删除测试用服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/delete", {
      id: hostId,
    });
    expect(resp.ok()).toBeTruthy();
  });
});
