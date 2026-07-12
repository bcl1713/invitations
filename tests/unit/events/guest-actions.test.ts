import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireHostSessionMock, updateGuestMock, revalidatePathMock } = vi.hoisted(() => ({
  requireHostSessionMock: vi.fn(),
  updateGuestMock: vi.fn(),
  revalidatePathMock: vi.fn(),
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
  saveUploadedImage: vi.fn(),
}));

vi.mock('@/modules/events/event-service', () => ({
  setEventHeroImage: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock('@/modules/guests/guest-service', () => ({
  addGuest: vi.fn(),
  updateGuest: updateGuestMock,
}));

vi.mock('@/modules/invitations/invitation-service', () => ({
  issueInvitation: vi.fn(),
}));

vi.mock('@/modules/templates/template-catalog', () => ({
  normalizeTemplateKey: vi.fn(),
}));

import { updateGuestAction } from '@/app/admin/events/[eventId]/actions';

function guestFormData() {
  const formData = new FormData();
  formData.set('name', 'Jamie Guest');
  formData.set('email', 'jamie@example.com');
  formData.set('note', 'Needs ramp access');
  return formData;
}

describe('updateGuestAction', () => {
  beforeEach(() => {
    requireHostSessionMock.mockReset();
    updateGuestMock.mockReset();
    revalidatePathMock.mockReset();
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
