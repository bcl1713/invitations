export const POSTCARD_ASPECT_RATIO = '2:3' as const;

export const DESIGN_BLOCKS = [
  'eyebrow',
  'introTitle',
  'title',
  'hostLine',
  'guestLine',
  'whenLabel',
  'whenValue',
  'whereLabel',
  'whereValue',
  'aboutHeading',
  'description',
  'rsvpHeading',
  'rsvpIntro',
  'plusOneText',
  'rsvpStatusLabel',
  'headcountLabel',
  'noteLabel',
  'saveRsvpLabel',
] as const;

export type DesignBlock = (typeof DESIGN_BLOCKS)[number];

export type FontFamilyKey = 'serif' | 'sans' | 'display' | 'mono';

export type InvitationDesign = {
  version: 1;
  aspectRatio: typeof POSTCARD_ASPECT_RATIO;
  content: Record<DesignBlock, string>;
  typography: Record<DesignBlock, { fontFamily: FontFamilyKey; fontSize: number }>;
};

export const FONT_FAMILY_OPTIONS: Array<{ key: FontFamilyKey; label: string; css: string }> = [
  { key: 'serif', label: 'Formal serif', css: "Georgia, 'Times New Roman', serif" },
  { key: 'sans', label: 'Clean sans', css: "Arial, Helvetica, sans-serif" },
  { key: 'display', label: 'Display Roman', css: "'Times New Roman', Georgia, serif" },
  { key: 'mono', label: 'Typewriter', css: "'Courier New', Courier, monospace" },
];

const DEFAULT_FONT_BY_BLOCK: Record<DesignBlock, FontFamilyKey> = {
  eyebrow: 'serif',
  introTitle: 'serif',
  title: 'display',
  hostLine: 'serif',
  guestLine: 'serif',
  whenLabel: 'serif',
  whenValue: 'serif',
  whereLabel: 'serif',
  whereValue: 'serif',
  aboutHeading: 'display',
  description: 'serif',
  rsvpHeading: 'display',
  rsvpIntro: 'sans',
  plusOneText: 'serif',
  rsvpStatusLabel: 'sans',
  headcountLabel: 'sans',
  noteLabel: 'sans',
  saveRsvpLabel: 'sans',
};

const DEFAULT_SIZE_BY_BLOCK: Record<DesignBlock, number> = {
  eyebrow: 11,
  introTitle: 12,
  title: 32,
  hostLine: 13,
  guestLine: 12,
  whenLabel: 11,
  whenValue: 14,
  whereLabel: 11,
  whereValue: 14,
  aboutHeading: 18,
  description: 14,
  rsvpHeading: 22,
  rsvpIntro: 13,
  plusOneText: 13,
  rsvpStatusLabel: 13,
  headcountLabel: 13,
  noteLabel: 13,
  saveRsvpLabel: 13,
};

export type LegacyDesignSource = {
  eyebrow: string;
  introTitle: string;
  title: string;
  hostName: string;
  guestName: string;
  whenText: string;
  whereText: string;
  aboutHeading: string;
  description: string;
  rsvpHeading: string;
  rsvpIntro: string;
  plusOneText?: string;
};

function clampFontSize(value: unknown, fallback: number) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(72, Math.max(9, Math.round(numeric)));
}

function fontFamily(value: unknown, fallback: FontFamilyKey) {
  return FONT_FAMILY_OPTIONS.some((option) => option.key === value) ? (value as FontFamilyKey) : fallback;
}

export function createDefaultInvitationDesign(source: LegacyDesignSource): InvitationDesign {
  const content: Record<DesignBlock, string> = {
    eyebrow: source.eyebrow,
    introTitle: source.introTitle,
    title: source.title,
    hostLine: `Hosted by ${source.hostName}`,
    guestLine: `Reserved for ${source.guestName}`,
    whenLabel: 'When',
    whenValue: source.whenText,
    whereLabel: 'Where',
    whereValue: source.whereText,
    aboutHeading: source.aboutHeading,
    description: source.description,
    rsvpHeading: source.rsvpHeading,
    rsvpIntro: source.rsvpIntro,
    plusOneText: source.plusOneText ?? 'A plus-one is welcome.',
    rsvpStatusLabel: 'RSVP status',
    headcountLabel: 'Headcount',
    noteLabel: 'Note',
    saveRsvpLabel: 'Save RSVP',
  };

  const typography = Object.fromEntries(
    DESIGN_BLOCKS.map((block) => [
      block,
      { fontFamily: DEFAULT_FONT_BY_BLOCK[block], fontSize: DEFAULT_SIZE_BY_BLOCK[block] },
    ]),
  ) as InvitationDesign['typography'];

  return { version: 1, aspectRatio: POSTCARD_ASPECT_RATIO, content, typography };
}

export function normalizeInvitationDesign(value: unknown, source: LegacyDesignSource): InvitationDesign {
  const fallback = createDefaultInvitationDesign(source);
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as { content?: Record<string, unknown>; typography?: Record<string, unknown> };
  const content = { ...fallback.content };
  const typography = { ...fallback.typography };

  for (const block of DESIGN_BLOCKS) {
    const contentValue = candidate.content?.[block];
    if (typeof contentValue === 'string') content[block] = contentValue;

    const styleValue = candidate.typography?.[block];
    if (styleValue && typeof styleValue === 'object') {
      const style = styleValue as { fontFamily?: unknown; fontSize?: unknown };
      typography[block] = {
        fontFamily: fontFamily(style.fontFamily, fallback.typography[block].fontFamily),
        fontSize: clampFontSize(style.fontSize, fallback.typography[block].fontSize),
      };
    }
  }

  return { version: 1, aspectRatio: POSTCARD_ASPECT_RATIO, content, typography };
}

export function fontCssFamily(key: FontFamilyKey) {
  return FONT_FAMILY_OPTIONS.find((option) => option.key === key)?.css ?? FONT_FAMILY_OPTIONS[0].css;
}
