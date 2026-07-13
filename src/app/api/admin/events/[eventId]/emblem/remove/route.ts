import { getHostSession } from '@/lib/host-session';
import { retryEventAssetCleanup } from '@/modules/assets/event-asset-cleanup';
import { clearEventAssetImageAndScheduleCleanup } from '@/modules/events/event-service';

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
  await clearEventAssetImageAndScheduleCleanup(eventId, 'emblemImagePath');
  const { cleanupPending } = await retryEventAssetCleanup(eventId);

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/admin/events/${eventId}${cleanupPending ? '?assetCleanup=pending' : ''}`,
    },
  });
}
