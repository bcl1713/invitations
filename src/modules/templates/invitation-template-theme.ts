import { normalizeTemplateKey } from '@/modules/templates/template-catalog';

export interface InvitationTemplateTheme {
  pageClassName: string;
  heroClassName: string;
  contentClassName: string;
  detailsPanelClassName: string;
  rsvpPanelClassName: string;
  previewCardClassName: string;
  eyebrow: string;
  introTitle: string;
  emailIntro: string;
  rsvpTitle: string;
  emailStyles: {
    pageBackground: string;
    cardBackground: string;
    panelBackground: string;
    borderColor: string;
    accentColor: string;
    textColor: string;
    buttonBackground: string;
    buttonTextColor: string;
    fontFamily: string;
    headingFontFamily: string;
  };
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
        previewCardClassName: 'card stack wide-card invitation-preview-surface',
        eyebrow: 'Join us',
        introTitle: 'A modern evening awaits',
        emailIntro: 'You are invited to an evening designed with clean lines and warm company.',
        rsvpTitle: 'Your response',
        emailStyles: {
          pageBackground: '#0f172a',
          cardBackground: '#111827',
          panelBackground: 'rgba(255,255,255,0.08)',
          borderColor: '#4338ca',
          accentColor: '#c4b5fd',
          textColor: '#f9fafb',
          buttonBackground: '#c4b5fd',
          buttonTextColor: '#1f2937',
          fontFamily: 'Inter, Arial, sans-serif',
          headingFontFamily: 'Inter, Arial, sans-serif',
        },
      };
    case 'photo':
      return {
        pageClassName: 'invitation-theme-photo',
        heroClassName: 'hero-image invitation-hero-tall',
        contentClassName: 'two-column wide-split invitation-photo-layout',
        detailsPanelClassName: 'panel stack compact-info invitation-panel-photo',
        rsvpPanelClassName: 'stack form-grid panel invitation-panel-photo',
        previewCardClassName: 'card stack wide-card invitation-preview-surface',
        eyebrow: 'Save the date',
        introTitle: 'A celebration worth dressing for',
        emailIntro: 'Save the date for a celebration worth dressing for.',
        rsvpTitle: 'Let us know',
        emailStyles: {
          pageBackground: '#fff7ed',
          cardBackground: '#ffffff',
          panelBackground: '#fff1f2',
          borderColor: '#fb7185',
          accentColor: '#be123c',
          textColor: '#1f2937',
          buttonBackground: '#be123c',
          buttonTextColor: '#ffffff',
          fontFamily: 'Inter, Arial, sans-serif',
          headingFontFamily: 'Georgia, Times New Roman, serif',
        },
      };
    case 'ceremonial':
      return {
        pageClassName: 'invitation-theme-ceremonial',
        heroClassName: 'hero-image invitation-hero-ceremonial',
        contentClassName: 'invitation-ceremonial-layout stack',
        detailsPanelClassName: 'panel stack compact-info invitation-panel-ceremonial',
        rsvpPanelClassName: 'stack form-grid panel invitation-panel-ceremonial',
        previewCardClassName: 'card stack wide-card invitation-preview-surface invitation-preview-ceremonial',
        eyebrow: 'You are cordially invited',
        introTitle: 'A formal reception awaits',
        emailIntro: 'You are cordially invited to a formal reception in your honour.',
        rsvpTitle: 'Kindly respond',
        emailStyles: {
          pageBackground: '#ede7da',
          cardBackground: '#f8f3e7',
          panelBackground: 'rgba(255,255,255,0.72)',
          borderColor: '#8b7d52',
          accentColor: '#4b5a3f',
          textColor: '#1f2937',
          buttonBackground: '#4b5a3f',
          buttonTextColor: '#f8f3e7',
          fontFamily: 'Georgia, Times New Roman, serif',
          headingFontFamily: 'Georgia, Times New Roman, serif',
        },
      };
    default:
      return {
        pageClassName: 'invitation-theme-classic',
        heroClassName: 'hero-image',
        contentClassName: 'two-column wide-split',
        detailsPanelClassName: 'panel stack compact-info',
        rsvpPanelClassName: 'stack form-grid panel soft-panel',
        previewCardClassName: 'card stack wide-card invitation-preview-surface',
        eyebrow: "You're invited",
        introTitle: 'We would be delighted to celebrate with you',
        emailIntro: 'We would be delighted to celebrate with you.',
        rsvpTitle: 'RSVP',
        emailStyles: {
          pageBackground: '#f7f4ef',
          cardBackground: '#ffffff',
          panelBackground: '#faf5ff',
          borderColor: '#d8b4fe',
          accentColor: '#7c3aed',
          textColor: '#1f2937',
          buttonBackground: '#7c3aed',
          buttonTextColor: '#ffffff',
          fontFamily: 'Inter, Arial, sans-serif',
          headingFontFamily: 'Georgia, Times New Roman, serif',
        },
      };
  }
}
