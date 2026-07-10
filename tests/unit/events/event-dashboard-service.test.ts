import { summarizeGuestStatuses } from '@/modules/events/event-dashboard-service';

describe('summarizeGuestStatuses', () => {
  it('counts invitations and rsvp statuses', () => {
    const summary = summarizeGuestStatuses([
      { invitationSent: true, status: 'GOING' },
      { invitationSent: true, status: 'MAYBE' },
      { invitationSent: false, status: null },
      { invitationSent: true, status: 'DECLINED' },
    ]);

    expect(summary).toEqual({
      totalGuests: 4,
      invitesSent: 3,
      goingCount: 1,
      maybeCount: 1,
      declinedCount: 1,
      noResponseCount: 1,
    });
  });
});
