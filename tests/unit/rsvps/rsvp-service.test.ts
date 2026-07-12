import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    guest: {
      findUnique: vi.fn(),
    },
    rsvp: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { RSVP_NOTE_MAX_LENGTH, submitRsvp } from '@/modules/rsvps/rsvp-service';

const guestFindUniqueMock = vi.mocked(prisma.guest.findUnique);
const rsvpUpsertMock = vi.mocked(prisma.rsvp.upsert);

describe('submitRsvp', () => {
  beforeEach(() => {
    guestFindUniqueMock.mockReset();
    rsvpUpsertMock.mockReset();
    guestFindUniqueMock.mockResolvedValue({
      eventId: 'event-1',
      canBringPlusOne: false,
    } as never);
  });

  it('rejects a forged RSVP status before writing it', async () => {
    await expect(submitRsvp({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'NOT_A_STATUS',
      note: '',
      headcount: 1,
    })).rejects.toThrow('Invalid RSVP submission');

    expect(rsvpUpsertMock).not.toHaveBeenCalled();
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['non-integer', 1.5],
    ['not a number', 'not-a-number'],
    ['boolean', true],
    ['unbounded', 999_999],
  ])('rejects a forged %s headcount before writing it', async (_label, headcount) => {
    await expect(submitRsvp({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'GOING',
      note: '',
      headcount,
    })).rejects.toThrow('Invalid RSVP submission');

    expect(rsvpUpsertMock).not.toHaveBeenCalled();
  });

  it('enforces the plus-one rule from the persisted guest record', async () => {
    await expect(submitRsvp({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'GOING',
      note: '',
      headcount: 2,
    })).rejects.toThrow('Invalid RSVP submission');

    guestFindUniqueMock.mockResolvedValue({
      eventId: 'event-1',
      canBringPlusOne: true,
    } as never);
    rsvpUpsertMock.mockResolvedValue({ id: 'rsvp-1' } as never);

    await submitRsvp({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'GOING',
      note: '  See you there  ',
      headcount: 2,
    });

    expect(rsvpUpsertMock).toHaveBeenCalledWith({
      where: { guestId: 'guest-1' },
      update: {
        status: 'GOING',
        note: 'See you there',
        headcount: 2,
      },
      create: {
        eventId: 'event-1',
        guestId: 'guest-1',
        status: 'GOING',
        note: 'See you there',
        headcount: 2,
      },
    });
  });

  it('accepts the maximum RSVP note length and rejects a longer forged note', async () => {
    rsvpUpsertMock.mockResolvedValue({ id: 'rsvp-1' } as never);

    await submitRsvp({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'MAYBE',
      note: 'a'.repeat(RSVP_NOTE_MAX_LENGTH),
      headcount: 1,
    });

    await expect(submitRsvp({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'MAYBE',
      note: 'a'.repeat(RSVP_NOTE_MAX_LENGTH + 1),
      headcount: 1,
    })).rejects.toThrow('Invalid RSVP submission');
  });
});
