import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE_NAME = 'inv_host_session';

export const HOST_SESSION_DURATION_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  email: string;
  expiresAt: number;
  nonce: string;
  sessionId: string;
};

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function createSessionToken(
  email: string,
  sessionId: string,
  expiresAt: Date,
  secret: string,
) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      expiresAt: expiresAt.getTime(),
      nonce: randomBytes(8).toString('hex'),
      sessionId,
    } satisfies SessionPayload),
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string, secret: string) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(sign(payload, secret));
  if (
    signatureBuffer.length !== expectedSignatureBuffer.length
    || !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<SessionPayload>;
    if (
      typeof parsed.email !== 'string'
      || typeof parsed.expiresAt !== 'number'
      || !Number.isFinite(parsed.expiresAt)
      || parsed.expiresAt <= Date.now()
      || typeof parsed.sessionId !== 'string'
      || !parsed.sessionId
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}
