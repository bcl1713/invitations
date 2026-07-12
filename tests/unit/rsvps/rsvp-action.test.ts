import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getInvitationViewMock,
  redirectMock,
  submitRsvpMock,
  RsvpValidationErrorMock,
} = vi.hoisted(() => ({
  getInvitationViewMock: vi.fn(),
  redirectMock: vi.fn(),
  submitRsvpMock: vi.fn(),
  RsvpValidationErrorMock: class RsvpValidationError extends Error {},
}));

vi.mock('next/navigation', () => ({ redirect: redirectMock }));
vi.mock('@/modules/invitations/invitation-service', () => ({
  getInvitationView: getInvitationViewMock,
}));
vi.mock('@/modules/rsvps/rsvp-service', () => ({
  RsvpValidationError: RsvpValidationErrorMock,
  submitRsvp: submitRsvpMock,
}));

import { submitRsvpAction } from '@/app/i/[token]/actions';

describe('submitRsvpAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInvitationViewMock.mockResolvedValue({ eventId: 'event-1', guestId: 'guest-1' });
    redirectMock.mockImplementation((location: string) => {
      throw new Error(`redirect:${location}`);
    });
  });

  it('returns a user-safe response when a forged RSVP is rejected', async () => {
    submitRsvpMock.mockRejectedValue(new RsvpValidationErrorMock('Invalid RSVP submission'));
    const formData = new FormData();
    formData.set('status', 'NOT_A_STATUS');
    formData.set('headcount', '999999');
    formData.set('note', 'forged value');

    await expect(submitRsvpAction('valid-token', formData)).rejects.toThrow(
      'redirect:/i/valid-token?error=1',
    );

    expect(submitRsvpMock).toHaveBeenCalledWith({
      eventId: 'event-1',
      guestId: 'guest-1',
      status: 'NOT_A_STATUS',
      headcount: '999999',
      note: 'forged value',
    });
  });
});
