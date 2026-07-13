import { describe, expect, it } from 'vitest';

import {
  buildGuestFilterLinks,
  filterGuests,
  type GuestFilterKey,
} from '@/modules/events/event-dashboard-filters';

type TestGuest = {
  id: string;
  name: string;
  email: string;
  invitation: { sentAt: string | null } | null;
  rsvp: { status: string } | null;
};

const guests: TestGuest[] = [
  { id: 'draft', name: 'Alex Draft', email: 'alex@example.com', invitation: null, rsvp: null },
  { id: 'sent', name: 'Jamie Sent', email: 'jamie@example.com', invitation: { sentAt: '2026-07-11T01:00:00.000Z' }, rsvp: null },
  { id: 'responded', name: 'Morgan Responded', email: 'morgan@example.com', invitation: { sentAt: '2026-07-11T01:00:00.000Z' }, rsvp: { status: 'GOING' } },
];

describe('event dashboard filters', () => {
  it.each([
    ['all', ['draft', 'sent', 'responded']],
    ['draft', ['draft']],
    ['sent', ['sent', 'responded']],
    ['responded', ['responded']],
    ['no-response', ['draft', 'sent']],
    ['unexpected', ['draft', 'sent', 'responded']],
  ] as const)('filters %s guests correctly', (filterKey, expectedIds) => {
    expect(filterGuests(guests, filterKey).map((guest) => guest.id)).toEqual(expectedIds);
  });

  it('filters by a normalized case-insensitive name or email search while preserving status filters and order', () => {
    expect(filterGuests(guests, 'all', '  EXAMPLE.COM  ').map((guest) => guest.id)).toEqual([
      'draft',
      'sent',
      'responded',
    ]);
    expect(filterGuests(guests, 'all', '   ').map((guest) => guest.id)).toEqual([
      'draft',
      'sent',
      'responded',
    ]);
  });

  it('combines a status filter with a guest search', () => {
    expect(filterGuests(guests, 'sent', 'mOrGaN').map((guest) => guest.id)).toEqual(['responded']);
  });

  it('builds stable guest filter links for the dashboard', () => {
    const links = buildGuestFilterLinks('evt_123');

    expect(links).toEqual([
      { key: 'all', label: 'All', href: '/admin/events/evt_123', isActive: true },
      { key: 'draft', label: 'Draft', href: '/admin/events/evt_123?guestFilter=draft', isActive: false },
      { key: 'sent', label: 'Sent', href: '/admin/events/evt_123?guestFilter=sent', isActive: false },
      { key: 'responded', label: 'Responded', href: '/admin/events/evt_123?guestFilter=responded', isActive: false },
      { key: 'no-response', label: 'No response', href: '/admin/events/evt_123?guestFilter=no-response', isActive: false },
    ] satisfies Array<{ key: GuestFilterKey; label: string; href: string; isActive: boolean }>);
  });

  it('preserves an encoded guest search query on every dashboard filter link', () => {
    const links = buildGuestFilterLinks('evt 123', 'sent', ' Morgan & Co ');

    expect(links.map((link) => link.href)).toEqual([
      '/admin/events/evt%20123?guestSearch=Morgan+%26+Co',
      '/admin/events/evt%20123?guestFilter=draft&guestSearch=Morgan+%26+Co',
      '/admin/events/evt%20123?guestFilter=sent&guestSearch=Morgan+%26+Co',
      '/admin/events/evt%20123?guestFilter=responded&guestSearch=Morgan+%26+Co',
      '/admin/events/evt%20123?guestFilter=no-response&guestSearch=Morgan+%26+Co',
    ]);
  });

  it('marks the active dashboard filter link', () => {
    const links = buildGuestFilterLinks('evt_123', 'sent');

    expect(links.find((link) => link.key === 'sent')?.isActive).toBe(true);
    expect(links.filter((link) => link.isActive)).toHaveLength(1);
  });
});
