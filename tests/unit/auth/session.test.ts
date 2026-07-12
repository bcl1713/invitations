import { createHmac } from 'node:crypto';

import { createSessionToken, verifySessionToken } from '@/lib/session';

const secret = 'test-session-secret';

function sign(payload: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

describe('verifySessionToken', () => {
  it('returns null for missing or truncated tokens', () => {
    expect(verifySessionToken('', secret)).toBeNull();
    expect(verifySessionToken('payload.', secret)).toBeNull();
  });

  it('returns null for a signature with the wrong byte length', () => {
    expect(verifySessionToken('x.y', secret)).toBeNull();
  });

  it('returns null for a signed payload that is not valid JSON', () => {
    const payload = Buffer.from('not-json').toString('base64url');

    expect(verifySessionToken(`${payload}.${sign(payload)}`, secret)).toBeNull();
  });

  it('returns null for an invalid signature', () => {
    const token = createSessionToken('host@example.com', secret);
    const [payload, signature] = token.split('.');
    const invalidSignature = `${signature?.slice(0, -1)}x`;

    expect(verifySessionToken(`${payload}.${invalidSignature}`, secret)).toBeNull();
  });

  it('returns the session for a valid token', () => {
    expect(verifySessionToken(createSessionToken('host@example.com', secret), secret)).toMatchObject({
      email: 'host@example.com',
    });
  });
});
