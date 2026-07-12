import Link from 'next/link';

import { getEnv } from '@/lib/env';
import { requireHostSession } from '@/lib/host-session';
import {
  buildGuestFilterLinks,
  filterGuests,
} from '@/modules/events/event-dashboard-filters';
import { getEventDashboard } from '@/modules/events/event-service';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';
import { TEMPLATE_OPTIONS } from '@/modules/templates/template-catalog';

import { InvitationPreview } from './InvitationPreview';
import { InvitationDesignEditor } from './InvitationDesignEditor';
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

  const env = getEnv();
  const { event, summary } = data;
  const initialPresentation = buildInvitationPresentation({
    appUrl: env.APP_URL,
    inviteUrl: '#preview',
    event: {
      title: event.title,
      hostName: event.hostName,
      location: event.location,
      description: event.description,
      startsAt: event.startsAt,
      templateKey: event.templateKey,
      designConfig: event.designConfig,
      heroImagePath: event.heroImagePath,
      emblemImagePath: event.emblemImagePath,
      watermarkImagePath: event.watermarkImagePath,
    },
    guest: { name: 'Your guest', canBringPlusOne: true },
  });
  const filteredGuests = filterGuests(event.guests, guestFilter);
  const guestFilterLinks = buildGuestFilterLinks(event.id, guestFilter);

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
          <img className="hero-image invitation-dashboard-hero" src={`/media/${event.heroImagePath}`} alt={`${event.title} hero`} />
        ) : null}

        <div className="two-column wide-split">
          <div className="stack panel">
            <h2>Event details</h2>
            <form id="event-details-form" action={updateEventAction.bind(null, event.id)} className="stack form-grid">
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
              <InvitationDesignEditor initialDesign={initialPresentation.editableDesign} />
              <button type="submit">Save event details</button>
            </form>

            <p className="pre-wrap">{event.description || 'No description yet.'}</p>
            <div className="stack asset-upload-grid">
              <form action={`/api/admin/events/${event.id}/hero`} method="post" encType="multipart/form-data" className="stack form-grid panel subtle-panel">
                <label>
                  Upload hero image
                  <input id="hero-image-input" name="heroImage" type="file" accept="image/png,image/jpeg,image/webp" />
                </label>
                <button type="submit">Upload hero image</button>
                {event.heroImagePath ? (
                  <div className="stack compact-info asset-existing-card">
                    <img className="asset-thumb hero-image" src={`/media/${event.heroImagePath}`} alt={`${event.title} hero`} />
                    <button type="submit" formAction={`/api/admin/events/${event.id}/hero/remove`} formMethod="post" className="secondary">
                      Remove hero image
                    </button>
                  </div>
                ) : null}
              </form>
              <form action={`/api/admin/events/${event.id}/emblem`} method="post" encType="multipart/form-data" className="stack form-grid panel subtle-panel">
                <label>
                  Upload event emblem
                  <input id="emblem-image-input" name="emblemImage" type="file" accept="image/png,image/jpeg,image/webp" />
                </label>
                <button type="submit">Upload event emblem</button>
                {event.emblemImagePath ? (
                  <div className="stack compact-info asset-existing-card">
                    <img className="asset-thumb invitation-emblem" src={`/media/${event.emblemImagePath}`} alt={`${event.title} emblem`} />
                    <button type="submit" formAction={`/api/admin/events/${event.id}/emblem/remove`} formMethod="post" className="secondary">
                      Remove event emblem
                    </button>
                  </div>
                ) : null}
              </form>
              <form action={`/api/admin/events/${event.id}/watermark`} method="post" encType="multipart/form-data" className="stack form-grid panel subtle-panel">
                <label>
                  Upload custom watermark
                  <input id="watermark-image-input" name="watermarkImage" type="file" accept="image/png,image/jpeg,image/webp" />
                </label>
                <button type="submit">Upload watermark</button>
                {event.watermarkImagePath ? (
                  <div className="stack compact-info asset-existing-card">
                    <img className="asset-thumb invitation-watermark-thumb" src={`/media/${event.watermarkImagePath}`} alt={`${event.title} watermark`} />
                    <button type="submit" formAction={`/api/admin/events/${event.id}/watermark/remove`} formMethod="post" className="secondary">
                      Remove watermark
                    </button>
                  </div>
                ) : null}
              </form>
            </div>
          </div>

          <InvitationPreview
            appUrl={env.APP_URL}
            initialEvent={{
              title: event.title,
              hostName: event.hostName,
              location: event.location,
              description: event.description,
              startsAt: event.startsAt ? new Date(event.startsAt).toISOString() : null,
              templateKey: event.templateKey,
              designConfig: event.designConfig ? JSON.stringify(event.designConfig) : undefined,
              heroUrl: event.heroImagePath ? `${env.APP_URL.replace(/\/$/, '')}/media/${event.heroImagePath}` : null,
              emblemUrl: event.emblemImagePath ? `${env.APP_URL.replace(/\/$/, '')}/media/${event.emblemImagePath}` : null,
              watermarkUrl: event.watermarkImagePath ? `${env.APP_URL.replace(/\/$/, '')}/media/${event.watermarkImagePath}` : null,
            }}
          />

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
              {guestFilterLinks.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  aria-current={filter.isActive ? 'page' : undefined}
                >
                  {filter.label}
                </Link>
              ))}
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
