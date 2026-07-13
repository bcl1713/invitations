'use client';

import { useEffect, useRef } from 'react';

import { DEFAULT_EVENT_TIME_ZONE } from '@/modules/events/event-time';

export function EventTimeZoneInput({ initialTimeZone }: { initialTimeZone?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTimeZone) {
      return;
    }

    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimeZone && inputRef.current) {
      inputRef.current.value = browserTimeZone;
    }
  }, [initialTimeZone]);

  return (
    <label>
      Time zone
      <input
        name="timeZone"
        required
        defaultValue={initialTimeZone || DEFAULT_EVENT_TIME_ZONE}
        ref={inputRef}
        aria-describedby="event-time-zone-help"
      />
      <span id="event-time-zone-help" className="muted">Use an IANA time zone, such as America/New_York.</span>
    </label>
  );
}
