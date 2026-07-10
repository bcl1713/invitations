import { test, expect } from '@playwright/test';

test('host can sign in, create an event, and add a guest', async ({ page }) => {
  await page.goto('http://127.0.0.1:3300/login');
  await page.getByLabel('Email').fill('host@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

  await page.getByLabel('Title').fill('Smoke Test Dinner');
  await page.getByLabel('Host name').fill('Brian');
  await page.getByLabel('Location').fill('Test Kitchen');
  await page.getByLabel('Description').fill('A quick deployment smoke test.');
  await page.getByRole('button', { name: 'Create event' }).click();

  await expect(page.getByRole('heading', { name: 'Smoke Test Dinner' })).toBeVisible();

  await page.getByLabel('Name').fill('Test Guest');
  await page.getByLabel('Email').fill('guest@example.com');
  await page.getByLabel('Note').fill('local smoke');
  await page.getByRole('button', { name: 'Add guest' }).click();

  await expect(page.getByRole('cell', { name: 'Test Guest' })).toBeVisible();
});
