import { test, expect } from "../../fixtures/api";

test.describe("监控服务 API", () => {
  let createdHostId: string;

  test("创建监控服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/create", {
      name: "e2e-test-service",
      url: "https://httpbin.org",
      enabled: false,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("e2e-test-service");
    expect(body.data.url).toBe("https://httpbin.org");
    expect(body.data.enabled).toBe(false);
    expect(body.data.id).toBeTruthy();
    createdHostId = body.data.id;
  });

  test("获取监控服务详情", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/get", {
      id: createdHostId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdHostId);
    expect(body.data.name).toBe("e2e-test-service");
  });

  test("获取监控服务列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/list");
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const found = body.data.find((h: { id: string }) => h.id === createdHostId);
    expect(found).toBeDefined();
  });

  test("更新监控服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/update", {
      id: createdHostId,
      name: "e2e-test-service-updated",
      url: "https://httpbin.org/get",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("e2e-test-service-updated");
    expect(body.data.url).toBe("https://httpbin.org/get");
  });

  test("复制监控服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/copy", {
      id: createdHostId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).not.toBe(createdHostId);

    // 清理复制出来的服务
    await authedRequest.post("/api/monitored-host/delete", {
      id: body.data.id,
    });
  });

  test("删除监控服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/delete", {
      id: createdHostId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("删除后获取服务应失败", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/get", {
      id: createdHostId,
    });
    // 不存在的资源应返回错误
    expect(resp.ok()).toBeFalsy();
  });
});
