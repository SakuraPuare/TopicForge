import { test, expect } from '@playwright/test';

test.describe('Generate Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/generate');
  });

  test('should display the generate page', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/生成|Generate|TopicForge/);

    // 检查页面有标签页
    const tabs = page.locator('[role="tablist"]');
    await expect(tabs).toBeVisible();
  });

  test('should display generation form', async ({ page }) => {
    // 检查表单元素存在
    const form = page.locator('form');
    await expect(form.first()).toBeVisible();
  });

  test('should have algorithm selector', async ({ page }) => {
    // 查找算法选择器
    const algorithmSelect = page.locator('select, [role="combobox"]').first();
    await expect(algorithmSelect).toBeVisible();
  });

  test('should have count selector', async ({ page }) => {
    // 查找数量选择器
    const countSelectors = page.locator('select, [role="combobox"]');
    const count = await countSelectors.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have generate button', async ({ page }) => {
    // 查找生成按钮
    const generateButton = page.getByRole('button', {
      name: /生成|Generate|提交/i,
    });
    await expect(generateButton).toBeVisible();
  });

  test('should show loading state when generating', async ({ page }) => {
    // 点击生成按钮
    const generateButton = page.getByRole('button', {
      name: /生成|Generate|提交/i,
    });

    // 点击前确保按钮可见
    await expect(generateButton).toBeVisible();

    // 点击按钮
    await generateButton.click();

    // 检查加载状态（按钮可能被禁用或显示加载中）
    // 这取决于实际的 UI 实现
    const isDisabled = await generateButton.isDisabled();
    const hasLoadingText = await page
      .getByText(/加载|Loading|生成中/i)
      .isVisible()
      .catch(() => false);

    expect(isDisabled || hasLoadingText).toBeTruthy();
  });

  test('should switch between tabs', async ({ page }) => {
    // 查找标签页
    const historyTab = page.getByRole('tab', { name: /历史|History/i });

    if (await historyTab.isVisible()) {
      await historyTab.click();

      // 检查历史内容显示
      const tabPanel = page.locator('[role="tabpanel"]');
      await expect(tabPanel).toBeVisible();
    }
  });
});

test.describe('Generate Result Page', () => {
  // 这些测试需要有实际的生成数据
  // 在真实场景中，可能需要先通过 API 创建测试数据

  test('should display 404 for invalid session', async ({ page }) => {
    await page.goto('/generate/result/invalid-session-id');

    // 检查 404 页面或错误提示
    const notFound = page.getByText(/404|找不到|Not Found|不存在/i);
    const errorMessage = page.getByText(/错误|Error|失败/i);

    const hasNotFound = await notFound.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);

    expect(hasNotFound || hasError).toBeTruthy();
  });
});
