import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getHostSessionMock, exportEventCsvMock } = vi.hoisted(() => ({
  getHostSessionMock: vi.fn(),
  exportEventCsvMock: vi.fn(),
}));

vi.mock('@/lib/host-session', () => ({
  getHostSession: getHostSessionMock,
}));

vi.mock('@/modules/events/event-export-service', () => ({
  exportEventCsv: exportEventCsvMock,
}));

import { GET } from '@/app/api/admin/events/[eventId]/export/route';

describe('event export route', () => {
  beforeEach(() => {
    getHostSessionMock.mockReset();
    exportEventCsvMock.mockReset();
  });

  it('redirects unauthenticated users to login', async () => {
    getHostSessionMock.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/admin/events/event-123/export'), {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/login');
    expect(exportEventCsvMock).not.toHaveBeenCalled();
  });

  it('returns a csv attachment for the requested event', async () => {
    getHostSessionMock.mockResolvedValue({ email: 'host@example.com' });
    exportEventCsvMock.mockResolvedValue({
      fileName: 'summer-party-guests.csv',
      csv: 'guest_name\nAlex Example',
    });

    const response = await GET(new Request('http://localhost/api/admin/events/event-123/export'), {
      params: Promise.resolve({ eventId: 'event-123' }),
    });

    expect(exportEventCsvMock).toHaveBeenCalledWith('event-123');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="summer-party-guests.csv"',
    );
    await expect(response.text()).resolves.toBe('guest_name\nAlex Example');
  });
});
