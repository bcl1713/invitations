import { createHmac, timingSafeEqual } from 'node:crypto';

interface InvitationClaims {
  guestId: string;
  eventId: string;
  nonce?: string;
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export async function createInvitationToken(claims: InvitationClaims, secret: string) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifyInvitationToken(token: string, secret: string): Promise<InvitationClaims> {
  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    throw new Error('Invalid invitation token');
  }

  const expectedSignature = signPayload(payload, secret);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid invitation token signature');
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as InvitationClaims;
}
