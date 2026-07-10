import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    event: {
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { updateEvent } from '@/modules/events/event-service';

const updateMock = vi.mocked(prisma.event.update);

describe('updateEvent', () => {
  beforeEach(() => {
    updateMock.mockReset();
    updateMock.mockResolvedValue({
      id: 'event-1',
      slug: 'existing-slug',
    } as never);
  });

  it('updates trimmed event metadata', async () => {
    await updateEvent('event-1', {
      title: '  Summer Party  ',
      hostName: '  Alex Host  ',
      location: '  Garden Patio  ',
      description: '  Bring snacks.  ',
      startsAt: new Date('2026-08-20T18:30:00.000Z'),
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: {
        title: 'Summer Party',
        hostName: 'Alex Host',
        location: 'Garden Patio',
        description: 'Bring snacks.',
        startsAt: new Date('2026-08-20T18:30:00.000Z'),
      },
    });
  });

  it('persists blank startsAt as null', async () => {
    await updateEvent('event-1', {
      title: 'Event title',
      hostName: 'Host name',
      location: 'Event hall',
      description: 'Description',
      startsAt: '   ',
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({
        startsAt: null,
      }),
    });
  });

  it('leaves the existing slug unchanged on edit', async () => {
    await updateEvent('event-1', {
      title: 'Updated title',
      hostName: 'Host name',
      location: 'Event hall',
      description: 'Description',
      startsAt: null,
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.not.objectContaining({
        slug: expect.anything(),
      }),
    });
  });
});
