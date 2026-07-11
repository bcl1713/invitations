'use server';

import { revalidatePath } from 'next/cache';

import { getEnv } from '@/lib/env';
import { requireHostSession } from '@/lib/host-session';
import { saveUploadedImage } from '@/modules/assets/local-asset-storage';
import { setEventHeroImage, updateEvent } from '@/modules/events/event-service';
import { addGuest, updateGuest } from '@/modules/guests/guest-service';
import { issueInvitation } from '@/modules/invitations/invitation-service';
import { normalizeTemplateKey } from '@/modules/templates/template-catalog';

function parseDateTimeLocalInput(value: FormDataEntryValue | null) {
  const normalizedValue = String(value ?? '').trim();

  if (normalizedValue === '') {
    return null;
  }

  const startsAt = new Date(normalizedValue);

  if (Number.isNaN(startsAt.getTime())) {
    throw new Error('Invalid start time');
  }

  return startsAt;
}

export async function updateEventAction(eventId: string, formData: FormData) {
  await requireHostSession();

  await updateEvent(eventId, {
    title: String(formData.get('title') ?? ''),
    hostName: String(formData.get('hostName') ?? ''),
    location: String(formData.get('location') ?? ''),
    startsAt: parseDateTimeLocalInput(formData.get('startsAt')),
    description: String(formData.get('description') ?? ''),
    templateKey: normalizeTemplateKey(String(formData.get('templateKey') ?? '')),
  });

  revalidatePath(`/admin/events/${eventId}`);
}

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

export async function updateGuestAction(eventId: string, guestId: string, formData: FormData) {
  await requireHostSession();

  await updateGuest(guestId, {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    note: String(formData.get('note') ?? ''),
    canBringPlusOne: formData.get('canBringPlusOne') === 'on',
  });

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
