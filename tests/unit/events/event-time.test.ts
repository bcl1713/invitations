import { describe, expect, it } from 'vitest';

import {
  formatEventDateTime,
  formatEventDateTimeLocal,
  parseEventDateTimeLocal,
} from '@/modules/events/event-time';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';

describe('event time zone handling', () => {
  it('converts a host-entered local time to the correct instant and formats it independently of the server zone', () => {
    const startsAt = parseEventDateTimeLocal('2026-08-20T18:30', 'America/New_York');

    expect(startsAt?.toISOString()).toBe('2026-08-20T22:30:00.000Z');
    expect(formatEventDateTimeLocal(startsAt, 'America/New_York')).toBe('2026-08-20T18:30');
    expect(formatEventDateTime(startsAt, 'America/New_York')).toContain('6:30 PM');
    expect(formatEventDateTime(startsAt, 'UTC')).toContain('10:30 PM');
  });

  it('preserves the host wall-clock time across both DST offset changes', () => {
    expect(parseEventDateTimeLocal('2026-03-08T01:30', 'America/New_York')?.toISOString()).toBe('2026-03-08T06:30:00.000Z');
    expect(parseEventDateTimeLocal('2026-11-01T01:30', 'America/New_York')?.toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });

  it('rejects nonexistent local times during the spring DST transition', () => {
    expect(() => parseEventDateTimeLocal('2026-03-08T02:30', 'America/New_York')).toThrow('Invalid start time');
  });

  it('uses the event time zone for invitation text and design variables', () => {
    const presentation = buildInvitationPresentation({
      appUrl: 'https://invites.example.com',
      inviteUrl: 'https://invites.example.com/i/token-123',
      event: {
        title: 'Evening Reception',
        hostName: 'Colonel Hayes',
        location: 'Officers Club',
        description: 'Details',
        startsAt: '2026-08-20T22:30:00.000Z',
        timeZone: 'America/New_York',
        templateKey: 'classic',
        designConfig: { content: { whenValue: '%date at %time' } },
        heroImagePath: null,
        emblemImagePath: null,
        watermarkImagePath: null,
      },
      guest: { name: 'Major Chen', canBringPlusOne: false },
    });

    expect(presentation.whenText).toContain('6:30 PM');
    expect(presentation.design.content.whenValue).toContain('6:30 PM');
  });
});
