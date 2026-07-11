'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';

type PreviewState = {
  title: string;
  hostName: string;
  location: string;
  description: string;
  startsAt: string | null;
  templateKey: string;
  heroUrl: string | null;
  emblemUrl: string | null;
  watermarkUrl: string | null;
};

export function InvitationPreview({
  appUrl,
  initialEvent,
}: {
  appUrl: string;
  initialEvent: PreviewState;
}) {
  const [preview, setPreview] = useState(initialEvent);
  const objectUrls = useRef<Record<'heroUrl' | 'emblemUrl' | 'watermarkUrl', string | null>>({
    heroUrl: null,
    emblemUrl: null,
    watermarkUrl: null,
  });

  useEffect(() => {
    const form = document.getElementById('event-details-form') as HTMLFormElement | null;
    const heroInput = document.getElementById('hero-image-input') as HTMLInputElement | null;
    const emblemInput = document.getElementById('emblem-image-input') as HTMLInputElement | null;
    const watermarkInput = document.getElementById('watermark-image-input') as HTMLInputElement | null;

    if (!form) {
      return;
    }

    const currentObjectUrls = objectUrls.current;

    const readTextValue = (name: string) => {
      const field = form.elements.namedItem(name);
      return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement
        ? field.value
        : '';
    };

    const updateAssetPreview = (
      input: HTMLInputElement | null,
      key: 'heroUrl' | 'emblemUrl' | 'watermarkUrl',
      fallback: string | null,
    ) => {
      const existingUrl = currentObjectUrls[key];
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl);
        currentObjectUrls[key] = null;
      }

      const file = input?.files?.[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        currentObjectUrls[key] = objectUrl;
        return objectUrl;
      }

      return fallback;
    };

    const syncPreview = () => {
      setPreview((current) => ({
        ...current,
        title: readTextValue('title'),
        hostName: readTextValue('hostName'),
        location: readTextValue('location'),
        description: readTextValue('description'),
        startsAt: readTextValue('startsAt') || null,
        templateKey: readTextValue('templateKey') || 'classic',
        heroUrl: updateAssetPreview(heroInput, 'heroUrl', initialEvent.heroUrl),
        emblemUrl: updateAssetPreview(emblemInput, 'emblemUrl', initialEvent.emblemUrl),
        watermarkUrl: updateAssetPreview(watermarkInput, 'watermarkUrl', initialEvent.watermarkUrl),
      }));
    };

    syncPreview();
    form.addEventListener('input', syncPreview);
    form.addEventListener('change', syncPreview);
    heroInput?.addEventListener('change', syncPreview);
    emblemInput?.addEventListener('change', syncPreview);
    watermarkInput?.addEventListener('change', syncPreview);

    return () => {
      form.removeEventListener('input', syncPreview);
      form.removeEventListener('change', syncPreview);
      heroInput?.removeEventListener('change', syncPreview);
      emblemInput?.removeEventListener('change', syncPreview);
      watermarkInput?.removeEventListener('change', syncPreview);
      Object.values(currentObjectUrls).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [initialEvent]);

  const presentation = useMemo(() => {
    const base = buildInvitationPresentation({
      appUrl,
      inviteUrl: '#preview',
      event: {
        title: preview.title,
        hostName: preview.hostName,
        location: preview.location,
        description: preview.description,
        startsAt: preview.startsAt,
        templateKey: preview.templateKey,
        heroImagePath: null,
        emblemImagePath: null,
        watermarkImagePath: null,
      },
      guest: {
        name: 'Your guest',
        canBringPlusOne: true,
      },
    });

    return {
      ...base,
      assetUrls: {
        hero: preview.heroUrl,
        emblem: preview.emblemUrl,
        watermark: preview.watermarkUrl,
      },
    };
  }, [appUrl, preview]);

  return (
    <aside className="stack panel invitation-preview-panel">
      <div className="stack compact-info">
        <h2>Live invitation preview</h2>
        <p className="muted">
          This mirrors the editable text and graphic slots now, so the same seams can graduate into full WYSIWYG controls later.
        </p>
      </div>

      <div className="stack invitation-preview-stack">
        <section className={`${presentation.theme.previewCardClassName} ${presentation.theme.pageClassName} invitation-main-card invitation-shell invitation-card-frame invitation-preview-card`}>
          {presentation.assetUrls.watermark ? <img className="invitation-watermark" src={presentation.assetUrls.watermark} alt="" /> : null}
          {presentation.assetUrls.hero ? (
            <img className={`${presentation.theme.heroClassName} invitation-hero-frame`} src={presentation.assetUrls.hero} alt={`${presentation.title} hero`} />
          ) : null}
          <div className={presentation.theme.contentClassName}>
            <section className="stack invitation-main-copy invitation-copy-panel" aria-label="Invitation details preview">
              <div className="stack compact-info invitation-heading-block">
                {presentation.assetUrls.emblem ? <img className="invitation-emblem" src={presentation.assetUrls.emblem} alt="Event emblem" /> : null}
                <p className="eyebrow">{presentation.eyebrow}</p>
                <p className="invitation-kicker">{presentation.introTitle}</p>
                <h1>{presentation.title}</h1>
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
              <section className="stack compact-info invitation-about-panel">
                <h3>About this event</h3>
                <p className="pre-wrap">{presentation.description}</p>
                <p className="muted invitation-plus-one-note">{presentation.plusOneText}</p>
              </section>
            </section>
          </div>
        </section>

        <section className={`${presentation.theme.previewCardClassName} ${presentation.theme.pageClassName} invitation-response-card invitation-card-frame invitation-preview-card invitation-preview-response-card`}>
          <div className="stack compact-info invitation-rsvp-copy invitation-rsvp-copy-shell">
            <h3>{presentation.rsvpHeading}</h3>
            <p className="muted">Preview only — guest responses still happen on the live invite page.</p>
          </div>
          <div className={`${presentation.theme.rsvpPanelClassName} invitation-rsvp-form invitation-preview-form invitation-rsvp-form-shell`}>
            <label>
              RSVP status
              <select disabled defaultValue="GOING">
                <option value="GOING">Going</option>
              </select>
            </label>
            <label>
              Note
              <textarea disabled rows={3} defaultValue="Preview only" />
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}
