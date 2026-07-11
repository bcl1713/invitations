import { NextResponse } from 'next/server';

import { getHostSession } from '@/lib/host-session';
import { saveUploadedImage } from '@/modules/assets/local-asset-storage';
import { setEventHeroImage } from '@/modules/events/event-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await getHostSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  const { eventId } = await params;
  const formData = await request.formData();
  const file = formData.get('heroImage');

  if (file instanceof File && file.size > 0) {
    const storedFileName = await saveUploadedImage(file);
    await setEventHeroImage(eventId, storedFileName);
  }

  return NextResponse.redirect(new URL(`/admin/events/${eventId}`, request.url), 303);
}
