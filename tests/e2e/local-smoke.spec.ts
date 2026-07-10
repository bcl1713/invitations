import { test, expect } from '@playwright/test';

test('host can sign in, create an event, and add a guest', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const title = `Smoke Test Dinner ${suffix}`;
  const guestName = `Test Guest ${suffix}`;
  const guestEmail = `guest-${suffix}@example.com`;

  await page.goto('http://127.0.0.1:3300/login');
  await page.getByLabel('Email').fill('host@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Host name').fill('Brian');
  await page.getByLabel('Location').fill('Test Kitchen');
  await page.getByLabel('Description').fill('A quick deployment smoke test.');
  await page.getByRole('button', { name: 'Create event' }).click();

  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByLabel('Name').fill(guestName);
  await page.getByLabel('Email').fill(guestEmail);
  await page.getByLabel('Note').fill('local smoke');
  await page.getByRole('button', { name: 'Add guest' }).click();

  await expect(page.getByText(guestName)).toBeVisible();
  await expect(page.getByText(guestEmail)).toBeVisible();
});
