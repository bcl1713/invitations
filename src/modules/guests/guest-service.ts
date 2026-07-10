import { prisma } from '@/lib/db';

export interface AddGuestInput {
  eventId: string;
  name: string;
  email: string;
  note?: string;
  canBringPlusOne?: boolean;
}

export async function addGuest(input: AddGuestInput) {
  return prisma.guest.create({
    data: {
      eventId: input.eventId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      note: input.note?.trim() ?? '',
      canBringPlusOne: input.canBringPlusOne ?? false,
    },
  });
}
