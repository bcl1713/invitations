import Link from 'next/link';

import { getInvitationView } from '@/modules/invitations/invitation-service';

import { submitRsvpAction } from './actions';

export const dynamic = 'force-dynamic';

const eventDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

function formatEventDate(startsAt: string | Date | null) {
  if (!startsAt) {
    return 'A start time will be shared soon.';
  }

  return eventDateFormatter.format(new Date(startsAt));
}

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

  const hostName = invitation.event.hostName || 'Your host';
  const location = invitation.event.location || 'Location details will be shared soon.';
  const description = invitation.event.description || 'We would love to celebrate with you. More event details are on the way.';

  return (
    <main className="page wide-page">
      <section className="card stack wide-card">
        {invitation.event.heroImagePath ? (
          <img className="hero-image" src={`/media/${invitation.event.heroImagePath}`} alt={`${invitation.event.title} hero`} />
        ) : null}

        <div className="two-column wide-split">
          <section className="stack" aria-label="Invitation details">
            <div className="stack compact-info">
              <p className="eyebrow">You&apos;re invited</p>
              <h1>{invitation.event.title}</h1>
              <p>
                Hosted by <strong>{hostName}</strong>
              </p>
              <p>Hello {invitation.guest.name},</p>
            </div>

            <div className="panel stack compact-info">
              <div>
                <p className="eyebrow">When</p>
                <p>{formatEventDate(invitation.event.startsAt)}</p>
              </div>
              <div>
                <p className="eyebrow">Where</p>
                <p>{location}</p>
              </div>
            </div>

            <section className="stack compact-info" aria-labelledby="invitation-description-heading">
              <h2 id="invitation-description-heading">About this event</h2>
              <p className="pre-wrap">{description}</p>
            </section>
          </section>

          <section className="stack" aria-labelledby="rsvp-heading">
            <div className="stack compact-info">
              <h2 id="rsvp-heading">RSVP</h2>
              <p>Please let {hostName} know if you can make it.</p>
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
        </div>
      </section>
    </main>
  );
}
