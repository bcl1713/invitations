import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

function readInvitationTokenForEmail(email: string) {
  const query = `select i.token from "Invitation" i join "Guest" g on g.id = i."guestId" where g.email = '${email}' order by i."createdAt" desc limit 1;`;
  return execFileSync(
    'docker',
    ['exec', 'invitations-smoke-db-1', 'psql', '-U', 'invitations', '-d', 'invitations', '-Atqc', query],
    { encoding: 'utf8' },
  ).trim();
}

test('postcard editor preserves caret, previews immediately, and renders saved variables publicly', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const eventTitle = `Postcard Editor Event ${suffix}`;
  const guestName = `Editor Guest ${suffix}`;
  const guestEmail = `editor-${suffix}@example.com`;

  await page.goto('http://127.0.0.1:3300/login');
  await page.getByLabel('Email').fill('host@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

  await page.getByLabel('Title').fill(eventTitle);
  await page.getByLabel('Host name').fill('Review Host');
  await page.getByRole('button', { name: 'Create event' }).click();
  await expect(page.locator('main h1').first()).toHaveText(eventTitle);

  const form = page.locator('#event-details-form');
  const preview = page.getByRole('heading', { name: 'Live invitation preview' }).locator('..').locator('..');
  const titleEditor = page.locator('[contenteditable="true"][aria-label="Main title"]');
  const titleBefore = await titleEditor.textContent();
  await titleEditor.click();
  await titleEditor.press('End');
  await page.keyboard.type('Q');
  await expect(titleEditor).toHaveText(`${titleBefore}Q`);
  await expect(preview.locator('h1')).toContainText('Q');

  const fontSize = page.getByLabel('Font size');
  await fontSize.fill('100');
  await expect(fontSize).toHaveValue('72');

  const aboutEditor = page.locator('[contenteditable="true"][aria-label="About text"]');
  await aboutEditor.fill('A '.repeat(4000));
  await expect(page.locator('.invitation-overflow-warning')).toContainText('exceeds the fixed 2:3 design surface');
  await aboutEditor.fill('Reserved for %guestname');
  await expect(form.locator('input[name="designConfig"]')).toHaveValue(/%guestname/);

  const saveResponse = page.waitForResponse((response) => response.url().includes('/admin/events/') && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Save event details' }).click();
  await saveResponse;
  await expect(page.locator('main h1').first()).toHaveText(eventTitle);
  await page.reload();
  await expect(page.locator('[contenteditable="true"][aria-label="About text"]')).toHaveText('Reserved for %guestname');

  const addGuestForm = page.getByRole('button', { name: 'Add guest' }).locator('..');
  await addGuestForm.getByLabel('Name', { exact: true }).fill(guestName);
  await addGuestForm.getByLabel('Email').fill(guestEmail);
  await addGuestForm.getByLabel('Send invite now').check();
  await addGuestForm.getByRole('button', { name: 'Add guest' }).click();
  await expect(page.getByRole('row', { name: new RegExp(`${guestName}.*${guestEmail}`) })).toBeVisible();

  const token = readInvitationTokenForEmail(guestEmail);
  expect(token).toBeTruthy();
  await page.goto(`http://127.0.0.1:3300/i/${encodeURIComponent(token)}`);
  await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
  await expect(page.getByText(`Reserved for ${guestName}`)).toBeVisible();
});
