import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { exportEventCsv } from '@/modules/events/event-export-service';

const findUniqueMock = vi.mocked(prisma.event.findUnique);

describe('exportEventCsv', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it('returns a csv with flattened guest, invite, and rsvp columns', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'event-1',
      slug: 'summer-party',
      title: 'Summer Party',
      startsAt: new Date('2026-08-20T22:30:00.000Z'),
      timeZone: 'America/New_York',
      guests: [
        {
          id: 'guest-1',
          name: 'Alex Example',
          email: 'alex@example.com',
          note: 'Vegetarian',
          canBringPlusOne: true,
          invitation: {
            sentAt: new Date('2026-08-20T18:30:00.000Z'),
          },
          rsvp: {
            status: 'GOING',
            headcount: 2,
            note: 'See you there',
            updatedAt: new Date('2026-08-22T15:00:00.000Z'),
          },
        },
        {
          id: 'guest-2',
          name: 'Jamie Draft',
          email: 'jamie@example.com',
          note: '',
          canBringPlusOne: false,
          invitation: {
            sentAt: null,
          },
          rsvp: null,
        },
      ],
    } as never);

    const result = await exportEventCsv('event-1');

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      select: {
        slug: true,
        title: true,
        startsAt: true,
        timeZone: true,
        guests: {
          orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' },
          ],
          select: {
            id: true,
            name: true,
            email: true,
            note: true,
            canBringPlusOne: true,
            invitation: {
              select: {
                sentAt: true,
              },
            },
            rsvp: {
              select: {
                status: true,
                headcount: true,
                note: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    expect(result).toEqual({
      fileName: 'summer-party-guests.csv',
      csv: [
        'event_start_time,event_time_zone,guest_name,guest_email,guest_note,plus_one_allowed,invite_status,invite_sent_at,rsvp_status,rsvp_headcount,rsvp_note,rsvp_updated_at',
        '"Thursday, August 20, 2026 at 6:30 PM",America/New_York,Alex Example,alex@example.com,Vegetarian,yes,sent,2026-08-20T18:30:00.000Z,GOING,2,See you there,2026-08-22T15:00:00.000Z',
        '"Thursday, August 20, 2026 at 6:30 PM",America/New_York,Jamie Draft,jamie@example.com,,no,draft,,,,,',
      ].join('\n'),
    });
  });

  it('quotes commas, double quotes, and newlines in csv cells', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'event-2',
      slug: 'winter-gala',
      title: 'Winter Gala',
      guests: [
        {
          id: 'guest-3',
          name: 'Casey, "CJ"',
          email: 'casey@example.com',
          note: 'Allergies:\npeanuts, shellfish',
          canBringPlusOne: false,
          invitation: {
            sentAt: new Date('2026-12-01T08:00:00.000Z'),
          },
          rsvp: {
            status: 'MAYBE',
            headcount: 1,
            note: 'Needs "quiet" table',
            updatedAt: new Date('2026-12-02T10:15:00.000Z'),
          },
        },
      ],
    } as never);

    const result = await exportEventCsv('event-2');

    expect(result?.csv).toContain('"Casey, ""CJ"""');
    expect(result?.csv).toContain('"Allergies:\npeanuts, shellfish"');
    expect(result?.csv).toContain('"Needs ""quiet"" table"');
  });
});
