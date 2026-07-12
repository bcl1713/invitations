import { normalizeInvitationDesign } from '@/modules/invitations/invitation-design';
import { getInvitationTemplateTheme } from '@/modules/templates/invitation-template-theme';

const eventDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

export interface InvitationPresentationInput {
  appUrl: string;
  inviteUrl: string;
  event: {
    title: string;
    hostName: string;
    location: string;
    description: string;
    startsAt: string | Date | null;
    templateKey: string;
    designConfig?: unknown;
    heroImagePath: string | null;
    emblemImagePath: string | null;
    watermarkImagePath: string | null;
  };
  guest: {
    name: string;
    canBringPlusOne: boolean;
  };
}

export interface EditableInvitationField {
  key:
    | 'title'
    | 'hostName'
    | 'location'
    | 'description'
    | 'startsAt'
    | 'heroImagePath'
    | 'emblemImagePath'
    | 'watermarkImagePath';
  label: string;
  kind: 'text' | 'datetime' | 'image';
}

function joinUrl(baseUrl: string, relativePath: string | null) {
  if (!relativePath) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, '')}/media/${relativePath}`;
}

function formatEventDate(startsAt: string | Date | null) {
  if (!startsAt) {
    return 'A start time will be shared soon.';
  }

  const date = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return 'A start time will be shared soon.';
  }

  return eventDateFormatter.format(date);
}

function buildTitleLines(title: string, templateKey: string) {
  const trimmed = title.trim();
  if (templateKey !== 'ceremonial') {
    return [trimmed];
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 4) {
    return [trimmed];
  }

  const midpoint = Math.ceil(words.length / 2);
  const firstLine = words.slice(0, midpoint).join(' ');
  const secondLine = words.slice(midpoint).join(' ');

  if (!firstLine || !secondLine) {
    return [trimmed];
  }

  return [firstLine, secondLine];
}

function resolveVariables(value: string, variables: Record<string, string>) {
  return value.replace(/%([a-z][a-z0-9_]*)/gi, (match, key: string) => variables[key.toLowerCase()] ?? match);
}

function resolveDesignVariables(design: ReturnType<typeof normalizeInvitationDesign>, input: InvitationPresentationInput) {
  const startsAt = input.event.startsAt ? new Date(input.event.startsAt) : null;
  const variables = {
    guestname: input.guest.name.trim(),
    hostname: input.event.hostName.trim(),
    eventtitle: input.event.title.trim(),
    location: input.event.location.trim(),
    date: startsAt && !Number.isNaN(startsAt.getTime()) ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(startsAt) : '',
    time: startsAt && !Number.isNaN(startsAt.getTime()) ? new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(startsAt) : '',
  };
  return {
    ...design,
    content: Object.fromEntries(
      Object.entries(design.content).map(([block, value]) => [block, resolveVariables(value, variables)]),
    ) as typeof design.content,
  };
}

export function buildInvitationPresentation(input: InvitationPresentationInput) {
  const theme = getInvitationTemplateTheme(input.event.templateKey);
  const hostName = input.event.hostName.trim() || 'Your host';
  const guestName = input.guest.name.trim();
  const whereText = input.event.location.trim() || 'Location details will be shared soon.';
  const description =
    input.event.description.trim() || 'We would be delighted to celebrate with you. More event details are on the way.';
  const whenText = formatEventDate(input.event.startsAt);
  const design = normalizeInvitationDesign(input.event.designConfig, {
    eyebrow: theme.eyebrow,
    introTitle: theme.introTitle,
    title: input.event.title.trim(),
    hostName,
    guestName,
    whenText,
    whereText,
    aboutHeading: 'About this event',
    description,
    rsvpHeading: theme.rsvpTitle,
    rsvpIntro: 'Please let your host know if you can make it.',
    plusOneText: input.guest.canBringPlusOne ? 'A plus-one is welcome.' : 'This invitation is for one guest.',
  });
  const editableDesign = design;
  const renderedDesign = resolveDesignVariables(editableDesign, input);
  const title = renderedDesign.content.title;

  return {
    theme,
    title,
    titleLines: buildTitleLines(title, input.event.templateKey),
    design: renderedDesign,
    editableDesign,
    hostName,
    guestName,
    description: renderedDesign.content.description,
    whenText: renderedDesign.content.whenValue,
    whereText: renderedDesign.content.whereValue,
    introTitle: renderedDesign.content.introTitle,
    emailIntro: theme.emailIntro,
    eyebrow: renderedDesign.content.eyebrow,
    rsvpHeading: renderedDesign.content.rsvpHeading,
    inviteUrl: input.inviteUrl,
    plusOneText: renderedDesign.content.plusOneText,
    assetUrls: {
      hero: joinUrl(input.appUrl, input.event.heroImagePath),
      emblem: joinUrl(input.appUrl, input.event.emblemImagePath),
      watermark: joinUrl(input.appUrl, input.event.watermarkImagePath),
    },
    editableFields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'hostName', label: 'Host name', kind: 'text' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'text' },
      { key: 'startsAt', label: 'Start time', kind: 'datetime' },
      { key: 'heroImagePath', label: 'Hero image', kind: 'image' },
      { key: 'emblemImagePath', label: 'Event emblem', kind: 'image' },
      { key: 'watermarkImagePath', label: 'Watermark', kind: 'image' },
    ] satisfies EditableInvitationField[],
  };
}
