'use server';

import { redirect } from 'next/navigation';

import { getInvitationView } from '@/modules/invitations/invitation-service';
import { RsvpValidationError, submitRsvp } from '@/modules/rsvps/rsvp-service';

export async function submitRsvpAction(token: string, formData: FormData) {
  const invitation = await getInvitationView(token);
  if (!invitation) {
    redirect('/');
  }

  try {
    await submitRsvp({
      eventId: invitation.eventId,
      guestId: invitation.guestId,
      status: formData.get('status'),
      note: formData.get('note'),
      headcount: formData.get('headcount'),
    });
  } catch (error) {
    if (error instanceof RsvpValidationError) {
      redirect(`/i/${encodeURIComponent(token)}?error=1`);
    }

    throw error;
  }

  redirect(`/i/${encodeURIComponent(token)}?saved=1`);
}
