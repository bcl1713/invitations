import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authenticateHostMock,
  getEnvMock,
  headersMock,
  isThrottledMock,
  recordFailureMock,
  recordSuccessMock,
  redirectMock,
  setHostSessionMock,
} = vi.hoisted(() => ({
  authenticateHostMock: vi.fn(),
  getEnvMock: vi.fn(),
  headersMock: vi.fn(),
  isThrottledMock: vi.fn(),
  recordFailureMock: vi.fn(),
  recordSuccessMock: vi.fn(),
  redirectMock: vi.fn(),
  setHostSessionMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('next/navigation', () => ({ redirect: redirectMock }));
vi.mock('@/lib/env', () => ({ getEnv: getEnvMock }));
vi.mock('@/lib/host-session', () => ({ setHostSession: setHostSessionMock }));
vi.mock('@/modules/auth/host-auth-service', () => ({ authenticateHost: authenticateHostMock }));
vi.mock('@/modules/auth/login-attempt-throttle', () => ({
  loginAttemptThrottle: {
    isThrottled: isThrottledMock,
    recordFailure: recordFailureMock,
    recordSuccess: recordSuccessMock,
  },
}));

import { loginAction } from '@/app/login/actions';

function formData() {
  const data = new FormData();
  data.set('email', 'host@example.com');
  data.set('password', 'correct-horse');
  return data;
}

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEnvMock.mockReturnValue({ ADMIN_EMAIL: 'host@example.com', ADMIN_PASSWORD: 'correct-horse' });
    headersMock.mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.42, 10.0.0.1' }));
    redirectMock.mockImplementation((location: string) => {
      throw new Error(`redirect:${location}`);
    });
  });

  it('rejects a throttled request before comparing credentials', async () => {
    isThrottledMock.mockReturnValue(true);

    await expect(loginAction(formData())).rejects.toThrow('redirect:/login?error=1');

    expect(authenticateHostMock).not.toHaveBeenCalled();
    expect(recordFailureMock).not.toHaveBeenCalled();
  });

  it('records a failed attempt using the forwarded client source', async () => {
    isThrottledMock.mockReturnValue(false);
    authenticateHostMock.mockResolvedValue(false);

    await expect(loginAction(formData())).rejects.toThrow('redirect:/login?error=1');

    expect(recordFailureMock).toHaveBeenCalledWith('host@example.com', '203.0.113.42');
    expect(recordSuccessMock).not.toHaveBeenCalled();
  });

  it('records successful authentication without clearing unrelated source protections', async () => {
    isThrottledMock.mockReturnValue(false);
    authenticateHostMock.mockResolvedValue(true);
    setHostSessionMock.mockResolvedValue(undefined);

    await expect(loginAction(formData())).rejects.toThrow('redirect:/admin');

    expect(recordSuccessMock).toHaveBeenCalledWith('host@example.com', '203.0.113.42');
    expect(setHostSessionMock).toHaveBeenCalledWith('host@example.com');
  });
});
