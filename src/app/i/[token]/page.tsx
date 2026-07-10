import Link from 'next/link';

import { getInvitationView } from '@/modules/invitations/invitation-service';

import { submitRsvpAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const invitation = await getInvitationView(token);

  if (!invitation) {
    return (
      <main className="page">
        <section className="card stack">
          <h1>Invitation not found</h1>
          <Link href="/">Return home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page wide-page">
      <section className="card stack wide-card">
        {invitation.event.heroImagePath ? (
          <img className="hero-image" src={`/media/${invitation.event.heroImagePath}`} alt={`${invitation.event.title} hero`} />
        ) : null}
        <p className="eyebrow">You&apos;re invited</p>
        <h1>{invitation.event.title}</h1>
        <p>Hello {invitation.guest.name},</p>
        <p className="pre-wrap">{invitation.event.description || 'We would love to celebrate with you.'}</p>
        <div className="stack compact-info">
          <p><strong>Host:</strong> {invitation.event.hostName || 'Host'}</p>
          <p><strong>Location:</strong> {invitation.event.location || 'TBD'}</p>
          <p><strong>When:</strong> {invitation.event.startsAt ? new Date(invitation.event.startsAt).toLocaleString() : 'TBD'}</p>
        </div>
        {query.saved ? <p className="success">Your RSVP has been saved.</p> : null}
        <form action={submitRsvpAction.bind(null, token)} className="stack form-grid panel soft-panel">
          <label>
            RSVP status
            <select name="status" defaultValue={invitation.guest.rsvp?.status ?? 'GOING'}>
              <option value="GOING">Going</option>
              <option value="MAYBE">Maybe</option>
              <option value="DECLINED">Declined</option>
            </select>
          </label>
          <label>
            Headcount
            <input
              name="headcount"
              type="number"
              min={1}
              max={invitation.guest.canBringPlusOne ? 2 : 1}
              defaultValue={invitation.guest.rsvp?.headcount ?? 1}
            />
          </label>
          <label>
            Note
            <textarea name="note" rows={4} defaultValue={invitation.guest.rsvp?.note ?? ''} />
          </label>
          <button type="submit">Save RSVP</button>
        </form>
      </section>
    </main>
  );
}
