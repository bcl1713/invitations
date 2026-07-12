import { prisma } from '@/lib/db';
import { z } from 'zod';

export const RSVP_NOTE_MAX_LENGTH = 1_000;

const rsvpInputSchema = z.object({
  status: z.enum(['GOING', 'MAYBE', 'DECLINED']),
  note: z.string().trim().max(RSVP_NOTE_MAX_LENGTH),
  headcount: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().finite().int()),
});

export class RsvpValidationError extends Error {
  constructor() {
    super('Invalid RSVP submission');
  }
}

export async function submitRsvp(input: {
  eventId: string;
  guestId: string;
  status: unknown;
  note: unknown;
  headcount: unknown;
}) {
  const guest = await prisma.guest.findUnique({
    where: { id: input.guestId },
    select: {
      eventId: true,
      canBringPlusOne: true,
    },
  });

  if (!guest || guest.eventId !== input.eventId) {
    throw new RsvpValidationError();
  }

  const parsed = rsvpInputSchema.safeParse(input);
  const maxHeadcount = guest.canBringPlusOne ? 2 : 1;

  if (!parsed.success || parsed.data.headcount < 1 || parsed.data.headcount > maxHeadcount) {
    throw new RsvpValidationError();
  }

  return prisma.rsvp.upsert({
    where: { guestId: input.guestId },
    update: {
      status: parsed.data.status,
      note: parsed.data.note,
      headcount: parsed.data.headcount,
    },
    create: {
      eventId: input.eventId,
      guestId: input.guestId,
      status: parsed.data.status,
      note: parsed.data.note,
      headcount: parsed.data.headcount,
    },
  });
}
