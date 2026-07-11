export const GUEST_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'responded', label: 'Responded' },
  { key: 'no-response', label: 'No response' },
] as const;

export type GuestFilterKey = (typeof GUEST_FILTER_OPTIONS)[number]['key'];

type FilterableGuest = {
  invitation?: { sentAt?: string | Date | null } | null;
  rsvp?: unknown | null;
};

export function filterGuests<T extends FilterableGuest>(guests: T[], guestFilter: string): T[] {
  switch (guestFilter) {
    case 'draft':
      return guests.filter((guest) => !guest.invitation?.sentAt);
    case 'sent':
      return guests.filter((guest) => Boolean(guest.invitation?.sentAt));
    case 'responded':
      return guests.filter((guest) => Boolean(guest.rsvp));
    case 'no-response':
      return guests.filter((guest) => !guest.rsvp);
    default:
      return guests;
  }
}

export function buildGuestFilterLinks(eventId: string, activeFilter: string = 'all') {
  return GUEST_FILTER_OPTIONS.map((filter) => ({
    ...filter,
    href:
      filter.key === 'all'
        ? `/admin/events/${eventId}`
        : `/admin/events/${eventId}?guestFilter=${filter.key}`,
    isActive: filter.key === activeFilter,
  }));
}
