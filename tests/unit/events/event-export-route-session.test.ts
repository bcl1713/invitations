import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, exportEventCsvMock, getEnvMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  exportEventCsvMock: vi.fn(),
  getEnvMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/lib/env', () => ({
  getEnv: getEnvMock,
}));

vi.mock('@/modules/events/event-export-service', () => ({
  exportEventCsv: exportEventCsvMock,
}));

import { GET } from '@/app/api/admin/events/[eventId]/export/route';
import { createSessionToken } from '@/lib/session';

const secret = 'test-session-secret';

function setSessionCookie(value?: string) {
  cookiesMock.mockResolvedValue({
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
  });
}

function requestExport() {
  return GET(new Request('http://localhost/api/admin/events/event-123/export'), {
    params: Promise.resolve({ eventId: 'event-123' }),
  });
}

describe('event export route session handling', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    exportEventCsvMock.mockReset();
    getEnvMock.mockReset();
    getEnvMock.mockReturnValue({ APP_SECRET: secret });
  });

  it('redirects a malformed host session cookie to login without exporting', async () => {
    setSessionCookie('malformed.cookie');

    const response = await requestExport();

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/login');
    expect(exportEventCsvMock).not.toHaveBeenCalled();
  });

  it('allows a valid host session to export the event', async () => {
    setSessionCookie(createSessionToken('host@example.com', secret));
    exportEventCsvMock.mockResolvedValue({
      fileName: 'guest-list.csv',
      csv: 'guest_name\nAlex Example',
    });

    const response = await requestExport();

    expect(response.status).toBe(200);
    expect(exportEventCsvMock).toHaveBeenCalledWith('event-123');
  });
});
