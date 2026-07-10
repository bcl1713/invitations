import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';

function readInvitationTokenForEmail(email: string) {
  const query = `select i.token from "Invitation" i join "Guest" g on g.id = i."guestId" where g.email = '${email}' order by i."createdAt" desc limit 1;`;

  return execFileSync(
    'docker',
    ['exec', 'invitations-smoke-db-1', 'psql', '-U', 'invitations', '-d', 'invitations', '-Atqc', query],
    { encoding: 'utf8' },
  ).trim();
}

test('host can edit an event, upload a hero image, and manage draft vs sent guests', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const originalTitle = `Smoke Test Dinner ${suffix}`;
  const updatedTitle = `Smoke Test Supper ${suffix}`;
  const updatedDescription = `Updated smoke test description ${suffix}.`;
  const updatedLocation = `Updated Test Kitchen ${suffix}`;
  const updatedHostName = `Brian ${suffix}`;
  const updatedStartsAt = '2026-08-20T18:30';
  const expectedInviteDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(updatedStartsAt));
  const heroImagePath = path.resolve(process.cwd(), 'tests/fixtures/hero-smoke.png');
  const draftGuestName = `Draft Guest ${suffix}`;
  const draftGuestEmail = `draft-${suffix}@example.com`;
  const sentGuestName = `Sent Guest ${suffix}`;
  const sentGuestEmail = `sent-${suffix}@example.com`;

  await page.goto('http://127.0.0.1:3300/login');
  await page.getByLabel('Email').fill('host@example.com');
  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

  await page.getByLabel('Title').fill(originalTitle);
  await page.getByLabel('Host name').fill('Brian');
  await page.getByLabel('Location').fill('Test Kitchen');
  await page.getByLabel('Description').fill('A quick deployment smoke test.');
  await page.getByRole('button', { name: 'Create event' }).click();

  await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible();

  const eventDetailsForm = page.getByRole('button', { name: 'Save event details' }).locator('..').locator('..');
  const addGuestForm = page.getByRole('button', { name: 'Add guest' }).locator('..');

  await eventDetailsForm.getByLabel('Title').fill(updatedTitle);
  await eventDetailsForm.getByLabel('Host name').fill(updatedHostName);
  await eventDetailsForm.getByLabel('Location').fill(updatedLocation);
  await eventDetailsForm.getByLabel('Start time').fill(updatedStartsAt);
  await eventDetailsForm.getByLabel('Description').fill(updatedDescription);
  await eventDetailsForm.getByRole('button', { name: 'Save event details' }).click();

  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
  await expect(page.getByText(updatedLocation)).toBeVisible();
  await expect(page.getByLabel('Description')).toHaveValue(updatedDescription);

  await page.getByLabel('Upload hero image').setInputFiles(heroImagePath);
  await page.getByRole('button', { name: 'Upload image' }).click();

  const dashboardHero = page.locator('img.hero-image');
  await expect(dashboardHero).toBeVisible();
  await expect(dashboardHero).toHaveAttribute('src', /\/media\//);

  await addGuestForm.getByLabel('Name', { exact: true }).fill(draftGuestName);
  await addGuestForm.getByLabel('Email').fill(draftGuestEmail);
  await addGuestForm.getByLabel('Note').fill('local smoke');
  await addGuestForm.getByRole('button', { name: 'Add guest' }).click();

  const draftRow = page.getByRole('row', { name: new RegExp(`${draftGuestName}.*${draftGuestEmail}`) });
  await expect(draftRow).toBeVisible();
  await expect(draftRow.locator('td').nth(2)).toHaveText('Draft');

  await addGuestForm.getByLabel('Name', { exact: true }).fill(sentGuestName);
  await addGuestForm.getByLabel('Email').fill(sentGuestEmail);
  await addGuestForm.getByLabel('Note').fill('local smoke send-now');
  await addGuestForm.getByLabel('Send invite now').check();
  await addGuestForm.getByRole('button', { name: 'Add guest' }).click();

  const sentRow = page.getByRole('row', { name: new RegExp(`${sentGuestName}.*${sentGuestEmail}`) });
  await expect(sentRow).toBeVisible();
  await expect(sentRow.locator('td').nth(2)).toHaveText('Sent');

  const token = readInvitationTokenForEmail(sentGuestEmail);
  expect(token).toBeTruthy();

  await page.goto(`http://127.0.0.1:3300/i/${encodeURIComponent(token)}`);

  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
  await expect(page.getByText(`Hosted by ${updatedHostName}`)).toBeVisible();
  await expect(page.getByText(updatedLocation)).toBeVisible();
  await expect(page.getByText(updatedDescription)).toBeVisible();
  await expect(page.getByText(expectedInviteDate)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RSVP' })).toBeVisible();

  const inviteHero = page.locator('img.hero-image');
  await expect(inviteHero).toBeVisible();
  await expect(inviteHero).toHaveAttribute('src', /\/media\//);
  await expect(inviteHero.evaluate((img) => (img as HTMLImageElement).naturalWidth)).resolves.toBeGreaterThan(0);
});
