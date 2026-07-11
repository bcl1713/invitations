import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    guest: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { addGuest, updateGuest } from '@/modules/guests/guest-service';

const createMock = vi.mocked(prisma.guest.create);
const updateMock = vi.mocked(prisma.guest.update);

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
    updateMock.mockResolvedValue({ id: 'guest-1' } as never);
  });

  it('updates and normalizes guest fields', async () => {
    await updateGuest('guest-1', {
      name: '  Jamie Guest  ',
      email: '  JAMIE@EXAMPLE.COM ',
      note: '  Needs ramp access  ',
      canBringPlusOne: false,
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'guest-1' },
      data: {
        name: 'Jamie Guest',
        email: 'jamie@example.com',
        note: 'Needs ramp access',
        canBringPlusOne: false,
      },
    });
  });
});
