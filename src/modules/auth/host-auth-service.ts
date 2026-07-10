import { timingSafeEqual } from 'node:crypto';

export interface HostCredentials {
  email: string;
  password: string;
}

export interface HostAuthConfig {
  adminEmail: string;
  adminPassword: string;
}

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authenticateHost(
  credentials: HostCredentials,
  config: HostAuthConfig,
) {
  return (
    constantTimeEquals(credentials.email.trim().toLowerCase(), config.adminEmail.trim().toLowerCase()) &&
    constantTimeEquals(credentials.password, config.adminPassword)
  );
}
