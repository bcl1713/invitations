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

export function buildInvitationPresentation(input: InvitationPresentationInput) {
  const theme = getInvitationTemplateTheme(input.event.templateKey);
  const hostName = input.event.hostName.trim() || 'Your host';
  const whereText = input.event.location.trim() || 'Location details will be shared soon.';
  const description =
    input.event.description.trim() || 'We would be delighted to celebrate with you. More event details are on the way.';

  return {
    theme,
    title: input.event.title.trim(),
    hostName,
    guestName: input.guest.name.trim(),
    description,
    whenText: formatEventDate(input.event.startsAt),
    whereText,
    introTitle: theme.introTitle,
    emailIntro: theme.emailIntro,
    eyebrow: theme.eyebrow,
    rsvpHeading: theme.rsvpTitle,
    inviteUrl: input.inviteUrl,
    plusOneText: input.guest.canBringPlusOne ? 'A plus-one is welcome.' : 'This invitation is for one guest.',
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
