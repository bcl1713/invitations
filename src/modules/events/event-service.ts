import { prisma } from '@/lib/db';
import { summarizeGuestStatuses } from '@/modules/events/event-dashboard-service';
import { slugifyEventTitle } from '@/modules/events/slugify';

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  hostName: string;
  startsAt?: Date | null;
}

export async function createEvent(input: CreateEventInput) {
  const slugBase = slugifyEventTitle(input.title);
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

  return prisma.event.create({
    data: {
      title: input.title.trim(),
      slug,
      description: input.description.trim(),
      location: input.location.trim(),
      hostName: input.hostName.trim(),
      startsAt: input.startsAt ?? null,
    },
  });
}

export async function listEvents() {
  return prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          guests: true,
        },
      },
    },
  });
}

export async function getEventDashboard(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      guests: {
        include: {
          invitation: true,
          rsvp: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!event) {
    return null;
  }

  const summary = summarizeGuestStatuses(
    event.guests.map((guest) => ({
      invitationSent: Boolean(guest.invitation?.sentAt),
      status: guest.rsvp?.status ?? null,
    })),
  );

  return { event, summary };
}

export async function setEventHeroImage(eventId: string, heroImagePath: string) {
  return prisma.event.update({
    where: { id: eventId },
    data: { heroImagePath },
  });
}
