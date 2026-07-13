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
  const updatedTemplate = 'ceremonial';
  const expectedInviteDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(updatedStartsAt));
  const heroImagePath = path.resolve(process.cwd(), 'tests/fixtures/hero-smoke.png');
  const draftGuestName = `Draft Guest ${suffix}`;
  const draftGuestEmail = `draft-${suffix}@example.com`;
  const sentGuestName = `Sent Guest ${suffix}`;
  const sentGuestEmail = `sent-${suffix}@example.com`;
  const deletionGuestName = `Deletion Guest ${suffix}`;
  const deletionGuestEmail = `deletion-${suffix}@example.com`;

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

  const dashboardTitle = page.locator('main h1').first();

  await expect(dashboardTitle).toHaveText(originalTitle);

  const eventDetailsForm = page.locator('#event-details-form');
  const previewPanel = page.getByRole('heading', { name: 'Live invitation preview' }).locator('..').locator('..');
  const addGuestForm = page.getByRole('button', { name: 'Add guest' }).locator('..');

  await eventDetailsForm.locator('input[name="title"]').fill(updatedTitle);
  await eventDetailsForm.locator('input[name="hostName"]').fill(updatedHostName);
  await eventDetailsForm.locator('input[name="location"]').fill(updatedLocation);
  await eventDetailsForm.locator('input[name="startsAt"]').fill(updatedStartsAt);
  await eventDetailsForm.locator('textarea[name="description"]').fill(updatedDescription);
  await eventDetailsForm.locator('select[name="templateKey"]').selectOption(updatedTemplate);

  await expect(previewPanel.getByRole('heading', { name: updatedTitle })).toBeVisible();
  await expect(previewPanel.getByText(updatedLocation)).toBeVisible();
  await expect(previewPanel.getByText('You are cordially invited')).toBeVisible();
  await expect(previewPanel.getByRole('heading', { name: 'Kindly respond' })).toBeVisible();

  await eventDetailsForm.getByRole('button', { name: 'Save event details' }).click();

  await expect(dashboardTitle).toHaveText(updatedTitle);
  await expect(page.getByText(updatedLocation).first()).toBeVisible();
  await expect(eventDetailsForm.locator('textarea[name="description"]')).toHaveValue(updatedDescription);

  await page.reload();
  await expect(dashboardTitle).toHaveText(updatedTitle);
  await expect(eventDetailsForm.locator('select[name="templateKey"]')).toHaveValue(updatedTemplate);

  await page.getByLabel('Upload hero image').setInputFiles(heroImagePath);
  await expect(previewPanel.locator('img.hero-image')).toBeVisible();
  await page.locator('button', { hasText: 'Upload hero image' }).click();

  await page.getByLabel('Upload event emblem').setInputFiles(heroImagePath);
  await expect(previewPanel.locator('img.invitation-emblem')).toBeVisible();
  await page.locator('button', { hasText: 'Upload event emblem' }).click();

  await page.getByLabel('Upload custom watermark').setInputFiles(heroImagePath);
  await expect(previewPanel.locator('img.invitation-watermark')).toHaveCount(1);
  await page.locator('button', { hasText: 'Upload watermark' }).click();

  const dashboardHero = page.locator('img.hero-image').first();
  await expect(dashboardHero).toBeVisible();
  await expect(dashboardHero).toHaveAttribute('src', /\/media\//);
  await expect(page.getByRole('button', { name: 'Remove hero image' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove event emblem' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove watermark' })).toBeVisible();

  await page.getByRole('button', { name: 'Remove hero image' }).click();
  await expect(page.locator('img.hero-image').first()).toHaveCount(0);

  await page.getByRole('button', { name: 'Remove event emblem' }).click();
  await expect(page.locator('img.invitation-emblem')).toHaveCount(0);

  await page.getByRole('button', { name: 'Remove watermark' }).click();
  await expect(page.locator('img.invitation-watermark')).toHaveCount(0);

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
  await expect(draftRow.getByRole('button', { name: 'Send invite' })).toBeVisible();
  await expect(sentRow.getByRole('button', { name: 'Resend invite' })).toBeVisible();
  await expect(page.getByText('You can still send any draft manually from the guest row. Resending creates a fresh invitation link and invalidates the previous URL.')).toBeVisible();

  await addGuestForm.getByLabel('Name', { exact: true }).fill(deletionGuestName);
  await addGuestForm.getByLabel('Email').fill(deletionGuestEmail);
  await addGuestForm.getByLabel('Note').fill('local smoke deletion');
  await addGuestForm.getByRole('button', { name: 'Add guest' }).click();

  const deletionRow = page.getByRole('row', { name: new RegExp(`${deletionGuestName}.*${deletionGuestEmail}`) });
  await expect(deletionRow).toBeVisible();
  const dismissDeletionDialog = page.waitForEvent('dialog');
  await deletionRow.getByRole('button', { name: 'Delete guest' }).click();
  const dismissedDialog = await dismissDeletionDialog;
  expect(dismissedDialog.type()).toBe('confirm');
  expect(dismissedDialog.message()).toContain(deletionGuestName);
  await dismissedDialog.dismiss();
  await expect(deletionRow).toBeVisible();
  const acceptDeletionDialog = page.waitForEvent('dialog');
  await deletionRow.getByRole('button', { name: 'Delete guest' }).click();
  const acceptedDialog = await acceptDeletionDialog;
  expect(acceptedDialog.type()).toBe('confirm');
  expect(acceptedDialog.message()).toContain(deletionGuestName);
  await acceptedDialog.accept();
  await expect(deletionRow).toHaveCount(0);

  const guestSearch = page.getByRole('search');
  const guestSearchInput = guestSearch.getByLabel('Search guests');
  await guestSearchInput.fill(draftGuestName);
  await guestSearch.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/guestSearch=/);
  expect(new URL(page.url()).searchParams.get('guestSearch')).toBe(draftGuestName);
  await expect(draftRow).toBeVisible();
  await expect(sentRow).toHaveCount(0);

  await guestSearch.getByLabel('Search guests').fill(`SENT-${suffix}`);
  await guestSearch.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/guestSearch=/);
  expect(new URL(page.url()).searchParams.get('guestSearch')).toBe(`SENT-${suffix}`);
  await expect(sentRow).toBeVisible();
  await expect(draftRow).toHaveCount(0);

  await guestSearch.getByRole('link', { name: 'Clear search' }).click();
  await expect(page).not.toHaveURL(/guestSearch=/);
  await expect(draftRow).toBeVisible();
  await expect(sentRow).toBeVisible();

  await page.getByRole('link', { name: 'Sent' }).click();
  await expect(page).toHaveURL(/guestFilter=sent/);
  await guestSearch.getByLabel('Search guests').fill(`SENT-${suffix}`);
  await guestSearch.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/guestFilter=sent/);
  await expect(page).toHaveURL(/guestSearch=/);
  expect(new URL(page.url()).searchParams.get('guestFilter')).toBe('sent');
  expect(new URL(page.url()).searchParams.get('guestSearch')).toBe(`SENT-${suffix}`);
  await expect(sentRow).toBeVisible();
  await expect(draftRow).toHaveCount(0);

  await guestSearch.getByRole('link', { name: 'Clear search' }).click();
  await expect(page).toHaveURL(/guestFilter=sent/);
  await expect(page).not.toHaveURL(/guestSearch=/);
  await expect(sentRow).toBeVisible();
  await expect(draftRow).toHaveCount(0);

  await page.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).not.toHaveURL(/guestFilter=/);
  await expect(page).not.toHaveURL(/guestSearch=/);
  await expect(draftRow).toBeVisible();
  await expect(sentRow).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export guest CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-guests\.csv$/);
  const csv = await download.createReadStream();
  let csvText = '';
  for await (const chunk of csv!) {
    csvText += chunk.toString();
  }
  expect(csvText).toContain('guest_name,guest_email,guest_note,plus_one_allowed,invite_status,invite_sent_at,rsvp_status,rsvp_headcount,rsvp_note,rsvp_updated_at');
  expect(csvText).toContain(draftGuestEmail);
  expect(csvText).toContain(sentGuestEmail);

  await page.getByRole('link', { name: 'Draft' }).click();
  await expect(page).toHaveURL(/guestFilter=draft/);
  await expect(draftRow).toBeVisible();
  await expect(sentRow).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Draft' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Sent' }).click();
  await expect(page).toHaveURL(/guestFilter=sent/);
  await expect(sentRow).toBeVisible();
  await expect(draftRow).toHaveCount(0);

  await page.getByRole('link', { name: 'No response' }).click();
  await expect(page).toHaveURL(/guestFilter=no-response/);
  await expect(draftRow).toBeVisible();
  await expect(sentRow).toBeVisible();

  await page.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).not.toHaveURL(/guestFilter=/);
  await expect(draftRow).toBeVisible();
  await expect(sentRow).toBeVisible();

  const token = readInvitationTokenForEmail(sentGuestEmail);
  expect(token).toBeTruthy();

  await page.goto(`http://127.0.0.1:3300/i/${encodeURIComponent(token)}`);

  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
  await expect(page.getByText(`Hosted by ${updatedHostName}`)).toBeVisible();
  await expect(page.getByText(updatedLocation)).toBeVisible();
  await expect(page.getByText(updatedDescription)).toBeVisible();
  await expect(page.getByText(expectedInviteDate)).toBeVisible();
  await expect(page.getByText('You are cordially invited')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kindly respond' })).toBeVisible();

  const inviteHero = page.locator('img.hero-image').first();
  await expect(inviteHero).toHaveCount(0);
  await expect(page.locator('img.invitation-emblem')).toHaveCount(0);
  await expect(page.locator('img.invitation-watermark')).toHaveCount(0);
});
