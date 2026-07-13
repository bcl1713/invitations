import { createHash, randomUUID } from 'node:crypto';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db';
import { getEnv } from '@/lib/env';
import {
  createSessionToken,
  getSessionCookieName,
  HOST_SESSION_DURATION_SECONDS,
  verifySessionToken,
} from '@/lib/session';

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function getHostSession() {
  const env = getEnv();
  const cookieStore = await cookies();
  const raw = cookieStore.get(getSessionCookieName())?.value;

  if (!raw) {
    return null;
  }

  const token = verifySessionToken(raw, env.APP_SECRET);
  if (!token) {
    return null;
  }

  const session = await prisma.hostSession.findUnique({
    where: { tokenHash: hashSessionToken(raw) },
  });
  if (
    !session
    || session.id !== token.sessionId
    || session.email !== token.email
    || session.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  return { email: token.email };
}

export async function requireHostSession() {
  const session = await getHostSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function setHostSession(email: string) {
  const env = getEnv();
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + HOST_SESSION_DURATION_SECONDS * 1000);
  const sessionId = randomUUID();
  const token = createSessionToken(email, sessionId, expiresAt, env.APP_SECRET);

  await prisma.hostSession.create({
    data: {
      id: sessionId,
      email,
      expiresAt,
      tokenHash: hashSessionToken(token),
    },
  });

  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.APP_URL.startsWith('https://'),
    path: '/',
    maxAge: HOST_SESSION_DURATION_SECONDS,
  });
}

export async function clearHostSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(getSessionCookieName())?.value;
  if (raw) {
    await prisma.hostSession.deleteMany({
      where: { tokenHash: hashSessionToken(raw) },
    });
  }
  cookieStore.delete(getSessionCookieName());
}
