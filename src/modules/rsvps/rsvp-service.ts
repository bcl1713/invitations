import { prisma } from '@/lib/db';

export async function submitRsvp(input: {
  eventId: string;
  guestId: string;
  status: 'GOING' | 'MAYBE' | 'DECLINED';
  note: string;
  headcount: number;
}) {
  return prisma.rsvp.upsert({
    where: { guestId: input.guestId },
    update: {
      status: input.status,
      note: input.note.trim(),
      headcount: input.headcount,
    },
    create: {
      eventId: input.eventId,
      guestId: input.guestId,
      status: input.status,
      note: input.note.trim(),
      headcount: input.headcount,
    },
  });
}
