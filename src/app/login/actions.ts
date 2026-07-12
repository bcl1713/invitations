'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { getEnv } from '@/lib/env';
import { setHostSession } from '@/lib/host-session';
import { authenticateHost } from '@/modules/auth/host-auth-service';
import { loginAttemptThrottle } from '@/modules/auth/login-attempt-throttle';

function getLoginSource(requestHeaders: Headers) {
  return requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown';
}

export async function loginAction(formData: FormData) {
  const env = getEnv();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const source = getLoginSource(await headers());

  if (await loginAttemptThrottle.isThrottled(email, source)) {
    redirect('/login?error=1');
  }

  const isValid = await authenticateHost(
    { email, password },
    {
      adminEmail: env.ADMIN_EMAIL,
      adminPassword: env.ADMIN_PASSWORD,
    },
  );

  if (!isValid) {
    await loginAttemptThrottle.recordFailure(email, source);
    redirect('/login?error=1');
  }

  await loginAttemptThrottle.recordSuccess(email, source);
  await setHostSession(env.ADMIN_EMAIL);
  redirect('/admin');
}
