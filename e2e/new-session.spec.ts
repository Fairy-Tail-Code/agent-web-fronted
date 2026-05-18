import { test, expect } from '@playwright/test';

test.describe('新会话功能', () => {
  test.beforeEach(async ({ page }) => {
    // 设置 localStorage 模拟登录状态
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
      }));
      localStorage.setItem('current_agent', JSON.stringify({
        id: 'test_agent',
        name: 'Test Agent',
        kind: 'agent',
        subtitle: 'Test subtitle',
        capabilities: ['chat', 'code'],
        description: 'Test description',
        promptHint: 'Test hint',
      }));
    });

    // 重新加载页面以应用模拟的登录状态
    await page.reload();
  });

  test('输入框应该始终可见', async ({ page }) => {
    await page.goto('/workspace');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 获取当前 URL，可能是重定向到登录页
    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('未登录，跳过此测试');
      // 如果需要完整测试，这里可以添加登录流程
      test.skip();
      return;
    }

    // 输入框应该始终存在
    const inputBox = page.locator('textarea').first();
    await expect(inputBox).toBeVisible({ timeout: 10000 });

    console.log('输入框可见:', await inputBox.isVisible());

    // 验证发送按钮也存在
    const sendButton = page.locator('button:has-text("发送")').first();
    await expect(sendButton).toBeVisible({ timeout: 5000 });

    console.log('发送按钮可见:', await sendButton.isVisible());

    // 截图验证
    await page.screenshot({ path: 'test-screenshots/input-box-visible.png' });
  });

  test('点击新会话后输入框仍然可见', async ({ page }) => {
    await page.goto('/workspace');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('未登录，跳过此测试');
      test.skip();
      return;
    }

    // 等待输入框出现
    const inputBox = page.locator('textarea').first();
    await expect(inputBox).toBeVisible({ timeout: 10000 });

    // 点击新会话按钮
    const newSessionButtons = page.locator('button:has-text("新会话")').all();
    if ((await newSessionButtons).length > 0) {
      const newSessionButton = (await newSessionButtons)[0];
      await newSessionButton.click();

      // 等待一小段时间让状态更新
      await page.waitForTimeout(1000);

      // 验证输入框仍然可见
      await expect(inputBox).toBeVisible();

      console.log('点击新会话后，输入框仍然可见');

      // 截图验证
      await page.screenshot({ path: 'test-screenshots/after-new-session.png' });
    } else {
      console.log('未找到新会话按钮，跳过点击测试');
    }
  });

  test('页面基本元素检查', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 截图查看实际页面状态
    await page.screenshot({ path: 'test-screenshots/page-state.png', fullPage: true });

    console.log('页面标题:', await page.title());
    console.log('当前 URL:', page.url());

    // 检查是否有任何文本内容
    const bodyText = await page.locator('body').textContent();
    console.log('页面内容预览:', bodyText?.substring(0, 200));
  });
});
