import { randomUUID } from 'node:crypto';

import { prisma } from '@/lib/db';
import { createInvitationToken } from '@/modules/invitations/invitation-token-service';
import { createEmailClient } from '@/modules/notifications/email-client';

export async function issueInvitation(eventId: string, guestId: string, appUrl: string, secret: string) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      event: true,
      invitation: true,
    },
  });

  if (!guest || guest.eventId !== eventId) {
    throw new Error('Guest not found for event');
  }

  const token = await createInvitationToken(
    { guestId: guest.id, eventId: guest.eventId, nonce: randomUUID() },
    secret,
  );

  const invitation = await prisma.invitation.upsert({
    where: { guestId: guest.id },
    update: {
      token,
      sentAt: new Date(),
    },
    create: {
      guestId: guest.id,
      eventId: guest.eventId,
      token,
      sentAt: new Date(),
    },
  });

  const inviteUrl = `${appUrl.replace(/\/$/, '')}/i/${encodeURIComponent(token)}`;
  const transport = createEmailClient();

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: guest.email,
    subject: `You're invited: ${guest.event.title}`,
    text: [
      `Hello ${guest.name},`,
      '',
      `You're invited to ${guest.event.title}.`,
      guest.event.location ? `Location: ${guest.event.location}` : '',
      guest.event.startsAt ? `When: ${guest.event.startsAt.toISOString()}` : '',
      '',
      `RSVP here: ${inviteUrl}`,
    ].filter(Boolean).join('\n'),
  });

  return { invitation, inviteUrl };
}

export async function getInvitationView(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      event: true,
      guest: {
        include: {
          rsvp: true,
        },
      },
    },
  });
}
