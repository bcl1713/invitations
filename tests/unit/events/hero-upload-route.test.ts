import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  getHostSessionMock,
  saveUploadedImageMock,
  setEventHeroImageMock,
} = vi.hoisted(() => ({
  getHostSessionMock: vi.fn(),
  saveUploadedImageMock: vi.fn(),
  setEventHeroImageMock: vi.fn(),
}));

vi.mock('@/lib/host-session', () => ({
  getHostSession: getHostSessionMock,
}));

vi.mock('@/modules/assets/local-asset-storage', () => ({
  saveUploadedImage: saveUploadedImageMock,
}));

vi.mock('@/modules/events/event-service', () => ({
  setEventHeroImage: setEventHeroImageMock,
}));

import { POST } from '@/app/api/admin/events/[eventId]/hero/route';

function makeUploadForm(file: File) {
  const formData = new FormData();
  formData.set('heroImage', file);
  return formData;
}

describe('hero upload route', () => {
  beforeEach(() => {
    getHostSessionMock.mockReset();
    saveUploadedImageMock.mockReset();
    setEventHeroImageMock.mockReset();
  });

  it('stores a multipart hero image upload and redirects back to the event dashboard', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    saveUploadedImageMock.mockResolvedValue('stored-image.jpg');

    const file = new File([new Uint8Array(3 * 1024 * 1024)], 'hero.jpg', { type: 'image/jpeg' });
    const request = {
      url: 'http://localhost/api/admin/events/event-123/hero',
      formData: vi.fn().mockResolvedValue(makeUploadForm(file)),
    } as unknown as Request;

    const response = await POST(request, {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(saveUploadedImageMock).toHaveBeenCalledTimes(1);
    expect(saveUploadedImageMock.mock.calls[0]?.[0]).toBeInstanceOf(File);
    expect(setEventHeroImageMock).toHaveBeenCalledWith('event-123', 'stored-image.jpg');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://localhost/admin/events/event-123');
  });
});
