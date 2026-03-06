import { test, expect } from "../../fixtures/api";

test.describe("通知渠道 API", () => {
  let createdChannelId: string;

  test("创建通知渠道", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/channel/create", {
      name: "e2e-test-channel",
      webhookUrl: "https://httpbin.org/post",
      bodyTemplate: '{"text": "{{title}}: {{content}}"}',
      enabled: false,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("e2e-test-channel");
    expect(body.data.webhookUrl).toBe("https://httpbin.org/post");
    expect(body.data.enabled).toBe(false);
    createdChannelId = body.data.id;
  });

  test("获取通知渠道详情", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/channel/get", {
      id: createdChannelId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdChannelId);
  });

  test("获取通知渠道列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/channel/list");
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const found = body.data.find(
      (c: { id: string }) => c.id === createdChannelId,
    );
    expect(found).toBeDefined();
  });

  test("更新通知渠道", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/channel/update", {
      id: createdChannelId,
      name: "e2e-test-channel-updated",
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("e2e-test-channel-updated");
  });

  test("获取通知模板列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post(
      "/api/notification/channel/templates",
    );
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test("删除通知渠道", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/channel/delete", {
      id: createdChannelId,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
  });
});

test.describe("通知日志 API", () => {
  test("查询通知日志列表", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/log/list", {
      limit: 10,
    });
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

test.describe("通知状态 API", () => {
  test("查询所有服务通知状态", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/notification/status/list");
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
