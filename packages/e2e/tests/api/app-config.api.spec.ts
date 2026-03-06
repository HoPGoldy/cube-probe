import { test, expect } from "../../fixtures/api";

test.describe("应用配置 API", () => {
  test("获取应用配置", async ({ authedRequest }) => {
    const resp = await authedRequest.post("/api/config");
    expect(resp.ok()).toBeTruthy();

    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(typeof body.data).toBe("object");
  });

  test("更新并恢复应用配置", async ({ authedRequest }) => {
    // 先获取当前配置
    const getResp = await authedRequest.post("/api/config");
    const original = (await getResp.json()).data;

    // 更新配置
    const updateResp = await authedRequest.post("/api/config/update", {
      ...original,
      WEB_AUTHN_RP_NAME: "e2e-test-rp",
    });
    expect(updateResp.ok()).toBeTruthy();
    const updateBody = await updateResp.json();
    expect(updateBody.success).toBe(true);

    // 验证更新生效
    const verifyResp = await authedRequest.post("/api/config");
    const verifyBody = await verifyResp.json();
    expect(verifyBody.data.WEB_AUTHN_RP_NAME).toBe("e2e-test-rp");

    // 恢复原始配置
    await authedRequest.post("/api/config/update", original);
  });
});
