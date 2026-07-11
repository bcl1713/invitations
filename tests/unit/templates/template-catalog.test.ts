import { describe, expect, it } from 'vitest';

import { DEFAULT_TEMPLATE_KEY, normalizeTemplateKey } from '@/modules/templates/template-catalog';
import { getInvitationTemplateTheme } from '@/modules/templates/invitation-template-theme';

describe('template catalog', () => {
  it('falls back to the default template key for unknown values', () => {
    expect(normalizeTemplateKey('chaos-ballroom')).toBe(DEFAULT_TEMPLATE_KEY);
    expect(normalizeTemplateKey(undefined)).toBe(DEFAULT_TEMPLATE_KEY);
  });

  it('preserves supported template keys', () => {
    expect(normalizeTemplateKey('modern')).toBe('modern');
    expect(normalizeTemplateKey('photo')).toBe('photo');
  });
});

describe('getInvitationTemplateTheme', () => {
  it('returns the expected presentation metadata for each starter template', () => {
    expect(getInvitationTemplateTheme('classic')).toMatchObject({
      pageClassName: 'invitation-theme-classic',
      detailsPanelClassName: 'panel stack compact-info',
      rsvpPanelClassName: 'stack form-grid panel soft-panel',
    });

    expect(getInvitationTemplateTheme('modern')).toMatchObject({
      pageClassName: 'invitation-theme-modern',
      detailsPanelClassName: 'panel stack compact-info invitation-panel-modern',
      rsvpPanelClassName: 'stack form-grid panel invitation-panel-modern',
    });

    expect(getInvitationTemplateTheme('photo')).toMatchObject({
      pageClassName: 'invitation-theme-photo',
      heroClassName: 'hero-image invitation-hero-tall',
      contentClassName: 'two-column wide-split invitation-photo-layout',
    });
  });
});
