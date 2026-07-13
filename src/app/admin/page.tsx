import Link from 'next/link';

import { requireHostSession } from '@/lib/host-session';
import { listEvents } from '@/modules/events/event-service';

import { EventTimeZoneInput } from './EventTimeZoneInput';
import { createEventAction, logoutAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireHostSession();
  const events = await listEvents();

  return (
    <main className="page wide-page">
      <section className="card stack wide-card">
        <div className="row between">
          <div>
            <p className="eyebrow">Host dashboard</p>
            <h1>Events</h1>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="secondary">Sign out</button>
          </form>
        </div>

        <div className="two-column">
          <form action={createEventAction} className="stack form-grid panel">
            <h2>Create event</h2>
            <label>
              Title
              <input name="title" required />
            </label>
            <label>
              Host name
              <input name="hostName" required />
            </label>
            <label>
              Location
              <input name="location" />
            </label>
            <label>
              Start time
              <input name="startsAt" type="datetime-local" />
            </label>
            <EventTimeZoneInput />
            <label>
              Description
              <textarea name="description" rows={5} />
            </label>
            <button type="submit">Create event</button>
          </form>

          <section className="stack panel">
            <h2>Existing events</h2>
            <div className="stack">
              {events.length === 0 ? <p>No events yet.</p> : null}
              {events.map((event) => (
                <article key={event.id} className="list-card">
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.location || 'Location TBD'}</p>
                    <p>{event._count.guests} guests</p>
                  </div>
                  <Link href={`/admin/events/${event.id}`}>Open dashboard</Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
