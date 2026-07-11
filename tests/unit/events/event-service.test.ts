import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    event: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';
import {
  clearEventAssetImage,
  createEvent,
  replaceEventAssetImage,
  setEventEmblemImage,
  setEventHeroImage,
  setEventWatermarkImage,
  updateEvent,
} from '@/modules/events/event-service';

const createMock = vi.mocked(prisma.event.create);
const findUniqueMock = vi.mocked(prisma.event.findUnique);
const updateMock = vi.mocked(prisma.event.update);

describe('createEvent', () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({
      id: 'event-1',
      templateKey: 'classic',
    } as never);
  });

  it('assigns the default template to new events', async () => {
    await createEvent({
      title: '  Summer Party  ',
      hostName: '  Alex Host  ',
      location: '  Garden Patio  ',
      description: '  Bring snacks.  ',
      startsAt: new Date('2026-08-20T18:30:00.000Z'),
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        templateKey: 'classic',
      }),
    });
  });
});

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
        templateKey: 'classic',
      },
    });
  });

  it('persists blank or null startsAt as null', async () => {
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

    await updateEvent('event-1', {
      title: 'Event title',
      hostName: 'Host name',
      location: 'Event hall',
      description: 'Description',
      startsAt: null,
    });

    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({
        startsAt: null,
      }),
    });
  });

  it('coerces invalid date strings to null', async () => {
    await updateEvent('event-1', {
      title: 'Event title',
      hostName: 'Host name',
      location: 'Event hall',
      description: 'Description',
      startsAt: 'not-a-date',
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({
        startsAt: null,
      }),
    });
  });

  it('updates the selected template when given a supported key', async () => {
    await updateEvent('event-1', {
      title: 'Updated title',
      hostName: 'Host name',
      location: 'Event hall',
      description: 'Description',
      startsAt: null,
      templateKey: 'modern',
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({
        templateKey: 'modern',
      }),
    });
  });

  it('falls back to the default template when given an unsupported key', async () => {
    await updateEvent('event-1', {
      title: 'Updated title',
      hostName: 'Host name',
      location: 'Event hall',
      description: 'Description',
      startsAt: null,
      templateKey: 'ballroom-chaos',
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: expect.objectContaining({
        templateKey: 'classic',
      }),
    });
  });
});

describe('event asset setters', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    updateMock.mockResolvedValue({ id: 'event-1' } as never);
  });

  it('stores the hero image path on the event', async () => {
    await setEventHeroImage('event-1', 'hero.jpg');

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { heroImagePath: 'hero.jpg' },
    });
  });

  it('stores emblem and watermark image paths on the event', async () => {
    await setEventEmblemImage('event-1', 'emblem.png');
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { emblemImagePath: 'emblem.png' },
    });

    await setEventWatermarkImage('event-1', 'watermark.png');
    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: 'event-1' },
      data: { watermarkImagePath: 'watermark.png' },
    });
  });

  it('replaces an asset path and returns the previous file for cleanup', async () => {
    findUniqueMock.mockResolvedValue({ heroImagePath: 'old-hero.jpg' } as never);

    const result = await replaceEventAssetImage('event-1', 'heroImagePath', 'new-hero.jpg');

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      select: {
        heroImagePath: true,
        emblemImagePath: true,
        watermarkImagePath: true,
      },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { heroImagePath: 'new-hero.jpg' },
    });
    expect(result.previousAssetPath).toBe('old-hero.jpg');
  });

  it('clears an asset path and returns the removed file for cleanup', async () => {
    findUniqueMock.mockResolvedValue({ watermarkImagePath: 'watermark.png' } as never);

    const result = await clearEventAssetImage('event-1', 'watermarkImagePath');

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      select: {
        heroImagePath: true,
        emblemImagePath: true,
        watermarkImagePath: true,
      },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { watermarkImagePath: null },
    });
    expect(result.previousAssetPath).toBe('watermark.png');
  });
});
