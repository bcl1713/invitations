import { describe, expect, it } from 'vitest';

import {
  buildGuestFilterLinks,
  filterGuests,
  type GuestFilterKey,
} from '@/modules/events/event-dashboard-filters';

type TestGuest = {
  id: string;
  invitation: { sentAt: string | null } | null;
  rsvp: { status: string } | null;
};

const guests: TestGuest[] = [
  { id: 'draft', invitation: null, rsvp: null },
  { id: 'sent', invitation: { sentAt: '2026-07-11T01:00:00.000Z' }, rsvp: null },
  { id: 'responded', invitation: { sentAt: '2026-07-11T01:00:00.000Z' }, rsvp: { status: 'GOING' } },
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

  it('marks the active dashboard filter link', () => {
    const links = buildGuestFilterLinks('evt_123', 'sent');

    expect(links.find((link) => link.key === 'sent')?.isActive).toBe(true);
    expect(links.filter((link) => link.isActive)).toHaveLength(1);
  });
});
