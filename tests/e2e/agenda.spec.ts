import { test, expect } from '@playwright/test';

test.describe('Agenda management', () => {
  let meetingId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Create a meeting for agenda tests
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    const code = `AG${rand}`.slice(0, 20);
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill(`议程测试_${rand}`);
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/, { timeout: 8000 });
    // Wait for detail page to fully render
    await expect(page.getByRole('heading', { name: `议程测试_${rand}` })).toBeVisible({
      timeout: 5000,
    });
    meetingId = page.url().split('/meetings/')[1]!.split('/')[0]!;
  });

  test('shows empty agenda page', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/agenda`);
    await expect(page.getByRole('heading', { name: '议程管理' })).toBeVisible();
    await expect(page.getByText('暂无议程')).toBeVisible();
  });

  test('creates an agenda item', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/agenda`);
    await page.getByLabel('议程标题 *').fill('开幕式');
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T10:00');
    await page.getByRole('button', { name: '创建议程' }).click();
    // Toast appears, then router.refresh() repopulates timeline
    await expect(page.getByText('议程已创建').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('开幕式').first()).toBeVisible({ timeout: 5000 });
  });

  test('rejects end before start', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/agenda`);
    await page.getByLabel('议程标题 *').fill('时间错误');
    await page.getByLabel('开始时间 *').fill('2026-08-01T10:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T09:00');
    await page.getByRole('button', { name: '创建议程' }).click();
    // Should NOT show success toast
    await page.waitForTimeout(2000);
    await expect(page.getByText('议程已创建')).not.toBeVisible();
  });

  test('deletes an agenda item', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/agenda`);
    await page.getByLabel('议程标题 *').fill('待删除');
    await page.getByLabel('开始时间 *').fill('2026-08-01T11:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T12:00');
    await page.getByRole('button', { name: '创建议程' }).click();
    await expect(page.getByText('议程已创建').first()).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText('待删除')).toBeVisible({ timeout: 5000 });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: '删除' }).click();
    await expect(page.getByText('待删除')).not.toBeVisible({ timeout: 5000 });
  });
});
