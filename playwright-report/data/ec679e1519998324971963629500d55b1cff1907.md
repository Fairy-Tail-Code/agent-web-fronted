# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace-visual.spec.ts >> 工作区视觉测试 >> 色彩和字体验证
- Location: e2e\workspace-visual.spec.ts:47:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="primary"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e9]:
        - img "safety-certificate" [ref=e10]:
          - img [ref=e11]
        - generic [ref=e13]: 安全登录
      - heading "通过魔法链接 进入您的工作空间" [level=1] [ref=e14]:
        - text: 通过魔法链接
        - text: 进入您的工作空间
      - generic [ref=e15]: 输入邮箱后，系统将发送一封安全的登录邮件。点击邮件中的魔法链接即可完成身份验证——无需密码，即刻访问。
      - generic [ref=e16]:
        - generic [ref=e18]:
          - img "lock" [ref=e20]:
            - img [ref=e21]
          - generic [ref=e23]: 零密码登录
          - generic [ref=e24]: 通过邮箱魔法链接验证身份，告别传统密码管理的烦恼。
        - generic [ref=e26]:
          - img "thunderbolt" [ref=e28]:
            - img [ref=e29]
          - generic [ref=e31]: 自动续期
          - generic [ref=e32]: 会话安全保持，页面刷新后无需重复登录，无缝继续工作。
        - generic [ref=e34]:
          - img "mail" [ref=e36]:
            - img [ref=e37]
          - generic [ref=e39]: 即时可用
          - generic [ref=e40]: 登录后直接访问对话与知识库，所有功能开箱即用。
    - generic [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]: 登录工作台
        - generic [ref=e44]: "当前 Agent: Agent Workbench"
      - generic [ref=e45]:
        - generic [ref=e47]:
          - generic [ref=e48]: 邮箱地址
          - generic [ref=e49]:
            - img "mail" [ref=e51]:
              - img [ref=e52]
            - textbox "your@email.com" [ref=e54]
        - button "link 发送登录链接" [disabled] [ref=e56]:
          - generic:
            - img "link":
              - img
          - generic: 发送登录链接
        - generic [ref=e58]: 首次使用同样通过登录链接进入，系统会自动创建您的账户。
  - button "Web Inspector" [ref=e60]:
    - note [ref=e61]:
      - generic [ref=e62]: "🪁 Big update: Series A, Threads and CopilotKit Enterprise Intelligence"
    - img "Inspector logo" [ref=e64]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('工作区视觉测试', () => {
  4  |   test('登录页面设计验证', async ({ page }) => {
  5  |     await page.goto('/login');
  6  | 
  7  |     // 验证页面标题
  8  |     await expect(page.locator('text=登录工作台')).toBeVisible();
  9  | 
  10 |     // 验证邮箱输入框存在
  11 |     const emailInput = page.locator('input[placeholder*="email"], input[placeholder*="邮箱"]');
  12 |     await expect(emailInput).toBeVisible();
  13 | 
  14 |     // 验证发送按钮存在
  15 |     const sendButton = page.locator('button:has-text("发送登录链接")');
  16 |     await expect(sendButton).toBeVisible();
  17 | 
  18 |     // 验证三个功能卡片存在
  19 |     await expect(page.locator('text=零密码登录')).toBeVisible();
  20 |     await expect(page.locator('text=自动续期')).toBeVisible();
  21 |     await expect(page.locator('text=即时可用')).toBeVisible();
  22 | 
  23 |     // 截图
  24 |     await page.screenshot({ path: 'test-screenshots/login-page.png', fullPage: true });
  25 |   });
  26 | 
  27 |   test('登录页面响应式设计', async ({ page }) => {
  28 |     await page.goto('/login');
  29 | 
  30 |     // 桌面视图
  31 |     await page.setViewportSize({ width: 1200, height: 800 });
  32 |     await page.screenshot({ path: 'test-screenshots/login-desktop.png' });
  33 | 
  34 |     // 平板视图
  35 |     await page.setViewportSize({ width: 768, height: 1024 });
  36 |     await page.screenshot({ path: 'test-screenshots/login-tablet.png' });
  37 | 
  38 |     // 移动视图
  39 |     await page.setViewportSize({ width: 375, height: 667 });
  40 |     await page.screenshot({ path: 'test-screenshots/login-mobile.png' });
  41 | 
  42 |     // 验证移动端菜单按钮存在
  43 |     const menuButton = page.locator('button:has-text("面板")');
  44 |     await expect(menuButton).toBeVisible();
  45 |   });
  46 | 
  47 |   test('色彩和字体验证', async ({ page }) => {
  48 |     await page.goto('/login');
  49 | 
  50 |     // 验证主色调按钮存在
  51 |     const primaryButton = page.locator('button[type="primary"]');
> 52 |     const buttonBg = await primaryButton.evaluate(el => {
     |                                          ^ Error: locator.evaluate: Test timeout of 30000ms exceeded.
  53 |       return window.getComputedStyle(el).backgroundColor;
  54 |     });
  55 |     console.log('主按钮背景色:', buttonBg);
  56 | 
  57 |     // 验证输入框样式
  58 |     const input = page.locator('input').first();
  59 |     const inputRadius = await input.evaluate(el => {
  60 |       return window.getComputedStyle(el).borderRadius;
  61 |     });
  62 |     console.log('输入框圆角:', inputRadius);
  63 | 
  64 |     // 验证卡片圆角
  65 |     const card = page.locator('.ant-card').first();
  66 |     const cardRadius = await card.evaluate(el => {
  67 |       return window.getComputedStyle(el).borderRadius;
  68 |     });
  69 |     console.log('卡片圆角:', cardRadius);
  70 |   });
  71 | });
  72 | 
```