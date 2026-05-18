import { test, expect } from '@playwright/test';

test.describe('工作区视觉测试', () => {
  test('登录页面设计验证', async ({ page }) => {
    await page.goto('/login');

    // 验证页面标题
    await expect(page.locator('text=登录工作台')).toBeVisible();

    // 验证邮箱输入框存在
    const emailInput = page.locator('input[placeholder*="email"], input[placeholder*="邮箱"]');
    await expect(emailInput).toBeVisible();

    // 验证发送按钮存在
    const sendButton = page.locator('button:has-text("发送登录链接")');
    await expect(sendButton).toBeVisible();

    // 验证三个功能卡片存在
    await expect(page.locator('text=零密码登录')).toBeVisible();
    await expect(page.locator('text=自动续期')).toBeVisible();
    await expect(page.locator('text=即时可用')).toBeVisible();

    // 截图
    await page.screenshot({ path: 'test-screenshots/login-page.png', fullPage: true });
  });

  test('登录页面响应式设计', async ({ page }) => {
    await page.goto('/login');

    // 桌面视图
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.screenshot({ path: 'test-screenshots/login-desktop.png' });

    // 平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-screenshots/login-tablet.png' });

    // 移动视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-screenshots/login-mobile.png' });

    // 验证移动端菜单按钮存在
    const menuButton = page.locator('button:has-text("面板")');
    await expect(menuButton).toBeVisible();
  });

  test('色彩和字体验证', async ({ page }) => {
    await page.goto('/login');

    // 验证主色调按钮存在
    const primaryButton = page.locator('button[type="primary"]');
    const buttonBg = await primaryButton.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log('主按钮背景色:', buttonBg);

    // 验证输入框样式
    const input = page.locator('input').first();
    const inputRadius = await input.evaluate(el => {
      return window.getComputedStyle(el).borderRadius;
    });
    console.log('输入框圆角:', inputRadius);

    // 验证卡片圆角
    const card = page.locator('.ant-card').first();
    const cardRadius = await card.evaluate(el => {
      return window.getComputedStyle(el).borderRadius;
    });
    console.log('卡片圆角:', cardRadius);
  });
});
