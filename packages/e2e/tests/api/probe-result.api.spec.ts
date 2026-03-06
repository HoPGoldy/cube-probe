import { test, expect } from "../../fixtures/api";

test.describe("探测结果 API", () => {
  let hostId: string;
  let endpointId: string;
  let createdResultId: number;

  test("前置：创建测试用服务和端点", async ({ authedRequest }) => {
    const hostResp = await authedRequest.post("/api/monitored-host/create", {
      name: "e2e-result-test-host",
      enabled: false,
    });
    expect(hostResp.ok()).toBeTruthy();
    hostId = (await hostResp.json()).data.id;

    const epResp = await authedRequest.post("/api/endpoint/create", {
      hostId,
      name: "e2e-result-test-endpoint",
      enabled: false,
    });
    expect(epResp.ok()).toBeTruthy();
    endpointId = (await epResp.json()).data.id;
  });

  test("创建探测结果", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-result/create", {
      endPointId: endpointId,
      status: 200,
      responseTime: 150,
      success: true,
      message: "e2e test result",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.endPointId).toBe(endpointId);
    expect(body.data.status).toBe(200);
    expect(body.data.responseTime).toBe(150);
    expect(body.data.success).toBe(true);
    createdResultId = body.data.id;
  });

  test("获取探测结果详情", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-result/get", {
      id: createdResultId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdResultId);
    expect(body.data.message).toBe("e2e test result");
  });

  test("按端点 ID 获取探测结果列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-result/list", {
      endPointId: endpointId,
      limit: 10,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const found = body.data.find(
      (r: { id: number }) => r.id === createdResultId,
    );
    expect(found).toBeDefined();
  });

  test("按服务 ID 获取探测结果列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-result/list", {
      hostId,
      limit: 10,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("获取最新探测结果", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-result/latest");
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("删除探测结果", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-result/delete", {
      id: createdResultId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test("清理：删除测试用服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/delete", {
      id: hostId,
    });
    expect(resp.ok()).toBeTruthy();
  });
});
