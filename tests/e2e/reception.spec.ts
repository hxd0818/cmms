import { test, expect } from '@playwright/test';

test.describe('Reception', () => {
  let meetingId: string;
  let meetingGuestId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Create meeting
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill(`签到测试_${rand}`);
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(`RC${rand}`.slice(0, 20));
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/, { timeout: 8000 });
    meetingId = page.url().split('/meetings/')[1]!.split('/')[0]!;

    // Add a guest to meeting (use first available guest from library)
    await page.goto(`/meetings/${meetingId}/guests`);
    await page.getByRole('button', { name: '添加嘉宾' }).click();
    await page.getByPlaceholder('按姓名 / 手机 / 单位搜索').fill('E2E');
    await page.getByRole('button', { name: '搜索' }).click();
    await page.getByRole('button', { name: '添加' }).first().click();
    await expect(page.getByText('已添加到会议').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows reception page with kanban columns', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/reception`);
    await expect(page.getByRole('heading', { name: /现场签到/ })).toBeVisible();
    // Kanban column headings include count in parens
    await expect(page.getByText(/^待签到 \(/)).toBeVisible();
    await expect(page.getByText(/^已签到 \(/)).toBeVisible();
    await expect(page.getByText(/^在场 \(/)).toBeVisible();
  });

  test('check-in moves guest from pending to checked-in', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/reception`);
    // Find the first pending guest and click 签到
    await page.getByRole('button', { name: '签到' }).first().click();
    await expect(page.getByText('已签到').first()).toBeVisible({ timeout: 5000 });
  });

  test('no-show moves guest to departed column', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/reception`);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '未到' }).first().click();
    await expect(page.getByText('已标记未到').first()).toBeVisible({ timeout: 5000 });
  });
});
