import { summarizeGuestStatuses } from '@/modules/events/event-dashboard-service';

describe('summarizeGuestStatuses', () => {
  it('counts invitation delivery and rsvp statuses', () => {
    const summary = summarizeGuestStatuses([
      { invitationSent: true, status: 'GOING' },
      { invitationSent: true, status: 'MAYBE' },
      { invitationSent: false, status: null },
      { invitationSent: true, status: 'DECLINED' },
    ]);

    expect(summary).toEqual({
      totalGuests: 4,
      draftInvites: 1,
      sentInvites: 3,
      respondedCount: 3,
      goingCount: 1,
      maybeCount: 1,
      declinedCount: 1,
      noResponseCount: 1,
    });
  });
});
