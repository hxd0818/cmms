import { test, expect } from '@playwright/test';

test.describe('Transport management', () => {
  let meetingId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill(`接送测试_${rand}`);
    await page.getByLabel('会议编号 *（仅大写字母、数字、连字符）').fill(`TP${rand}`.slice(0, 20));
    await page.getByLabel('开始时间 *').fill('2026-08-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-08-01T18:00');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/, { timeout: 8000 });
    meetingId = page.url().split('/meetings/')[1]!.split('/')[0]!;

    // Add a guest to meeting
    await page.goto(`/meetings/${meetingId}/guests`);
    await page.getByRole('button', { name: '添加嘉宾' }).click();
    await page.getByPlaceholder('按姓名 / 手机 / 单位搜索').fill('E2E');
    await page.getByRole('button', { name: '搜索' }).click();
    await page.getByRole('button', { name: '添加' }).first().click();
    await expect(page.getByText('已添加到会议').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows empty transport page', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/transport`);
    await expect(page.getByRole('heading', { name: /接送调度/ })).toBeVisible();
    await expect(page.getByText('暂无接送任务')).toBeVisible();
  });

  test('creates transport order', async ({ page }) => {
    await page.goto(`/meetings/${meetingId}/transport`);
    await page.getByRole('button', { name: '新增接送任务' }).click();
    // Click the guest Select trigger (combobox role from base-ui)
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel('上车地点 *').fill('机场 T3');
    await page.getByLabel('接送时间 *').fill('2026-08-01T10:00');
    await page.getByLabel('下车地点 *').fill('XX 酒店');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page.getByText('机场 T3').first()).toBeVisible({ timeout: 5000 });
  });

  test('create vehicle and assign to order', async ({ page }) => {
    // First create a vehicle
    const plate = `测${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await page.goto('/vehicles/new');
    await page.getByLabel('车牌号 *').fill(plate);
    await page.getByLabel('容量（座位数）*').fill('4');
    await page.getByLabel('司机姓名 *').fill('测试司机');
    await page.getByLabel('司机手机 *').fill('13812345678');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/vehicles/);

    // Create transport order
    await page.goto(`/meetings/${meetingId}/transport`);
    await page.getByRole('button', { name: '新增接送任务' }).click();
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel('上车地点 *').fill('机场 T3');
    await page.getByLabel('接送时间 *').fill('2026-08-01T10:00');
    await page.getByLabel('下车地点 *').fill('XX 酒店');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page.getByText('分配车辆').first()).toBeVisible({ timeout: 5000 });

    // Assign vehicle
    await page.getByRole('button', { name: '分配车辆' }).first().click();
    // Click the vehicle select in the dialog
    await page.getByRole('dialog').getByRole('combobox').click();
    await page.getByRole('option', { name: new RegExp(plate) }).click();
    await page.getByRole('button', { name: '确认分配' }).click();
    await expect(page.getByText('已分配车辆').first()).toBeVisible({ timeout: 5000 });
  });
});
