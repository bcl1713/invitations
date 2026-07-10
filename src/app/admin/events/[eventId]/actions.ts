'use server';

import { revalidatePath } from 'next/cache';

import { getEnv } from '@/lib/env';
import { requireHostSession } from '@/lib/host-session';
import { saveUploadedImage } from '@/modules/assets/local-asset-storage';
import { setEventHeroImage } from '@/modules/events/event-service';
import { addGuest } from '@/modules/guests/guest-service';
import { issueInvitation } from '@/modules/invitations/invitation-service';

export async function addGuestAction(eventId: string, formData: FormData) {
  await requireHostSession();
  const env = getEnv();

  const guest = await addGuest({
    eventId,
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    note: String(formData.get('note') ?? ''),
    canBringPlusOne: formData.get('canBringPlusOne') === 'on',
  });

  if (formData.get('sendNow') === 'on') {
    await issueInvitation(eventId, guest.id, env.APP_URL, env.APP_SECRET);
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function sendInviteAction(eventId: string, guestId: string) {
  await requireHostSession();
  const env = getEnv();
  await issueInvitation(eventId, guestId, env.APP_URL, env.APP_SECRET);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function uploadHeroAction(eventId: string, formData: FormData) {
  await requireHostSession();
  const file = formData.get('heroImage');

  if (!(file instanceof File) || file.size === 0) {
    return;
  }

  const storedFileName = await saveUploadedImage(file);
  await setEventHeroImage(eventId, storedFileName);
  revalidatePath(`/admin/events/${eventId}`);
}
