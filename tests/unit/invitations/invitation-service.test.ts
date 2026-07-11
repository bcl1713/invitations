import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  guestFindUniqueMock,
  invitationUpsertMock,
  createInvitationTokenMock,
  sendMailMock,
} = vi.hoisted(() => ({
  guestFindUniqueMock: vi.fn(),
  invitationUpsertMock: vi.fn(),
  createInvitationTokenMock: vi.fn(),
  sendMailMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    guest: {
      findUnique: guestFindUniqueMock,
    },
    invitation: {
      upsert: invitationUpsertMock,
    },
  },
}));

vi.mock('@/modules/invitations/invitation-token-service', () => ({
  createInvitationToken: createInvitationTokenMock,
}));

vi.mock('@/modules/notifications/email-client', () => ({
  createEmailClient: () => ({
    sendMail: sendMailMock,
  }),
}));

import { issueInvitation } from '@/modules/invitations/invitation-service';

describe('issueInvitation', () => {
  beforeEach(() => {
    guestFindUniqueMock.mockReset();
    invitationUpsertMock.mockReset();
    createInvitationTokenMock.mockReset();
    sendMailMock.mockReset();

    guestFindUniqueMock.mockResolvedValue({
      id: 'guest-1',
      eventId: 'event-1',
      name: 'Major Chen',
      email: 'major.chen@example.com',
      canBringPlusOne: true,
      event: {
        title: 'Officer Evening Reception',
        hostName: 'Colonel Hayes',
        location: 'Joint Base Andrews Officers Club',
        description: 'Join us for a formal reception honouring the promotion.',
        startsAt: new Date('2026-08-20T18:30:00.000Z'),
        templateKey: 'ceremonial',
        heroImagePath: 'hero.jpg',
        emblemImagePath: 'emblem.png',
        watermarkImagePath: 'watermark.png',
      },
      invitation: null,
    });
    createInvitationTokenMock.mockResolvedValue('invite-token-123');
    invitationUpsertMock.mockResolvedValue({ id: 'invitation-1', token: 'invite-token-123' });
    sendMailMock.mockResolvedValue(undefined);
    process.env.EMAIL_FROM = 'invites@example.com';
  });

  it('sends themed html and plaintext invitation email', async () => {
    await issueInvitation('event-1', 'guest-1', 'https://invites.example.com', 'secret-value');

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'invites@example.com',
        to: 'major.chen@example.com',
        subject: 'You are invited: Officer Evening Reception',
        text: expect.stringContaining('RSVP: https://invites.example.com/i/invite-token-123'),
        html: expect.stringContaining('https://invites.example.com/media/emblem.png'),
      }),
    );
  });
});
