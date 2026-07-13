export const GUEST_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'responded', label: 'Responded' },
  { key: 'no-response', label: 'No response' },
] as const;

export type GuestFilterKey = (typeof GUEST_FILTER_OPTIONS)[number]['key'];
export type GuestSearchParam = string | string[] | undefined;

export function normalizeGuestSearch(searchQuery: GuestSearchParam): string {
  return Array.isArray(searchQuery) ? searchQuery[0] ?? '' : searchQuery ?? '';
}

type FilterableGuest = {
  id: string;
  name?: string;
  email?: string;
  note?: string | null;
  canBringPlusOne?: boolean;
  invitation?: { sentAt?: string | Date | null } | null;
  rsvp?: { status?: string | null; headcount?: number | null } | null;
};

export function filterGuests<T extends FilterableGuest>(
  guests: T[],
  guestFilter: string,
  searchQuery: string = '',
): T[] {
  const filteredGuests = (() => {
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
  })();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  if (!normalizedSearchQuery) {
    return filteredGuests;
  }

  return filteredGuests.filter((guest) =>
    [guest.name, guest.email].some((value) => value?.toLowerCase().includes(normalizedSearchQuery)),
  );
}

export function buildGuestFilterLinks(
  eventId: string,
  activeFilter: string = 'all',
  searchQuery: string = '',
) {
  const normalizedSearchQuery = searchQuery.trim();

  return GUEST_FILTER_OPTIONS.map((filter) => {
    const filterParams = new URLSearchParams();
    if (filter.key !== 'all') {
      filterParams.set('guestFilter', filter.key);
    }
    if (normalizedSearchQuery) {
      filterParams.set('guestSearch', normalizedSearchQuery);
    }

    const query = filterParams.toString();
    return {
      ...filter,
      href: `/admin/events/${encodeURIComponent(eventId)}${query ? `?${query}` : ''}`,
      isActive: filter.key === activeFilter,
    };
  });
}
