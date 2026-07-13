import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    guest: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import { addGuest, deleteGuest, updateGuest } from '@/modules/guests/guest-service';

const createMock = vi.mocked(prisma.guest.create);
const updateMock = vi.mocked(prisma.guest.update);
const updateManyMock = vi.mocked(prisma.guest.updateMany);
const deleteManyMock = vi.mocked(prisma.guest.deleteMany);

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
    const result = await updateGuest('event-1', 'guest-1', {
      name: '  Jamie Guest  ',
      email: '  JAMIE@EXAMPLE.COM ',
      note: '  Needs ramp access  ',
      canBringPlusOne: false,
    });

    expect(result).toEqual({ count: 1 });
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

  it('reports zero updates when the guest belongs to a different event', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    const result = await updateGuest('event-1', 'guest-from-event-2', {
      name: 'Jamie Guest',
      email: 'jamie@example.com',
    });

    expect(result).toEqual({ count: 0 });
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: 'guest-from-event-2', eventId: 'event-1' },
      data: {
        name: 'Jamie Guest',
        email: 'jamie@example.com',
        note: '',
        canBringPlusOne: false,
      },
    });
  });
});

describe('deleteGuest', () => {
  beforeEach(() => {
    deleteManyMock.mockReset();
    deleteManyMock.mockResolvedValue({ count: 1 });
  });

  it('deletes only a guest belonging to the requested event', async () => {
    const result = await deleteGuest('event-1', 'guest-1');

    expect(result).toEqual({ count: 1 });
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { id: 'guest-1', eventId: 'event-1' } });
  });

  it('reports zero deletions for a cross-event guest', async () => {
    deleteManyMock.mockResolvedValue({ count: 0 });

    const result = await deleteGuest('event-1', 'guest-from-event-2');

    expect(result).toEqual({ count: 0 });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: 'guest-from-event-2', eventId: 'event-1' },
    });
  });

  it('reports zero deletions for a genuinely missing guest', async () => {
    deleteManyMock.mockResolvedValue({ count: 0 });

    const result = await deleteGuest('event-1', 'missing-guest');

    expect(result).toEqual({ count: 0 });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: 'missing-guest', eventId: 'event-1' },
    });
  });
});
