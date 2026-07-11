import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getHostSessionMock,
  saveUploadedImageMock,
  deleteUploadedImageIfUnusedMock,
  replaceEventAssetImageMock,
  clearEventAssetImageMock,
} = vi.hoisted(() => ({
  getHostSessionMock: vi.fn(),
  saveUploadedImageMock: vi.fn(),
  deleteUploadedImageIfUnusedMock: vi.fn(),
  replaceEventAssetImageMock: vi.fn(),
  clearEventAssetImageMock: vi.fn(),
}));

vi.mock('@/lib/host-session', () => ({
  getHostSession: getHostSessionMock,
}));

vi.mock('@/modules/assets/local-asset-storage', () => ({
  saveUploadedImage: saveUploadedImageMock,
  deleteUploadedImageIfUnused: deleteUploadedImageIfUnusedMock,
}));

vi.mock('@/modules/events/event-service', () => ({
  replaceEventAssetImage: replaceEventAssetImageMock,
  clearEventAssetImage: clearEventAssetImageMock,
}));

import { POST as postHero } from '@/app/api/admin/events/[eventId]/hero/route';
import { POST as postHeroRemove } from '@/app/api/admin/events/[eventId]/hero/remove/route';
import { POST as postEmblem } from '@/app/api/admin/events/[eventId]/emblem/route';
import { POST as postEmblemRemove } from '@/app/api/admin/events/[eventId]/emblem/remove/route';
import { POST as postWatermark } from '@/app/api/admin/events/[eventId]/watermark/route';
import { POST as postWatermarkRemove } from '@/app/api/admin/events/[eventId]/watermark/remove/route';

function makeUploadForm(fieldName: string, file: File) {
  const formData = new FormData();
  formData.set(fieldName, file);
  return formData;
}

describe('event asset routes', () => {
  beforeEach(() => {
    getHostSessionMock.mockReset();
    saveUploadedImageMock.mockReset();
    deleteUploadedImageIfUnusedMock.mockReset();
    replaceEventAssetImageMock.mockReset();
    clearEventAssetImageMock.mockReset();
  });

  it('stores an uploaded hero image, replaces the old asset, and redirects back to the dashboard', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    saveUploadedImageMock.mockResolvedValue('stored-hero.png');
    replaceEventAssetImageMock.mockResolvedValue({ previousAssetPath: 'old-hero.png' });

    const file = new File([new Uint8Array(128)], 'hero.png', { type: 'image/png' });
    const request = {
      url: 'http://localhost/api/admin/events/event-123/hero',
      formData: vi.fn().mockResolvedValue(makeUploadForm('heroImage', file)),
    } as unknown as Request;

    const response = await postHero(request, {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(saveUploadedImageMock).toHaveBeenCalledTimes(1);
    expect(replaceEventAssetImageMock).toHaveBeenCalledWith('event-123', 'heroImagePath', 'stored-hero.png');
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith('old-hero.png');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin/events/event-123');
  });

  it('stores an uploaded event emblem and redirects back to the dashboard', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    saveUploadedImageMock.mockResolvedValue('stored-emblem.png');
    replaceEventAssetImageMock.mockResolvedValue({ previousAssetPath: 'old-emblem.png' });

    const file = new File([new Uint8Array(128)], 'emblem.png', { type: 'image/png' });
    const request = {
      url: 'http://localhost/api/admin/events/event-123/emblem',
      formData: vi.fn().mockResolvedValue(makeUploadForm('emblemImage', file)),
    } as unknown as Request;

    const response = await postEmblem(request, {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(saveUploadedImageMock).toHaveBeenCalledTimes(1);
    expect(replaceEventAssetImageMock).toHaveBeenCalledWith('event-123', 'emblemImagePath', 'stored-emblem.png');
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith('old-emblem.png');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin/events/event-123');
  });

  it('stores an uploaded watermark and redirects back to the dashboard', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    saveUploadedImageMock.mockResolvedValue('stored-watermark.png');
    replaceEventAssetImageMock.mockResolvedValue({ previousAssetPath: 'old-watermark.png' });

    const file = new File([new Uint8Array(128)], 'watermark.png', { type: 'image/png' });
    const request = {
      url: 'http://localhost/api/admin/events/event-123/watermark',
      formData: vi.fn().mockResolvedValue(makeUploadForm('watermarkImage', file)),
    } as unknown as Request;

    const response = await postWatermark(request, {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(saveUploadedImageMock).toHaveBeenCalledTimes(1);
    expect(replaceEventAssetImageMock).toHaveBeenCalledWith('event-123', 'watermarkImagePath', 'stored-watermark.png');
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith('old-watermark.png');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin/events/event-123');
  });

  it.each([
    ['hero', postHeroRemove, 'heroImagePath', 'old-hero.png'],
    ['emblem', postEmblemRemove, 'emblemImagePath', 'old-emblem.png'],
    ['watermark', postWatermarkRemove, 'watermarkImagePath', 'old-watermark.png'],
  ])('clears the %s asset and deletes the orphaned file', async (_label, handler, field, oldFileName) => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    clearEventAssetImageMock.mockResolvedValue({ previousAssetPath: oldFileName });

    const response = await handler(new Request('http://localhost'), {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(clearEventAssetImageMock).toHaveBeenCalledWith('event-123', field);
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith(oldFileName);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin/events/event-123');
  });
});
