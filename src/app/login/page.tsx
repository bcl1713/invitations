import Link from 'next/link';

import { getHostSession } from '@/lib/host-session';

import { loginAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getHostSession();
  const params = await searchParams;

  return (
    <main className="page">
      <section className="card stack">
        <p className="eyebrow">Host access</p>
        <h1>Sign in</h1>
        <p>Use the configured host account to manage invitations, guests, and RSVPs.</p>
        {params.error ? <p className="error">Invalid credentials. Try again.</p> : null}
        <form action={loginAction} className="stack form-grid">
          <label>
            Email
            <input name="email" type="email" required defaultValue={session?.email ?? ''} />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <Link href="/">Back home</Link>
      </section>
    </main>
  );
}
