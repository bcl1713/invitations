'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { clearHostSession, requireHostSession } from '@/lib/host-session';
import { createEvent } from '@/modules/events/event-service';

export async function createEventAction(formData: FormData) {
  await requireHostSession();

  const event = await createEvent({
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    location: String(formData.get('location') ?? ''),
    hostName: String(formData.get('hostName') ?? ''),
    startsAt: formData.get('startsAt') ? new Date(String(formData.get('startsAt'))) : null,
  });

  revalidatePath('/admin');
  redirect(`/admin/events/${event.id}`);
}

export async function logoutAction() {
  await clearHostSession();
  redirect('/login');
}
