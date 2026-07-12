import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, getEnvMock, hostSessionMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  getEnvMock: vi.fn(),
  hostSessionMock: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/lib/env', () => ({
  getEnv: getEnvMock,
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    hostSession: hostSessionMock,
  },
}));

import { clearHostSession, getHostSession, setHostSession } from '@/lib/host-session';
import { createSessionToken } from '@/lib/session';

const secret = 'test-session-secret';

function createToken(expiresAt = new Date(Date.now() + 60_000)) {
  return createSessionToken('host@example.com', 'session-123', expiresAt, secret);
}

function setSessionCookie(value?: string) {
  const cookieStore = {
    delete: vi.fn(),
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
    set: vi.fn(),
  };
  cookiesMock.mockResolvedValue(cookieStore);
  return cookieStore;
}

describe('getHostSession', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    getEnvMock.mockReset();
    hostSessionMock.create.mockReset();
    hostSessionMock.deleteMany.mockReset();
    hostSessionMock.findUnique.mockReset();
    getEnvMock.mockReturnValue({
      APP_SECRET: secret,
      APP_URL: 'http://localhost:3000',
    });
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

  it('treats an expired signed session as unauthenticated', async () => {
    setSessionCookie(createToken(new Date(Date.now() - 1)));

    await expect(getHostSession()).resolves.toBeNull();
    expect(hostSessionMock.findUnique).not.toHaveBeenCalled();
  });

  it('treats a revoked session as unauthenticated', async () => {
    setSessionCookie(createToken());
    hostSessionMock.findUnique.mockResolvedValue(null);

    await expect(getHostSession()).resolves.toBeNull();
  });

  it('treats a database-expired session as unauthenticated', async () => {
    setSessionCookie(createToken());
    hostSessionMock.findUnique.mockResolvedValue({
      email: 'host@example.com',
      expiresAt: new Date(Date.now() - 1),
      id: 'session-123',
    });

    await expect(getHostSession()).resolves.toBeNull();
  });

  it('returns a valid host session', async () => {
    setSessionCookie(createToken());
    hostSessionMock.findUnique.mockResolvedValue({
      email: 'host@example.com',
      expiresAt: new Date(Date.now() + 60_000),
      id: 'session-123',
    });

    await expect(getHostSession()).resolves.toMatchObject({ email: 'host@example.com' });
  });

  it('persists a session before setting its cookie', async () => {
    const cookieStore = setSessionCookie();
    hostSessionMock.create.mockResolvedValue({});

    await setHostSession('host@example.com');

    expect(hostSessionMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'host@example.com',
        tokenHash: expect.any(String),
      }),
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      'inv_host_session',
      expect.any(String),
      expect.objectContaining({ maxAge: 60 * 60 * 12 }),
    );
  });

  it('revokes the stored session when clearing its cookie', async () => {
    const cookieStore = setSessionCookie(createToken());
    hostSessionMock.deleteMany.mockResolvedValue({ count: 1 });

    await clearHostSession();

    expect(hostSessionMock.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String) },
    });
    expect(cookieStore.delete).toHaveBeenCalledWith('inv_host_session');
  });
});
