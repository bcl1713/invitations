'use server';

import { redirect } from 'next/navigation';

import { getInvitationView } from '@/modules/invitations/invitation-service';
import { submitRsvp } from '@/modules/rsvps/rsvp-service';

export async function submitRsvpAction(token: string, formData: FormData) {
  const invitation = await getInvitationView(token);
  if (!invitation) {
    redirect('/');
  }

  await submitRsvp({
    eventId: invitation.eventId,
    guestId: invitation.guestId,
    status: String(formData.get('status') ?? 'MAYBE') as 'GOING' | 'MAYBE' | 'DECLINED',
    note: String(formData.get('note') ?? ''),
    headcount: Number(formData.get('headcount') ?? 1),
  });

  redirect(`/i/${encodeURIComponent(token)}?saved=1`);
}
