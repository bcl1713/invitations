import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireHostSessionMock,
  deleteGuestMock,
  updateGuestMock,
  revalidatePathMock,
  saveUploadedImageMock,
  deleteUploadedImageIfUnusedMock,
  setEventHeroImageMock,
} = vi.hoisted(() => ({
  requireHostSessionMock: vi.fn(),
  deleteGuestMock: vi.fn(),
  updateGuestMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  saveUploadedImageMock: vi.fn(),
  deleteUploadedImageIfUnusedMock: vi.fn(),
  setEventHeroImageMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(),
}));

vi.mock('@/lib/host-session', () => ({
  requireHostSession: requireHostSessionMock,
}));

vi.mock('@/modules/assets/local-asset-storage', () => ({
  saveUploadedImage: saveUploadedImageMock,
  deleteUploadedImageIfUnused: deleteUploadedImageIfUnusedMock,
}));

vi.mock('@/modules/events/event-service', () => ({
  setEventHeroImage: setEventHeroImageMock,
  updateEvent: vi.fn(),
}));

vi.mock('@/modules/guests/guest-service', () => ({
  addGuest: vi.fn(),
  deleteGuest: deleteGuestMock,
  updateGuest: updateGuestMock,
}));

vi.mock('@/modules/invitations/invitation-service', () => ({
  issueInvitation: vi.fn(),
}));

vi.mock('@/modules/templates/template-catalog', () => ({
  normalizeTemplateKey: vi.fn(),
}));

import { deleteGuestAction, updateGuestAction, uploadHeroAction } from '@/app/admin/events/[eventId]/actions';

function guestFormData() {
  const formData = new FormData();
  formData.set('name', 'Jamie Guest');
  formData.set('email', 'jamie@example.com');
  formData.set('note', 'Needs ramp access');
  return formData;
}

describe('deleteGuestAction', () => {
  beforeEach(() => {
    requireHostSessionMock.mockReset();
    deleteGuestMock.mockReset();
    revalidatePathMock.mockReset();
    requireHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
  });

  it('requires the host session, deletes the event-scoped guest, and revalidates once', async () => {
    deleteGuestMock.mockResolvedValue({ count: 1 });

    await expect(deleteGuestAction('event-1', 'guest-1')).resolves.toBeUndefined();

    expect(requireHostSessionMock).toHaveBeenCalledOnce();
    expect(deleteGuestMock).toHaveBeenCalledWith('event-1', 'guest-1');
    expect(revalidatePathMock).toHaveBeenCalledExactlyOnceWith('/admin/events/event-1');
  });

  it('rejects a guest that is not in the event without revalidating', async () => {
    deleteGuestMock.mockResolvedValue({ count: 0 });

    await expect(deleteGuestAction('event-1', 'guest-from-event-2')).rejects.toThrow('Guest not found for event');

    expect(deleteGuestMock).toHaveBeenCalledWith('event-1', 'guest-from-event-2');
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe('updateGuestAction', () => {
  beforeEach(() => {
    requireHostSessionMock.mockReset();
    updateGuestMock.mockReset();
    revalidatePathMock.mockReset();
    saveUploadedImageMock.mockReset();
    deleteUploadedImageIfUnusedMock.mockReset();
    setEventHeroImageMock.mockReset();
    requireHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
  });

  it('updates a guest belonging to the requested event', async () => {
    updateGuestMock.mockResolvedValue({ count: 1 });

    await expect(updateGuestAction('event-1', 'guest-1', guestFormData())).resolves.toBeUndefined();

    expect(updateGuestMock).toHaveBeenCalledWith('event-1', 'guest-1', {
      name: 'Jamie Guest',
      email: 'jamie@example.com',
      note: 'Needs ramp access',
      canBringPlusOne: false,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/events/event-1');
  });

  it('rejects a guest from a different event without revalidating', async () => {
    updateGuestMock.mockResolvedValue({ count: 0 });

    await expect(updateGuestAction('event-1', 'guest-from-event-2', guestFormData())).rejects.toThrow(
      'Guest not found for event',
    );

    expect(updateGuestMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe('uploadHeroAction', () => {
  beforeEach(() => {
    requireHostSessionMock.mockReset();
    revalidatePathMock.mockReset();
    saveUploadedImageMock.mockReset();
    deleteUploadedImageIfUnusedMock.mockReset();
    setEventHeroImageMock.mockReset();
    requireHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
  });

  it('removes the stored image when the event update fails', async () => {
    saveUploadedImageMock.mockResolvedValue('stored-hero.png');
    setEventHeroImageMock.mockRejectedValue(new Error('Event not found'));
    const formData = new FormData();
    formData.set('heroImage', new File([new Uint8Array(128)], 'hero.png', { type: 'image/png' }));

    await expect(uploadHeroAction('missing-event', formData)).rejects.toThrow('Event not found');

    expect(setEventHeroImageMock).toHaveBeenCalledWith('missing-event', 'stored-hero.png');
    expect(deleteUploadedImageIfUnusedMock).toHaveBeenCalledWith('stored-hero.png');
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
