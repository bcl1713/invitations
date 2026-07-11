import { describe, expect, it } from 'vitest';

import { buildInvitationEmailHtml, buildInvitationEmailText } from '@/modules/invitations/invitation-email-template';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';

function makePresentation() {
  return buildInvitationPresentation({
    appUrl: 'https://invites.example.com',
    inviteUrl: 'https://invites.example.com/i/token-123',
    event: {
      title: 'Officer Evening Reception',
      hostName: 'Colonel Hayes',
      location: 'Joint Base Andrews Officers Club',
      description: 'Join us for a formal reception honouring the promotion.',
      startsAt: '2026-08-20T18:30:00.000Z',
      templateKey: 'ceremonial',
      heroImagePath: 'hero.jpg',
      emblemImagePath: 'emblem.png',
      watermarkImagePath: 'watermark.png',
    },
    guest: {
      name: 'Major Chen',
      canBringPlusOne: true,
    },
  });
}

describe('invitation email template', () => {
  it('renders themed html that mirrors the invitation presentation', () => {
    const html = buildInvitationEmailHtml(makePresentation());

    expect(html).toContain('Officer Evening Reception');
    expect(html).toContain('Colonel Hayes');
    expect(html).toContain('Kindly respond');
    expect(html).toContain('https://invites.example.com/i/token-123');
    expect(html).toContain('https://invites.example.com/media/emblem.png');
    expect(html).toContain('https://invites.example.com/media/watermark.png');
    expect(html).toContain('#4b5a3f');
  });

  it('renders plain text fallback with essential invitation details', () => {
    const text = buildInvitationEmailText(makePresentation());

    expect(text).toContain('Officer Evening Reception');
    expect(text).toContain('Hosted by Colonel Hayes');
    expect(text).toContain('Joint Base Andrews Officers Club');
    expect(text).toContain('RSVP: https://invites.example.com/i/token-123');
  });
});
