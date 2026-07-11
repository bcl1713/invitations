import { getHostSession } from '@/lib/host-session';
import { exportEventCsv } from '@/modules/events/event-export-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await getHostSession();

  if (!session) {
    return new Response(null, {
      status: 303,
      headers: {
        location: '/login',
      },
    });
  }

  const { eventId } = await params;

  try {
    const result = await exportEventCsv(eventId);

    return new Response(result.csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Event not found') {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    throw error;
  }
}
