import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <section className="card stack">
        <p className="eyebrow">Self-hosted private events</p>
        <h1>Invitations Platform</h1>
        <p>
          Create stylish invites, track guests, and manage RSVPs without outsourcing your
          event to a tacky SaaS carnival.
        </p>
        <div className="row wrap">
          <Link href="/login">Host sign in</Link>
        </div>
      </section>
    </main>
  );
}
