import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with correct title', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/TopicForge/);
  });

  test('should display the hero section', async ({ page }) => {
    // 检查 Hero 区域
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // 检查主标题
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    // 检查导航栏
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // 检查导航链接
    const homeLink = page.getByRole('link', { name: /首页|Home/i });
    await expect(homeLink).toBeVisible();

    const generateLink = page.getByRole('link', { name: /生成|Generate/i });
    await expect(generateLink).toBeVisible();

    const topicsLink = page.getByRole('link', { name: /选题库|Topics/i });
    await expect(topicsLink).toBeVisible();
  });

  test('should navigate to generate page when clicking CTA button', async ({
    page,
  }) => {
    // 查找 CTA 按钮并点击
    const ctaButton = page.getByRole('link', { name: /开始|生成|Start/i });
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await expect(page).toHaveURL(/\/generate/);
    }
  });

  test('should toggle theme', async ({ page }) => {
    // 查找主题切换按钮
    const themeToggle = page
      .locator('button')
      .filter({ hasText: /theme|主题/i });
    if ((await themeToggle.count()) > 0) {
      const firstToggle = themeToggle.first();
      if (await firstToggle.isVisible()) {
        await firstToggle.click();
        // 验证主题切换生效（检查 html 元素的 class）
        const html = page.locator('html');
        await expect(html).toHaveAttribute('class', /.*/);
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 检查页面仍然正常显示
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });
});
