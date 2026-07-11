import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getHostSessionMock,
  saveUploadedImageMock,
  setEventEmblemImageMock,
  setEventWatermarkImageMock,
} = vi.hoisted(() => ({
  getHostSessionMock: vi.fn(),
  saveUploadedImageMock: vi.fn(),
  setEventEmblemImageMock: vi.fn(),
  setEventWatermarkImageMock: vi.fn(),
}));

vi.mock('@/lib/host-session', () => ({
  getHostSession: getHostSessionMock,
}));

vi.mock('@/modules/assets/local-asset-storage', () => ({
  saveUploadedImage: saveUploadedImageMock,
}));

vi.mock('@/modules/events/event-service', () => ({
  setEventEmblemImage: setEventEmblemImageMock,
  setEventWatermarkImage: setEventWatermarkImageMock,
}));

import { POST as postEmblem } from '@/app/api/admin/events/[eventId]/emblem/route';
import { POST as postWatermark } from '@/app/api/admin/events/[eventId]/watermark/route';

function makeUploadForm(fieldName: string, file: File) {
  const formData = new FormData();
  formData.set(fieldName, file);
  return formData;
}

describe('event asset upload routes', () => {
  beforeEach(() => {
    getHostSessionMock.mockReset();
    saveUploadedImageMock.mockReset();
    setEventEmblemImageMock.mockReset();
    setEventWatermarkImageMock.mockReset();
  });

  it('stores an uploaded event emblem and redirects back to the dashboard', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    saveUploadedImageMock.mockResolvedValue('stored-emblem.png');

    const file = new File([new Uint8Array(128)], 'emblem.png', { type: 'image/png' });
    const request = {
      url: 'http://localhost/api/admin/events/event-123/emblem',
      formData: vi.fn().mockResolvedValue(makeUploadForm('emblemImage', file)),
    } as unknown as Request;

    const response = await postEmblem(request, {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(saveUploadedImageMock).toHaveBeenCalledTimes(1);
    expect(setEventEmblemImageMock).toHaveBeenCalledWith('event-123', 'stored-emblem.png');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin/events/event-123');
  });

  it('stores an uploaded watermark and redirects back to the dashboard', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    saveUploadedImageMock.mockResolvedValue('stored-watermark.png');

    const file = new File([new Uint8Array(128)], 'watermark.png', { type: 'image/png' });
    const request = {
      url: 'http://localhost/api/admin/events/event-123/watermark',
      formData: vi.fn().mockResolvedValue(makeUploadForm('watermarkImage', file)),
    } as unknown as Request;

    const response = await postWatermark(request, {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(saveUploadedImageMock).toHaveBeenCalledTimes(1);
    expect(setEventWatermarkImageMock).toHaveBeenCalledWith('event-123', 'stored-watermark.png');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin/events/event-123');
  });
});
