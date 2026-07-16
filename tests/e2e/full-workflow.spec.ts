import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@cmms.local';
const ADMIN_PASSWORD = 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('邮箱').fill(ADMIN_EMAIL);
  await page.getByLabel('密码').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
}

test.describe.serial('CMMS Full Workflow', () => {
  let meetingId: string;
  const suffix =
    Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5).toUpperCase();
  const code = 'WF' + suffix;
  const name = 'Workflow Test ' + suffix;

  test('1. Login', async ({ page }) => {
    console.log('\n[STEP 1] Admin login');
    await login(page);
    console.log('  OK - logged in, at dashboard');
  });

  test('2. Create meeting', async ({ page }) => {
    console.log('\n[STEP 2] Create meeting: ' + name);
    await login(page);
    await page.goto('/meetings/new');
    await page.getByLabel('会议名称 *').fill(name);
    await page.getByLabel('会议编号 *').fill(code);
    await page.getByLabel('开始时间 *').fill('2026-09-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-09-03T18:00');
    await page.getByLabel('场地').fill('Test Center');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/meetings\/cmr/, { timeout: 8000 });
    meetingId = page.url().split('/meetings/')[1]!.split('/')[0]!;
    console.log('  OK - meeting created, id=' + meetingId + ', status=DRAFT');
  });

  test('3. Transition to PLANNING', async ({ page }) => {
    console.log('\n[STEP 3] Meeting status: DRAFT -> PLANNING');
    await login(page);
    await page.goto('/meetings/' + meetingId);
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '筹备中' }).click();
    await page.getByRole('button', { name: '应用' }).click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('筹备中')).toBeVisible({ timeout: 5000 });
    console.log('  OK - status is now PLANNING');
  });

  test('4. Add guest to meeting', async ({ page }) => {
    console.log('\n[STEP 4] Add guest from library');
    await login(page);
    await page.goto('/meetings/' + meetingId + '/guests');
    await page.getByRole('button', { name: '添加嘉宾' }).click();
    await page.getByPlaceholder('按姓名 / 手机 / 单位搜索').fill('E2E');
    await page.getByRole('button', { name: '搜索' }).click();
    await page.waitForTimeout(1000);
    const adds = page.getByRole('button', { name: '添加' });
    const n = await adds.count();
    if (n > 0) {
      await adds.first().click();
      await expect(page.getByText('已添加到会议').first()).toBeVisible({ timeout: 5000 });
      console.log('  OK - guest added (' + n + ' available)');
    } else {
      console.log('  SKIP - no new guests to add');
    }
  });

  test('5. Create agenda item', async ({ page }) => {
    console.log('\n[STEP 5] Create agenda: Opening Ceremony');
    await login(page);
    await page.goto('/meetings/' + meetingId + '/agenda');
    await page.getByLabel('议程标题 *').fill('Opening Ceremony');
    await page.getByLabel('开始时间 *').fill('2026-09-01T09:00');
    await page.getByLabel('结束时间 *').fill('2026-09-01T10:30');
    await page.getByLabel('场地').fill('Main Hall');
    await page.getByRole('button', { name: '创建议程' }).click();
    await expect(page.getByText('Opening Ceremony').first()).toBeVisible({ timeout: 5000 });
    console.log('  OK - agenda created');
  });

  test('6. Create transport order', async ({ page }) => {
    console.log('\n[STEP 6] Create transport: Airport pickup');
    await login(page);
    await page.goto('/meetings/' + meetingId + '/transport');
    await page.getByRole('button', { name: '新增接送任务' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel('上车地点 *').fill('Airport T3');
    await page.getByLabel('接送时间 *').fill('2026-09-01T07:00');
    await page.getByLabel('下车地点 *').fill('Grand Hotel');
    await page.getByLabel('航班 / 车次').fill('CA1234');
    await page.getByRole('button', { name: '创建' }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Airport T3').first()).toBeVisible({ timeout: 5000 });
    console.log('  OK - transport order: Airport T3 -> Grand Hotel, flight CA1234');
  });

  test('7. Check-in at reception', async ({ page }) => {
    console.log('\n[STEP 7] Reception check-in');
    await login(page);
    await page.goto('/meetings/' + meetingId + '/reception');
    await expect(page.getByRole('heading', { name: /现场签到/ })).toBeVisible();
    const btns = page.getByRole('button', { name: '签到' });
    const n = await btns.count();
    if (n > 0) {
      await btns.first().click();
      await page.waitForTimeout(1500);
      console.log('  OK - guest checked in (' + (n - 1) + ' remaining)');
    } else {
      console.log('  SKIP - no pending guests');
    }
    await expect(page.getByText(/^待签到 \(/)).toBeVisible();
    await expect(page.getByText(/^已签到 \(/)).toBeVisible();
    console.log('  OK - kanban columns visible');
  });

  test('8. Health check', async ({ page }) => {
    console.log('\n[STEP 8] System health check');
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log('  OK - status=' + body.status + ', db=' + body.db);
  });

  test('9. Dashboard verification', async ({ page }) => {
    console.log('\n[STEP 9] Dashboard verification');
    await login(page);
    await page.goto('/dashboard');
    await expect(page.getByText('嘉宾总数')).toBeVisible();
    await expect(page.getByText('会议总数')).toBeVisible();
    console.log('  OK - dashboard stats visible');
  });

  test.afterAll(() => {
    console.log('\n======================================');
    console.log('  Full Workflow Complete');
    console.log('  Meeting: ' + name);
    console.log('  Code: ' + code);
    console.log('  Steps: Login/Create/Plan/Guest/Agenda/');
    console.log('         Transport/CheckIn/Health/Dashboard');
    console.log('======================================\n');
  });
});
