import { prisma } from '@/lib/db';
import { summarizeGuestStatuses } from '@/modules/events/event-dashboard-service';
import { slugifyEventTitle } from '@/modules/events/slugify';
import { DEFAULT_TEMPLATE_KEY, normalizeTemplateKey } from '@/modules/templates/template-catalog';

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  hostName: string;
  startsAt?: Date | null;
}

export interface UpdateEventInput {
  title: string;
  description: string;
  location: string;
  hostName: string;
  startsAt?: Date | string | null;
  templateKey?: string | null;
}

function normalizeEventString(value: string) {
  return value.trim();
}

function normalizeStartsAt(value: Date | string | null | undefined) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return Number.isNaN(value.getTime()) ? null : value;
}

export async function createEvent(input: CreateEventInput) {
  const slugBase = slugifyEventTitle(input.title);
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

  return prisma.event.create({
    data: {
      title: normalizeEventString(input.title),
      slug,
      description: normalizeEventString(input.description),
      location: normalizeEventString(input.location),
      hostName: normalizeEventString(input.hostName),
      startsAt: normalizeStartsAt(input.startsAt),
      templateKey: DEFAULT_TEMPLATE_KEY,
    },
  });
}

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      title: normalizeEventString(input.title),
      description: normalizeEventString(input.description),
      location: normalizeEventString(input.location),
      hostName: normalizeEventString(input.hostName),
      startsAt: normalizeStartsAt(input.startsAt),
      templateKey: normalizeTemplateKey(input.templateKey),
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
