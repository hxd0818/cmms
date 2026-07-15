import { test, expect } from '@playwright/test';

test.describe('Meeting management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('shows meeting list page', async ({ page }) => {
    await page.goto('/meetings');
    await expect(page.getByRole('heading', { name: '会议管理' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('creates a new meeting', async ({ page }) => {
    const code = `E2E${Date.now().toString().slice(-6)}`;
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill(`E2E会议_${Date.now()}`);
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-03T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/);
  });

  test('rejects end before start', async ({ page }) => {
    const code = `BAD${Date.now().toString().slice(-6)}`;
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill('时间错误');
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-08-03T18:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T09:00');
    await page.getByRole('button', { name: '创建' }).click();
    // Should stay on new page (validation error)
    await expect(page).toHaveURL(/\/meetings\/new/);
  });

  test('edit meeting name', async ({ page }) => {
    // First create
    const code = `EDIT${Date.now().toString().slice(-6)}`;
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill('编辑前');
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-03T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/);

    // Edit
    await page.getByRole('link', { name: '编辑' }).click();
    await expect(page).toHaveURL(/\/edit/);
    await page.getByLabel('会议名称 *').fill('编辑后');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('编辑后')).toBeVisible();
  });

  test('transitions DRAFT -> PLANNING via status button', async ({ page }) => {
    const code = `ST${Date.now().toString().slice(-6)}`;
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill('状态测试');
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-03T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/);

    // Should show status badge "草稿"
    await expect(page.getByText('草稿')).toBeVisible();

    // Select PLANNING and apply
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: '筹备中' }).click();
    await page.getByRole('button', { name: '应用' }).click();
    // Wait for toast then refresh
    await expect(page.locator('[data-sonner-toast]').or(page.getByText('已切换到')))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(page.getByText('筹备中')).toBeVisible({ timeout: 5000 });
  });

  test('shows meeting guests page (empty state)', async ({ page }) => {
    const code = `MG${Date.now().toString().slice(-6)}`;
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill('嘉宾页测试');
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-03T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/);

    await page.getByRole('link', { name: '嘉宾管理' }).click();
    await expect(page).toHaveURL(/\/guests$/);
    await expect(page.getByText('暂无嘉宾，点击右上角添加')).toBeVisible();
  });
});
