import { getHostSession } from '@/lib/host-session';
import { deleteUploadedImageIfUnused } from '@/modules/assets/local-asset-storage';
import { clearEventAssetImage } from '@/modules/events/event-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await getHostSession();

  if (!session) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/login',
      },
    });
  }

  const { eventId } = await params;
  const { previousAssetPath } = await clearEventAssetImage(eventId, 'heroImagePath');
  await deleteUploadedImageIfUnused(previousAssetPath);

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/admin/events/${eventId}`,
    },
  });
}
