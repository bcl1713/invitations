import Link from 'next/link';

import { ScaledPostcardCanvas } from '@/app/ScaledPostcardCanvas';
import { getEnv } from '@/lib/env';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';
import { fontCssFamily } from '@/modules/invitations/invitation-design';
import { getInvitationView } from '@/modules/invitations/invitation-service';
import { RSVP_NOTE_MAX_LENGTH } from '@/modules/rsvps/rsvp-service';

import { submitRsvpAction } from './actions';

function textStyle(design: ReturnType<typeof buildInvitationPresentation>['design'], block: keyof ReturnType<typeof buildInvitationPresentation>['design']['typography']) {
  const style = design.typography[block];
  return {
    fontFamily: fontCssFamily(style.fontFamily),
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textAlign: style.textAlign,
  };
}

export const dynamic = 'force-dynamic';

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
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
      designConfig: invitation.event.designConfig,
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
        <ScaledPostcardCanvas>
          <section className="card stack invitation-main-card invitation-shell invitation-card-frame">
          {presentation.assetUrls.watermark ? <img className="invitation-watermark" src={presentation.assetUrls.watermark} alt="" /> : null}
          {presentation.assetUrls.hero ? (
            <img className={`${presentation.theme.heroClassName} invitation-hero-frame`} src={presentation.assetUrls.hero} alt={`${presentation.title} hero`} />
          ) : null}

          <div className={presentation.theme.contentClassName}>
            <section className="stack invitation-main-copy invitation-copy-panel" aria-label="Invitation details">
              <div className="stack compact-info invitation-heading-block">
                {presentation.assetUrls.emblem ? <img className="invitation-emblem" src={presentation.assetUrls.emblem} alt="Event emblem" /> : null}
                <p className="eyebrow" style={textStyle(presentation.design, 'eyebrow')}>{presentation.design.content.eyebrow}</p>
                <p className="invitation-kicker" style={textStyle(presentation.design, 'introTitle')}>{presentation.design.content.introTitle}</p>
                <h1 style={textStyle(presentation.design, 'title')}>{presentation.titleLines.map((line, index) => <span key={line + index} className="invitation-title-line">{line}</span>)}</h1>
                <p className="invitation-host-line" style={textStyle(presentation.design, 'hostLine')}>{presentation.design.content.hostLine}</p>
                <p className="invitation-guest-line" style={textStyle(presentation.design, 'guestLine')}>{presentation.design.content.guestLine}</p>
              </div>

              <div className={presentation.theme.detailsPanelClassName}>
                <div className="invitation-detail-block">
                  <p className="eyebrow" style={textStyle(presentation.design, 'whenLabel')}>{presentation.design.content.whenLabel}</p>
                  <p style={textStyle(presentation.design, 'whenValue')}>{presentation.design.content.whenValue}</p>
                </div>
                <div className="invitation-detail-block">
                  <p className="eyebrow" style={textStyle(presentation.design, 'whereLabel')}>{presentation.design.content.whereLabel}</p>
                  <p style={textStyle(presentation.design, 'whereValue')}>{presentation.design.content.whereValue}</p>
                </div>
              </div>

              <section className="stack compact-info invitation-about-panel" aria-labelledby="invitation-description-heading">
                <h2 id="invitation-description-heading" style={textStyle(presentation.design, 'aboutHeading')}>{presentation.design.content.aboutHeading}</h2>
                <p className="pre-wrap" style={textStyle(presentation.design, 'description')}>{presentation.design.content.description}</p>
                <p className="muted invitation-plus-one-note" style={textStyle(presentation.design, 'plusOneText')}>{presentation.design.content.plusOneText}</p>
              </section>
            </section>
          </div>
          </section>
        </ScaledPostcardCanvas>

        <section className="card stack invitation-response-card invitation-card-frame" aria-labelledby="rsvp-heading">
          <div className="stack compact-info invitation-rsvp-copy invitation-rsvp-copy-shell">
            <h2 id="rsvp-heading" style={textStyle(presentation.design, 'rsvpHeading')}>{presentation.design.content.rsvpHeading}</h2>
            <p style={textStyle(presentation.design, 'rsvpIntro')}>{presentation.design.content.rsvpIntro.replace('{host}', presentation.hostName)}</p>
          </div>
          {query.saved ? <p className="success invitation-response-status">Your RSVP has been saved.</p> : null}
          {query.error ? <p className="error invitation-response-status">Please review your RSVP and try again.</p> : null}
          <form action={submitRsvpAction.bind(null, token)} className={`${presentation.theme.rsvpPanelClassName} invitation-rsvp-form invitation-rsvp-form-shell`}>
            <label>
              <span style={textStyle(presentation.design, 'rsvpStatusLabel')}>{presentation.design.content.rsvpStatusLabel}</span>
              <select name="status" defaultValue={invitation.guest.rsvp?.status ?? 'GOING'}>
                <option value="GOING">Going</option>
                <option value="MAYBE">Maybe</option>
                <option value="DECLINED">Declined</option>
              </select>
            </label>
            <label>
              <span style={textStyle(presentation.design, 'headcountLabel')}>{presentation.design.content.headcountLabel}</span>
              <input
                name="headcount"
                type="number"
                min={1}
                max={invitation.guest.canBringPlusOne ? 2 : 1}
                defaultValue={invitation.guest.rsvp?.headcount ?? 1}
              />
            </label>
            <label>
              <span style={textStyle(presentation.design, 'noteLabel')}>{presentation.design.content.noteLabel}</span>
              <textarea name="note" rows={4} maxLength={RSVP_NOTE_MAX_LENGTH} defaultValue={invitation.guest.rsvp?.note ?? ''} />
            </label>
            <button type="submit" style={textStyle(presentation.design, 'saveRsvpLabel')}>{presentation.design.content.saveRsvpLabel}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
