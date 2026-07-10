import { createInvitationToken, verifyInvitationToken } from '@/modules/invitations/invitation-token-service';

describe('invitation token service', () => {
  it('creates and verifies a signed invitation token', async () => {
    const token = await createInvitationToken(
      { guestId: 'guest-1', eventId: 'event-1' },
      'test-secret',
    );

    await expect(verifyInvitationToken(token, 'test-secret')).resolves.toMatchObject({
      guestId: 'guest-1',
      eventId: 'event-1',
    });
  });
});
