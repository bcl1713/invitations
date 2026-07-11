import { normalizeTemplateKey } from '@/modules/templates/template-catalog';

export interface InvitationTemplateTheme {
  pageClassName: string;
  heroClassName: string;
  contentClassName: string;
  detailsPanelClassName: string;
  rsvpPanelClassName: string;
  eyebrow: string;
  introTitle: string;
  rsvpTitle: string;
}

export function getInvitationTemplateTheme(templateKey: string): InvitationTemplateTheme {
  switch (normalizeTemplateKey(templateKey)) {
    case 'modern':
      return {
        pageClassName: 'invitation-theme-modern',
        heroClassName: 'hero-image',
        contentClassName: 'two-column wide-split invitation-modern-layout',
        detailsPanelClassName: 'panel stack compact-info invitation-panel-modern',
        rsvpPanelClassName: 'stack form-grid panel invitation-panel-modern',
        eyebrow: 'Join us',
        introTitle: 'A modern evening awaits',
        rsvpTitle: 'Your response',
      };
    case 'photo':
      return {
        pageClassName: 'invitation-theme-photo',
        heroClassName: 'hero-image invitation-hero-tall',
        contentClassName: 'two-column wide-split invitation-photo-layout',
        detailsPanelClassName: 'panel stack compact-info invitation-panel-photo',
        rsvpPanelClassName: 'stack form-grid panel invitation-panel-photo',
        eyebrow: 'Save the date',
        introTitle: 'A celebration worth dressing for',
        rsvpTitle: 'Let us know',
      };
    default:
      return {
        pageClassName: 'invitation-theme-classic',
        heroClassName: 'hero-image',
        contentClassName: 'two-column wide-split',
        detailsPanelClassName: 'panel stack compact-info',
        rsvpPanelClassName: 'stack form-grid panel soft-panel',
        eyebrow: "You're invited",
        introTitle: 'We would be delighted to celebrate with you',
        rsvpTitle: 'RSVP',
      };
  }
}
