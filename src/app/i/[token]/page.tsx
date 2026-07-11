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
    <main className={`page wide-page invitation-page ${presentation.theme.pageClassName}`}>
      <div className="stack invitation-experience">
        <section className="card stack invitation-main-card invitation-shell invitation-card-frame">
          {presentation.assetUrls.watermark ? <img className="invitation-watermark" src={presentation.assetUrls.watermark} alt="" /> : null}
          {presentation.assetUrls.hero ? (
            <img className={`${presentation.theme.heroClassName} invitation-hero-frame`} src={presentation.assetUrls.hero} alt={`${presentation.title} hero`} />
          ) : null}

          <div className={presentation.theme.contentClassName}>
            <section className="stack invitation-main-copy invitation-copy-panel" aria-label="Invitation details">
              <div className="stack compact-info invitation-heading-block">
                {presentation.assetUrls.emblem ? <img className="invitation-emblem" src={presentation.assetUrls.emblem} alt="Event emblem" /> : null}
                <p className="eyebrow">{presentation.eyebrow}</p>
                <p className="invitation-kicker">{presentation.introTitle}</p>
                <h1>{presentation.titleLines.map((line, index) => <span key={line + index} className="invitation-title-line">{line}</span>)}</h1>
                <p className="invitation-host-line">Hosted by <strong>{presentation.hostName}</strong></p>
                <p className="invitation-guest-line">Reserved for {presentation.guestName}</p>
              </div>

              <div className={presentation.theme.detailsPanelClassName}>
                <div className="invitation-detail-block">
                  <p className="eyebrow">When</p>
                  <p>{presentation.whenText}</p>
                </div>
                <div className="invitation-detail-block">
                  <p className="eyebrow">Where</p>
                  <p>{presentation.whereText}</p>
                </div>
              </div>

              <section className="stack compact-info invitation-about-panel" aria-labelledby="invitation-description-heading">
                <h2 id="invitation-description-heading">About this event</h2>
                <p className="pre-wrap">{presentation.description}</p>
                <p className="muted invitation-plus-one-note">{presentation.plusOneText}</p>
              </section>
            </section>
          </div>
        </section>

        <section className="card stack invitation-response-card invitation-card-frame" aria-labelledby="rsvp-heading">
          <div className="stack compact-info invitation-rsvp-copy invitation-rsvp-copy-shell">
            <h2 id="rsvp-heading">{presentation.rsvpHeading}</h2>
            <p>Please let {presentation.hostName} know if you can make it.</p>
          </div>
          {query.saved ? <p className="success invitation-response-status">Your RSVP has been saved.</p> : null}
          <form action={submitRsvpAction.bind(null, token)} className={`${presentation.theme.rsvpPanelClassName} invitation-rsvp-form invitation-rsvp-form-shell`}>
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
    </main>
  );
}
