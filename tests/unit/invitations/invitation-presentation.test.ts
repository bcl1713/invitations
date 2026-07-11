import { describe, expect, it } from 'vitest';

import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';

describe('buildInvitationPresentation', () => {
  it('builds shared invitation copy, asset URLs, and editable field metadata', () => {
    const presentation = buildInvitationPresentation({
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

    expect(presentation.theme.pageClassName).toBe('invitation-theme-ceremonial');
    expect(presentation.whenText).toContain('Thursday');
    expect(presentation.whereText).toBe('Joint Base Andrews Officers Club');
    expect(presentation.inviteUrl).toBe('https://invites.example.com/i/token-123');
    expect(presentation.assetUrls).toEqual({
      hero: 'https://invites.example.com/media/hero.jpg',
      emblem: 'https://invites.example.com/media/emblem.png',
      watermark: 'https://invites.example.com/media/watermark.png',
    });
    expect(presentation.editableFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'title', label: 'Title', kind: 'text' }),
        expect.objectContaining({ key: 'emblemImagePath', label: 'Event emblem', kind: 'image' }),
        expect.objectContaining({ key: 'watermarkImagePath', label: 'Watermark', kind: 'image' }),
      ]),
    );
    expect(presentation.emailIntro).toContain('cordially invited');
    expect(presentation.rsvpHeading).toBe('Kindly respond');
  });

  it('falls back gracefully when optional event fields are missing', () => {
    const presentation = buildInvitationPresentation({
      appUrl: 'https://invites.example.com',
      inviteUrl: 'https://invites.example.com/i/token-456',
      event: {
        title: 'Untitled Gathering',
        hostName: '',
        location: '',
        description: '',
        startsAt: null,
        templateKey: 'classic',
        heroImagePath: null,
        emblemImagePath: null,
        watermarkImagePath: null,
      },
      guest: {
        name: 'Guest',
        canBringPlusOne: false,
      },
    });

    expect(presentation.hostName).toBe('Your host');
    expect(presentation.whenText).toBe('A start time will be shared soon.');
    expect(presentation.whereText).toBe('Location details will be shared soon.');
    expect(presentation.description).toBe('We would be delighted to celebrate with you. More event details are on the way.');
    expect(presentation.assetUrls).toEqual({
      hero: null,
      emblem: null,
      watermark: null,
    });
  });
});
