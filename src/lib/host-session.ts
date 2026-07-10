import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getEnv } from '@/lib/env';
import { createSessionToken, getSessionCookieName, verifySessionToken } from '@/lib/session';

export async function getHostSession() {
  const env = getEnv();
  const cookieStore = await cookies();
  const raw = cookieStore.get(getSessionCookieName())?.value;

  if (!raw) {
    return null;
  }

  return verifySessionToken(raw, env.APP_SECRET);
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
  cookieStore.set(getSessionCookieName(), createSessionToken(email, env.APP_SECRET), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.APP_URL.startsWith('https://'),
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function clearHostSession() {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
}
