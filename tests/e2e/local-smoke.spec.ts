import { test, expect } from '@playwright/test';

test('host can sign in, create an event, and manage draft vs sent guests', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const title = `Smoke Test Dinner ${suffix}`;
  const draftGuestName = `Draft Guest ${suffix}`;
  const draftGuestEmail = `draft-${suffix}@example.com`;
  const sentGuestName = `Sent Guest ${suffix}`;
  const sentGuestEmail = `sent-${suffix}@example.com`;

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

  await page.getByLabel('Name').fill(draftGuestName);
  await page.getByLabel('Email').fill(draftGuestEmail);
  await page.getByLabel('Note').fill('local smoke');
  await page.getByRole('button', { name: 'Add guest' }).click();

  const draftRow = page.getByRole('row', { name: new RegExp(`${draftGuestName}.*${draftGuestEmail}`) });
  await expect(draftRow).toBeVisible();
  await expect(draftRow.locator('td').nth(2)).toHaveText('Draft');

  await page.getByLabel('Name').fill(sentGuestName);
  await page.getByLabel('Email').fill(sentGuestEmail);
  await page.getByLabel('Note').fill('local smoke send-now');
  await page.getByLabel('Send invite now').check();
  await page.getByRole('button', { name: 'Add guest' }).click();

  const sentRow = page.getByRole('row', { name: new RegExp(`${sentGuestName}.*${sentGuestEmail}`) });
  await expect(sentRow).toBeVisible();
  await expect(sentRow.locator('td').nth(2)).toHaveText('Sent');
});
