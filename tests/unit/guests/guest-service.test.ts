import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    guest: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { addGuest, updateGuest } from '@/modules/guests/guest-service';

const createMock = vi.mocked(prisma.guest.create);
const updateMock = vi.mocked(prisma.guest.update);
const updateManyMock = vi.mocked(prisma.guest.updateMany);

describe('addGuest', () => {
  beforeEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
    createMock.mockResolvedValue({ id: 'guest-1' } as never);
  });

  it('normalizes guest fields on create', async () => {
    await addGuest({
      eventId: 'event-1',
      name: '  Alex Example  ',
      email: '  ALEX@EXAMPLE.COM  ',
      note: '  Vegetarian  ',
      canBringPlusOne: true,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        eventId: 'event-1',
        name: 'Alex Example',
        email: 'alex@example.com',
        note: 'Vegetarian',
        canBringPlusOne: true,
      },
    });
  });
});

describe('updateGuest', () => {
  beforeEach(() => {
    updateMock.mockReset();
    updateManyMock.mockReset();
    updateMock.mockResolvedValue({ id: 'guest-1' } as never);
    updateManyMock.mockResolvedValue({ count: 1 });
  });

  it('updates and normalizes guest fields only when the guest belongs to the event', async () => {
    await updateGuest('event-1', 'guest-1', {
      name: '  Jamie Guest  ',
      email: '  JAMIE@EXAMPLE.COM ',
      note: '  Needs ramp access  ',
      canBringPlusOne: false,
    });

    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: 'guest-1', eventId: 'event-1' },
      data: {
        name: 'Jamie Guest',
        email: 'jamie@example.com',
        note: 'Needs ramp access',
        canBringPlusOne: false,
      },
    });
  });
});
