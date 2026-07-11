import Link from 'next/link';

import { getEnv } from '@/lib/env';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';
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

  const env = getEnv();
  const presentation = buildInvitationPresentation({
    appUrl: env.APP_URL,
    inviteUrl: `${env.APP_URL.replace(/\/$/, '')}/i/${encodeURIComponent(token)}`,
    event: {
      title: invitation.event.title,
      hostName: invitation.event.hostName,
      location: invitation.event.location,
      description: invitation.event.description,
      startsAt: invitation.event.startsAt,
      templateKey: invitation.event.templateKey,
      heroImagePath: invitation.event.heroImagePath,
      emblemImagePath: invitation.event.emblemImagePath,
      watermarkImagePath: invitation.event.watermarkImagePath,
    },
    guest: {
      name: invitation.guest.name,
      canBringPlusOne: invitation.guest.canBringPlusOne,
    },
  });

  return (
    <main className={`page wide-page ${presentation.theme.pageClassName}`}>
      <section className="card stack wide-card invitation-shell">
        {presentation.assetUrls.watermark ? <img className="invitation-watermark" src={presentation.assetUrls.watermark} alt="" /> : null}
        {presentation.assetUrls.hero ? (
          <img className={presentation.theme.heroClassName} src={presentation.assetUrls.hero} alt={`${presentation.title} hero`} />
        ) : null}

        <div className={presentation.theme.contentClassName}>
          <section className="stack invitation-main-copy" aria-label="Invitation details">
            <div className="stack compact-info invitation-heading-block">
              {presentation.assetUrls.emblem ? <img className="invitation-emblem" src={presentation.assetUrls.emblem} alt="Event emblem" /> : null}
              <p className="eyebrow">{presentation.eyebrow}</p>
              <h1>{presentation.title}</h1>
              <p>
                Hosted by <strong>{presentation.hostName}</strong>
              </p>
              <p>Hello {presentation.guestName},</p>
              <p className="muted">{presentation.introTitle}</p>
            </div>

            <div className={presentation.theme.detailsPanelClassName}>
              <div>
                <p className="eyebrow">When</p>
                <p>{presentation.whenText}</p>
              </div>
              <div>
                <p className="eyebrow">Where</p>
                <p>{presentation.whereText}</p>
              </div>
            </div>

            <section className="stack compact-info" aria-labelledby="invitation-description-heading">
              <h2 id="invitation-description-heading">About this event</h2>
              <p className="pre-wrap">{presentation.description}</p>
              <p className="muted">{presentation.plusOneText}</p>
            </section>
          </section>

          <section className="stack" aria-labelledby="rsvp-heading">
            <div className="stack compact-info">
              <h2 id="rsvp-heading">{presentation.rsvpHeading}</h2>
              <p>Please let {presentation.hostName} know if you can make it.</p>
            </div>
            {query.saved ? <p className="success">Your RSVP has been saved.</p> : null}
            <form action={submitRsvpAction.bind(null, token)} className={presentation.theme.rsvpPanelClassName}>
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
