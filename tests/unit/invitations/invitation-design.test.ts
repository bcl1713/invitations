import { describe, expect, it } from 'vitest';

import {
  createDefaultInvitationDesign,
  normalizeInvitationDesign,
} from '@/modules/invitations/invitation-design';

describe('invitation design normalization', () => {
  const source = {
    eyebrow: 'You are cordially invited',
    introTitle: 'A formal reception awaits',
    title: 'Lieutenant Colonel Promotion Ceremony',
    hostName: 'Aaron Trimble',
    guestName: 'Brian Lucas',
    whenText: 'Friday, July 24, 2026 at 5:00 PM',
    whereText: 'Kros Stain Brewery',
    aboutHeading: 'About this event',
    description: 'Join us to celebrate.',
    rsvpHeading: 'Kindly respond',
    rsvpIntro: 'Please let your host know if you can make it.',
  };

  it('creates a fixed portrait postcard design with editable defaults', () => {
    const design = createDefaultInvitationDesign(source);

    expect(design.aspectRatio).toBe('2:3');
    expect(design.content.title).toBe(source.title);
    expect(design.content.hostLine).toBe('Hosted by Aaron Trimble');
    expect(design.typography.title.fontSize).toBeGreaterThan(design.typography.description.fontSize);
  });

  it('preserves valid overrides and rejects unsafe typography values', () => {
    const design = normalizeInvitationDesign({
      content: { title: 'Edited title', whereValue: 'Edited location' },
      typography: {
        title: { fontFamily: 'mono', fontSize: 44 },
        description: { fontFamily: 'unknown', fontSize: 999 },
      },
    }, source);

    expect(design.content.title).toBe('Edited title');
    expect(design.content.whereValue).toBe('Edited location');
    expect(design.typography.title).toMatchObject({ fontFamily: 'mono', fontSize: 44, fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center' });
    expect(design.typography.description.fontFamily).toBe('serif');
    expect(design.typography.description.fontSize).toBe(72);
  });
});
