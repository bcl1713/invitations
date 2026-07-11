import Link from 'next/link';

import { requireHostSession } from '@/lib/host-session';
import { getEventDashboard } from '@/modules/events/event-service';
import { TEMPLATE_OPTIONS } from '@/modules/templates/template-catalog';

import { addGuestAction, sendInviteAction, updateEventAction, updateGuestAction } from './actions';

export const dynamic = 'force-dynamic';

function formatDateTimeLocalValue(value: Date | string | null) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type EventDashboardData = NonNullable<Awaited<ReturnType<typeof getEventDashboard>>>;
type EventGuest = EventDashboardData['event']['guests'][number];

function filterGuests(guests: EventGuest[], guestFilter: string) {
  switch (guestFilter) {
    case 'draft':
      return guests.filter((guest: EventGuest) => !guest.invitation?.sentAt);
    case 'sent':
      return guests.filter((guest: EventGuest) => Boolean(guest.invitation?.sentAt));
    case 'responded':
      return guests.filter((guest: EventGuest) => Boolean(guest.rsvp));
    case 'no-response':
      return guests.filter((guest: EventGuest) => !guest.rsvp);
    default:
      return guests;
  }
}

export default async function EventDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ guestFilter?: string }>;
}) {
  await requireHostSession();
  const { eventId } = await params;
  const { guestFilter = 'all' } = await searchParams;
  const data = await getEventDashboard(eventId);

  if (!data) {
    return (
      <main className="page">
        <section className="card stack">
          <h1>Event not found</h1>
          <Link href="/admin">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  const { event, summary } = data;
  const filteredGuests = filterGuests(event.guests, guestFilter);

  return (
    <main className="page wide-page">
      <section className="card stack wide-card">
        <Link href="/admin">← Back to all events</Link>
        <div className="row between wrap">
          <div>
            <p className="eyebrow">Event dashboard</p>
            <h1>{event.title}</h1>
            <p>{event.location || 'Location TBD'}</p>
            <p>{event.startsAt ? new Date(event.startsAt).toLocaleString() : 'Time TBD'}</p>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end' }}>
            <a className="button-link" href={`/api/admin/events/${event.id}/export`}>
              Export guest CSV
            </a>
            <div className="stats-grid compact">
              <div><strong>{summary.totalGuests}</strong><span>Guests</span></div>
              <div><strong>{summary.draftInvites}</strong><span>Draft invites</span></div>
              <div><strong>{summary.sentInvites}</strong><span>Invites sent</span></div>
              <div><strong>{summary.respondedCount}</strong><span>Responded</span></div>
            </div>
          </div>
        </div>

        {event.heroImagePath ? (
          <img className="hero-image" src={`/media/${event.heroImagePath}`} alt={`${event.title} hero`} />
        ) : null}

        <div className="two-column wide-split">
          <div className="stack panel">
            <h2>Event details</h2>
            <form action={updateEventAction.bind(null, event.id)} className="stack form-grid">
              <label>
                Title
                <input name="title" required defaultValue={event.title} />
              </label>
              <label>
                Host name
                <input name="hostName" required defaultValue={event.hostName} />
              </label>
              <label>
                Location
                <input name="location" defaultValue={event.location} />
              </label>
              <label>
                Start time
                <input
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocalValue(event.startsAt)}
                />
              </label>
              <label>
                Description
                <textarea name="description" rows={5} defaultValue={event.description} />
              </label>
              <label>
                Invitation style
                <select name="templateKey" defaultValue={event.templateKey}>
                  {TEMPLATE_OPTIONS.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted">
                {TEMPLATE_OPTIONS.find((template) => template.key === event.templateKey)?.description ??
                  'Choose the base invitation presentation.'}
              </p>
              <button type="submit">Save event details</button>
            </form>

            <p className="pre-wrap">{event.description || 'No description yet.'}</p>
            <form action={`/api/admin/events/${event.id}/hero`} method="post" encType="multipart/form-data" className="stack form-grid">
              <label>
                Upload hero image
                <input name="heroImage" type="file" accept="image/png,image/jpeg,image/webp" />
              </label>
              <button type="submit">Upload image</button>
            </form>
          </div>

          <form action={addGuestAction.bind(null, event.id)} className="stack form-grid panel">
            <h2>Add guest</h2>
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Note
              <textarea name="note" rows={3} />
            </label>
            <label className="checkbox-row">
              <input name="canBringPlusOne" type="checkbox" />
              Allow plus-one
            </label>
            <label className="checkbox-row">
              <input name="sendNow" type="checkbox" />
              Send invite now
            </label>
            <p className="muted">Otherwise the guest stays in Draft until you click Send invite.</p>
            <button type="submit">Add guest</button>
          </form>
        </div>

        <section className="stack panel">
          <div className="row between wrap">
            <div>
              <h2>Guests</h2>
              <p className="muted">Adding a guest does not send the invite unless you check Send invite now. You can still send any draft manually from the guest row.</p>
            </div>
            <div className="row wrap" style={{ gap: '0.5rem' }}>
              <Link href={`/admin/events/${event.id}`}>All</Link>
              <Link href={`/admin/events/${event.id}?guestFilter=draft`}>Draft</Link>
              <Link href={`/admin/events/${event.id}?guestFilter=sent`}>Sent</Link>
              <Link href={`/admin/events/${event.id}?guestFilter=responded`}>Responded</Link>
              <Link href={`/admin/events/${event.id}?guestFilter=no-response`}>No response</Link>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Invite</th>
                  <th>RSVP</th>
                  <th>Headcount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id}>
                    <td>
                      <strong>{guest.name}</strong>
                      {guest.note ? <div className="muted">{guest.note}</div> : null}
                    </td>
                    <td>{guest.email}</td>
                    <td>{guest.invitation?.sentAt ? 'Sent' : 'Draft'}</td>
                    <td>{guest.rsvp?.status ?? 'No response'}</td>
                    <td>{guest.rsvp?.headcount ?? '—'}</td>
                    <td>
                      <div className="stack">
                        <form action={sendInviteAction.bind(null, event.id, guest.id)}>
                          <button type="submit">Send invite</button>
                        </form>
                        <details>
                          <summary>Edit guest</summary>
                          <form action={updateGuestAction.bind(null, event.id, guest.id)} className="stack form-grid">
                            <label>
                              Name
                              <input name="name" required defaultValue={guest.name} />
                            </label>
                            <label>
                              Email
                              <input name="email" type="email" required defaultValue={guest.email} />
                            </label>
                            <label>
                              Note
                              <textarea name="note" rows={2} defaultValue={guest.note} />
                            </label>
                            <label className="checkbox-row">
                              <input name="canBringPlusOne" type="checkbox" defaultChecked={guest.canBringPlusOne} />
                              Allow plus-one
                            </label>
                            <button type="submit">Save guest</button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
