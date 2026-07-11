export const DEFAULT_TEMPLATE_KEY = 'classic';

export const TEMPLATE_OPTIONS = [
  {
    key: 'classic',
    label: 'Classic',
    description: 'Formal invitation layout with balanced copy and details.',
  },
  {
    key: 'modern',
    label: 'Modern',
    description: 'Clean, minimal presentation with a lighter visual rhythm.',
  },
  {
    key: 'photo',
    label: 'Photo',
    description: 'Hero-image-first presentation for events that want a visual lead.',
  },
  {
    key: 'ceremonial',
    label: 'Ceremonial',
    description: 'Framed formal invitation with emblem, watermark, and ceremonial copy.',
  },
] as const;

export type TemplateKey = (typeof TEMPLATE_OPTIONS)[number]['key'];

const templateKeySet = new Set<string>(TEMPLATE_OPTIONS.map((template) => template.key));

export function normalizeTemplateKey(value: string | null | undefined): TemplateKey {
  if (!value) {
    return DEFAULT_TEMPLATE_KEY;
  }

  return templateKeySet.has(value) ? (value as TemplateKey) : DEFAULT_TEMPLATE_KEY;
}
