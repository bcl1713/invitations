import { getHostSession } from '@/lib/host-session';
import { deleteUploadedImageIfUnused, saveUploadedImage } from '@/modules/assets/local-asset-storage';
import { replaceEventAssetImage } from '@/modules/events/event-service';

export async function POST(
  request: Request,
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
  const formData = await request.formData();
  const file = formData.get('emblemImage');

  if (file instanceof File && file.size > 0) {
    const storedFileName = await saveUploadedImage(file);
    const { previousAssetPath } = await replaceEventAssetImage(eventId, 'emblemImagePath', storedFileName);
    await deleteUploadedImageIfUnused(previousAssetPath);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/admin/events/${eventId}`,
    },
  });
}
