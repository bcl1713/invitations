'use server';

import { redirect } from 'next/navigation';

import { getEnv } from '@/lib/env';
import { setHostSession } from '@/lib/host-session';
import { authenticateHost } from '@/modules/auth/host-auth-service';

export async function loginAction(formData: FormData) {
  const env = getEnv();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const isValid = await authenticateHost(
    { email, password },
    {
      adminEmail: env.ADMIN_EMAIL,
      adminPassword: env.ADMIN_PASSWORD,
    },
  );

  if (!isValid) {
    redirect('/login?error=1');
  }

  await setHostSession(env.ADMIN_EMAIL);
  redirect('/admin');
}
