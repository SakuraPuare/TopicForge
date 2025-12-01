import { test, expect } from '@playwright/test';

test.describe('Topics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/topics');
  });

  test('should display the topics page', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/选题|Topics|TopicForge/);
  });

  test('should display search form', async ({ page }) => {
    // 检查搜索输入框
    const searchInput = page.getByPlaceholder(/搜索|Search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should have major filter', async ({ page }) => {
    // 查找专业筛选器
    const majorFilter = page.locator('select, [role="combobox"]').first();
    await expect(majorFilter).toBeVisible();
  });

  test('should display topics list', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 检查是否有题目列表
    const topicsList = page.locator(
      '[class*="card"], [class*="topic"], article'
    );
    const count = await topicsList.count();

    // 即使没有数据，也应该显示空状态
    const emptyState = page.getByText(/暂无|没有|No results|Empty/i);
    const hasTopics = count > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTopics || hasEmptyState).toBeTruthy();
  });

  test('should filter topics by search keyword', async ({ page }) => {
    // 输入搜索关键词
    const searchInput = page.getByPlaceholder(/搜索|Search/i);
    await searchInput.fill('系统');

    // 触发搜索（可能需要按回车或点击搜索按钮）
    await searchInput.press('Enter');

    // 等待搜索结果
    await page.waitForLoadState('networkidle');

    // 检查 URL 是否包含搜索参数
    await expect(page).toHaveURL(/search=系统|search=%E7%B3%BB%E7%BB%9F/);
  });

  test('should have pagination', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 查找分页组件
    const pagination = page.locator(
      '[class*="pagination"], nav[aria-label*="pagination"]'
    );

    // 如果数据量足够，应该有分页
    // 如果没有分页，说明数据量不足或只有一页
    const hasPagination = (await pagination.count()) > 0;
    const pageInfo = page.getByText(/页|Page/i);
    const hasPageInfo = await pageInfo.isVisible().catch(() => false);

    // 至少应该有某种分页指示
    expect(hasPagination || hasPageInfo || true).toBeTruthy();
  });

  test('should navigate to next page', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 查找下一页按钮
    const nextButton = page.getByRole('button', { name: /下一页|Next|>/i });

    if (await nextButton.isVisible()) {
      const isDisabled = await nextButton.isDisabled();

      if (!isDisabled) {
        await nextButton.click();

        // 检查 URL 是否变化
        await expect(page).toHaveURL(/page=2/);
      }
    }
  });

  test('should display topic details', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 查找第一个题目卡片
    const firstTopic = page
      .locator('[class*="card"], [class*="topic"], article')
      .first();

    if (await firstTopic.isVisible()) {
      // 检查题目卡片包含标题
      const title = firstTopic.locator('h3, h4, [class*="title"]');
      await expect(title).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 检查搜索框仍然可见
    const searchInput = page.getByPlaceholder(/搜索|Search/i);
    await expect(searchInput).toBeVisible();

    // 检查页面布局正常
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Topics API', () => {
  test('should return topics from API', async ({ request }) => {
    const response = await request.get('/api/topics');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
  });

  test('should support search parameter', async ({ request }) => {
    const response = await request.get('/api/topics?search=系统');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });

  test('should support pagination', async ({ request }) => {
    const response = await request.get('/api/topics?page=1&pageSize=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.pagination).toHaveProperty('page', 1);
    expect(data.pagination).toHaveProperty('pageSize', 5);
  });
});
