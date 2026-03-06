import { test, expect } from "../fixtures/auth";

test.describe("通知渠道", () => {
  test("通知渠道页面可以正常访问", async ({ page }) => {
    await page.goto("/notification-channel");
    await expect(page).toHaveURL(/\/notification-channel/);
  });

  test("通知渠道页面渲染完成", async ({ page }) => {
    await page.goto("/notification-channel");
    // 页面内应包含通知渠道相关文字
    await expect(page.locator("body")).toContainText(/通知|渠道|channel/i, {
      timeout: 8000,
    });
  });
});
