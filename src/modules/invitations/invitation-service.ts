import { randomUUID } from 'node:crypto';

import { prisma } from '@/lib/db';
import { buildInvitationEmailHtml, buildInvitationEmailText } from '@/modules/invitations/invitation-email-template';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';
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
  const presentation = buildInvitationPresentation({
    appUrl,
    inviteUrl,
    event: {
      title: guest.event.title,
      hostName: guest.event.hostName,
      location: guest.event.location,
      description: guest.event.description,
      startsAt: guest.event.startsAt,
      templateKey: guest.event.templateKey,
      heroImagePath: guest.event.heroImagePath,
      emblemImagePath: guest.event.emblemImagePath,
      watermarkImagePath: guest.event.watermarkImagePath,
    },
    guest: {
      name: guest.name,
      canBringPlusOne: guest.canBringPlusOne,
    },
  });
  const transport = createEmailClient();

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: guest.email,
    subject: `You are invited: ${guest.event.title}`,
    text: buildInvitationEmailText(presentation),
    html: buildInvitationEmailHtml(presentation),
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
