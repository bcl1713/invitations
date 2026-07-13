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
    expect(invitationUpsertMock).toHaveBeenCalledWith({
      where: { guestId: 'guest-1' },
      update: {
        token: 'invite-token-123',
        sentAt: expect.any(Date),
      },
      create: {
        guestId: 'guest-1',
        eventId: 'event-1',
        token: 'invite-token-123',
        sentAt: expect.any(Date),
      },
    });
    expect(sendMailMock.mock.invocationCallOrder[0]).toBeLessThan(
      invitationUpsertMock.mock.invocationCallOrder[0],
    );
  });

  it('does not create an invitation when the first delivery fails', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      issueInvitation('event-1', 'guest-1', 'https://invites.example.com', 'secret-value'),
    ).rejects.toThrow('SMTP unavailable');

    expect(invitationUpsertMock).not.toHaveBeenCalled();
  });

  it('replaces the token and sent time on resend and emails the fresh URL', async () => {
    const firstSentAt = new Date('2026-07-01T12:00:00.000Z');
    const secondSentAt = new Date('2026-07-02T12:00:00.000Z');
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
      invitation: {
        id: 'invitation-1',
        token: 'first-token',
        sentAt: firstSentAt,
      },
    });
    createInvitationTokenMock
      .mockResolvedValueOnce('first-token')
      .mockResolvedValueOnce('fresh-token');
    invitationUpsertMock
      .mockResolvedValueOnce({ id: 'invitation-1', token: 'first-token', sentAt: firstSentAt })
      .mockResolvedValueOnce({ id: 'invitation-1', token: 'fresh-token', sentAt: secondSentAt });

    vi.useFakeTimers();
    try {
      vi.setSystemTime(firstSentAt);
      await issueInvitation('event-1', 'guest-1', 'https://invites.example.com', 'secret-value');
      vi.setSystemTime(secondSentAt);
      await issueInvitation('event-1', 'guest-1', 'https://invites.example.com', 'secret-value');
    } finally {
      vi.useRealTimers();
    }

    expect(sendMailMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        text: expect.stringContaining('RSVP: https://invites.example.com/i/fresh-token'),
        html: expect.stringContaining('https://invites.example.com/i/fresh-token'),
      }),
    );
    expect(sendMailMock.mock.calls[1][0].text).not.toContain('first-token');
    expect(invitationUpsertMock).toHaveBeenNthCalledWith(2, {
      where: { guestId: 'guest-1' },
      update: {
        token: 'fresh-token',
        sentAt: secondSentAt,
      },
      create: {
        guestId: 'guest-1',
        eventId: 'event-1',
        token: 'fresh-token',
        sentAt: secondSentAt,
      },
    });
    expect(secondSentAt.getTime()).toBeGreaterThan(firstSentAt.getTime());
  });

  it('preserves the previous invitation when a resend delivery fails', async () => {
    guestFindUniqueMock.mockResolvedValueOnce({
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
      invitation: {
        id: 'invitation-1',
        token: 'previous-token',
        sentAt: new Date('2026-07-01T12:00:00.000Z'),
      },
    });
    sendMailMock.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      issueInvitation('event-1', 'guest-1', 'https://invites.example.com', 'secret-value'),
    ).rejects.toThrow('SMTP unavailable');

    expect(invitationUpsertMock).not.toHaveBeenCalled();
  });
});
