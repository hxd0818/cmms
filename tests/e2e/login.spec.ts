import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logs in with valid admin credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('控制台')).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('wrong');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByText('邮箱或密码错误')).toBeVisible();
  });
});
