import { test, expect } from "../fixtures/auth";

test.describe("首页", () => {
  test("首页可以正常访问", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/home/);
  });

  test("首页渲染监控服务列表区域", async ({ page }) => {
    await page.goto("/home");
    // 页面内应包含 Cube Probe 相关内容
    await expect(page.locator("body")).toContainText(/监控|服务|Probe/i, {
      timeout: 8000,
    });
  });
});
