export type GuestStatusSummaryInput = {
  invitationSent: boolean;
  status: 'GOING' | 'MAYBE' | 'DECLINED' | null;
};

export function summarizeGuestStatuses(guests: GuestStatusSummaryInput[]) {
  return guests.reduce(
    (summary, guest) => {
      summary.totalGuests += 1;
      if (guest.invitationSent) {
        summary.sentInvites += 1;
      } else {
        summary.draftInvites += 1;
      }
      if (guest.status === null) {
        summary.noResponseCount += 1;
      } else {
        summary.respondedCount += 1;
        if (guest.status === 'GOING') {
          summary.goingCount += 1;
        } else if (guest.status === 'MAYBE') {
          summary.maybeCount += 1;
        } else if (guest.status === 'DECLINED') {
          summary.declinedCount += 1;
        }
      }
      return summary;
    },
    {
      totalGuests: 0,
      draftInvites: 0,
      sentInvites: 0,
      respondedCount: 0,
      goingCount: 0,
      maybeCount: 0,
      declinedCount: 0,
      noResponseCount: 0,
    },
  );
}
