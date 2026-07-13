'use server';

import { revalidatePath } from 'next/cache';

import { getEnv } from '@/lib/env';
import { requireHostSession } from '@/lib/host-session';
import { deleteUploadedImageIfUnused, saveUploadedImage } from '@/modules/assets/local-asset-storage';
import { getEventDashboard, setEventHeroImage, updateEvent } from '@/modules/events/event-service';
import { formatEventDateTime, parseEventDateTimeLocal } from '@/modules/events/event-time';
import { addGuest, deleteGuest, updateGuest } from '@/modules/guests/guest-service';
import { issueInvitation } from '@/modules/invitations/invitation-service';
import { normalizeTemplateKey } from '@/modules/templates/template-catalog';
import { getInvitationTemplateTheme } from '@/modules/templates/invitation-template-theme';
import type { InvitationDesign } from '@/modules/invitations/invitation-design';

function parseDesignConfig(value: FormDataEntryValue | null): InvitationDesign | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid invitation design');
    }
    return parsed as InvitationDesign;
  } catch {
    throw new Error('Invalid invitation design');
  }
}

export async function updateEventAction(eventId: string, formData: FormData) {
  await requireHostSession();

  const title = String(formData.get('title') ?? '');
  const hostName = String(formData.get('hostName') ?? '');
  const location = String(formData.get('location') ?? '');
  const description = String(formData.get('description') ?? '');
  const templateKey = normalizeTemplateKey(String(formData.get('templateKey') ?? ''));
  const timeZone = String(formData.get('timeZone') ?? '');
  const startsAt = parseEventDateTimeLocal(String(formData.get('startsAt') ?? ''), timeZone);
  const designConfig = parseDesignConfig(formData.get('designConfig'));
  const theme = getInvitationTemplateTheme(templateKey);
  const generatedDescription = 'We would be delighted to celebrate with you. More event details are on the way.';
  const existingEvent = await getEventDashboard(eventId);
  const existingDescription = existingEvent?.event.description ?? '';

  await updateEvent(eventId, {
    title,
    hostName,
    location,
    timeZone,
    startsAt,
    description,
    templateKey,
    designConfig: designConfig
      ? {
          ...designConfig,
          content: {
            ...designConfig.content,
            eyebrow: theme.eyebrow,
            introTitle: theme.introTitle,
            title,
            hostLine: `Hosted by ${hostName}`,
            whenValue: startsAt ? formatEventDateTime(startsAt, timeZone) : 'A start time will be shared soon.',
            whereValue: location || 'Location details will be shared soon.',
            description:
              designConfig.content?.description?.trim()
                && designConfig.content.description !== generatedDescription
                && designConfig.content.description !== existingDescription
                ? designConfig.content.description
                : description,
            rsvpHeading: theme.rsvpTitle,
          },
        }
      : undefined,
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

  const { count } = await updateGuest(eventId, guestId, {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    note: String(formData.get('note') ?? ''),
    canBringPlusOne: formData.get('canBringPlusOne') === 'on',
  });

  if (count === 0) {
    throw new Error('Guest not found for event');
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function deleteGuestAction(eventId: string, guestId: string) {
  await requireHostSession();

  const { count } = await deleteGuest(eventId, guestId);
  if (count === 0) {
    throw new Error('Guest not found for event');
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function uploadHeroAction(eventId: string, formData: FormData) {
  await requireHostSession();
  const file = formData.get('heroImage');

  if (!(file instanceof File) || file.size === 0) {
    return;
  }

  const storedFileName = await saveUploadedImage(file);

  try {
    await setEventHeroImage(eventId, storedFileName);
  } catch (error) {
    await deleteUploadedImageIfUnused(storedFileName);
    throw error;
  }

  revalidatePath(`/admin/events/${eventId}`);
}
