const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

export const DEFAULT_EVENT_TIME_ZONE = 'UTC';

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function getTimeZoneParts(date: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    millisecond: date.getUTCMilliseconds(),
  };
}

function equalDateTimeParts(left: DateTimeParts, right: DateTimeParts) {
  return left.year === right.year
    && left.month === right.month
    && left.day === right.day
    && left.hour === right.hour
    && left.minute === right.minute
    && left.second === right.second;
}

function parseDateTimeLocalParts(value: string): DateTimeParts | null {
  const match = DATE_TIME_LOCAL_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = '0', millisecond = '0'] = match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: Number(millisecond.padEnd(3, '0')),
  };
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond));

  return date.getUTCFullYear() === parts.year
    && date.getUTCMonth() === parts.month - 1
    && date.getUTCDate() === parts.day
    && date.getUTCHours() === parts.hour
    && date.getUTCMinutes() === parts.minute
    && date.getUTCSeconds() === parts.second
    ? parts
    : null;
}

export function normalizeEventTimeZone(value: string | null | undefined) {
  const timeZone = value?.trim() || DEFAULT_EVENT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return timeZone;
  } catch {
    throw new Error('Invalid event time zone');
  }
}

export function parseEventDateTimeLocal(value: string | null | undefined, timeZone: string) {
  const normalizedValue = value?.trim() ?? '';
  if (!normalizedValue) {
    return null;
  }

  const parts = parseDateTimeLocalParts(normalizedValue);
  if (!parts) {
    throw new Error('Invalid start time');
  }

  const normalizedTimeZone = normalizeEventTimeZone(timeZone);
  const targetTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  let timestamp = targetTimestamp;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const localParts = getTimeZoneParts(new Date(timestamp), normalizedTimeZone);
    const localTimestamp = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute,
      localParts.second,
      parts.millisecond,
    );
    const nextTimestamp = timestamp + (targetTimestamp - localTimestamp);
    if (nextTimestamp === timestamp) {
      break;
    }
    timestamp = nextTimestamp;
  }

  const result = new Date(timestamp);
  if (!equalDateTimeParts(getTimeZoneParts(result, normalizedTimeZone), parts)) {
    throw new Error('Invalid start time');
  }

  return result;
}

export function formatEventDateTimeLocal(value: Date | string | null | undefined, timeZone: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const parts = getTimeZoneParts(date, normalizeEventTimeZone(timeZone));
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function formatEventDateTime(value: Date | string | null | undefined, timeZone: string | null | undefined) {
  if (!value) {
    return 'A start time will be shared soon.';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'A start time will be shared soon.';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeEventTimeZone(timeZone),
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}
