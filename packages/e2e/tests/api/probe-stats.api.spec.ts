import { test, expect } from "../../fixtures/api";

test.describe("探测统计 API", () => {
  let hostId: string;
  let endpointId: string;

  test("前置：创建测试用服务和端点", async ({ authedRequest }) => {
    const hostResp = await authedRequest.post("/api/monitored-host/create", {
      name: "e2e-stats-test-host",
      enabled: false,
    });
    expect(hostResp.ok()).toBeTruthy();
    hostId = (await hostResp.json()).data.id;

    const epResp = await authedRequest.post("/api/endpoint/create", {
      hostId,
      name: "e2e-stats-test-endpoint",
      enabled: false,
    });
    expect(epResp.ok()).toBeTruthy();
    endpointId = (await epResp.json()).data.id;
  });

  test("查询端点多维度统计", async ({ authedRequest }) => {
    const resp = await authedRequest.post(
      "/api/probe-stats/endpoint/multi-range",
      { endpointId },
    );
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.endpointId).toBe(endpointId);
    expect(body.data).toHaveProperty("current");
    expect(body.data).toHaveProperty("stats24h");
    expect(body.data).toHaveProperty("stats30d");
    expect(body.data).toHaveProperty("stats1y");
  });

  test("查询服务多维度统计", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/probe-stats/host/multi-range", {
      hostId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.hostId).toBe(hostId);
    expect(body.data).toHaveProperty("current");
    expect(body.data).toHaveProperty("stats24h");
    expect(body.data).toHaveProperty("stats30d");
    expect(body.data).toHaveProperty("stats1y");
  });

  test("清理：删除测试用服务", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/monitored-host/delete", {
      id: hostId,
    });
    expect(resp.ok()).toBeTruthy();
  });
});
