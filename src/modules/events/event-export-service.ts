import { prisma } from '@/lib/db';
import { formatEventDateTime, normalizeEventTimeZone } from '@/modules/events/event-time';

function formatCsvCell(value: string) {
  if (/[\n",]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString() : '';
}

function formatInviteStatus(sentAt: Date | null | undefined) {
  return sentAt ? 'sent' : 'draft';
}

export async function exportEventCsv(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      slug: true,
      title: true,
      startsAt: true,
      timeZone: true,
      guests: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
          note: true,
          canBringPlusOne: true,
          invitation: {
            select: {
              sentAt: true,
            },
          },
          rsvp: {
            select: {
              status: true,
              headcount: true,
              note: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const header = [
    'event_start_time',
    'event_time_zone',
    'guest_name',
    'guest_email',
    'guest_note',
    'plus_one_allowed',
    'invite_status',
    'invite_sent_at',
    'rsvp_status',
    'rsvp_headcount',
    'rsvp_note',
    'rsvp_updated_at',
  ];

  const rows = event.guests.map((guest) => {
    const values = [
      event.startsAt ? formatEventDateTime(event.startsAt, event.timeZone) : '',
      normalizeEventTimeZone(event.timeZone),
      guest.name,
      guest.email,
      guest.note,
      guest.canBringPlusOne ? 'yes' : 'no',
      formatInviteStatus(guest.invitation?.sentAt),
      formatDate(guest.invitation?.sentAt),
      guest.rsvp?.status ?? '',
      guest.rsvp?.headcount != null ? String(guest.rsvp.headcount) : '',
      guest.rsvp?.note ?? '',
      formatDate(guest.rsvp?.updatedAt),
    ];

    return values.map((value) => formatCsvCell(value)).join(',');
  });

  return {
    fileName: `${event.slug}-guests.csv`,
    csv: [header.join(','), ...rows].join('\n'),
  };
}
