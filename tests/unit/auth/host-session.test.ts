import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, getEnvMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  getEnvMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/lib/env', () => ({
  getEnv: getEnvMock,
}));

import { getHostSession } from '@/lib/host-session';
import { createSessionToken } from '@/lib/session';

const secret = 'test-session-secret';

function setSessionCookie(value?: string) {
  cookiesMock.mockResolvedValue({
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
  });
}

describe('getHostSession', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    getEnvMock.mockReset();
    getEnvMock.mockReturnValue({ APP_SECRET: secret });
  });

  it('treats an absent session cookie as unauthenticated', async () => {
    setSessionCookie();

    await expect(getHostSession()).resolves.toBeNull();
  });

  it('treats a malformed host session cookie as unauthenticated', async () => {
    setSessionCookie('malformed.cookie');

    await expect(getHostSession()).resolves.toBeNull();
  });

  it('treats an unverifiable host session cookie as unauthenticated', async () => {
    setSessionCookie('cGF5bG9hZA.invalid-signature');

    await expect(getHostSession()).resolves.toBeNull();
  });

  it('returns a valid host session', async () => {
    const token = createSessionToken('host@example.com', secret);
    setSessionCookie(token);

    await expect(getHostSession()).resolves.toMatchObject({ email: 'host@example.com' });
  });

});
