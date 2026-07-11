import { prisma } from '@/lib/db';

export interface AddGuestInput {
  eventId: string;
  name: string;
  email: string;
  note?: string;
  canBringPlusOne?: boolean;
}

export interface UpdateGuestInput {
  name: string;
  email: string;
  note?: string;
  canBringPlusOne?: boolean;
}

function normalizeGuestName(value: string) {
  return value.trim();
}

function normalizeGuestEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeGuestNote(value: string | undefined) {
  return value?.trim() ?? '';
}

export async function addGuest(input: AddGuestInput) {
  return prisma.guest.create({
    data: {
      eventId: input.eventId,
      name: normalizeGuestName(input.name),
      email: normalizeGuestEmail(input.email),
      note: normalizeGuestNote(input.note),
      canBringPlusOne: input.canBringPlusOne ?? false,
    },
  });
}

export async function updateGuest(guestId: string, input: UpdateGuestInput) {
  return prisma.guest.update({
    where: { id: guestId },
    data: {
      name: normalizeGuestName(input.name),
      email: normalizeGuestEmail(input.email),
      note: normalizeGuestNote(input.note),
      canBringPlusOne: input.canBringPlusOne ?? false,
    },
  });
}
