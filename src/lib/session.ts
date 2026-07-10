import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE_NAME = 'inv_host_session';

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function createSessionToken(email: string, secret: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, nonce: randomBytes(8).toString('hex') }),
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string, secret: string) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload, secret);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email: string };
  return parsed;
}
