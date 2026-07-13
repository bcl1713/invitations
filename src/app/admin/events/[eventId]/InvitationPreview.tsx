'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ScaledPostcardCanvas } from '@/app/ScaledPostcardCanvas';
import { parseEventDateTimeLocal } from '@/modules/events/event-time';
import { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';
import { fontCssFamily } from '@/modules/invitations/invitation-design';
import { getInvitationTemplateTheme } from '@/modules/templates/invitation-template-theme';

type PreviewState = {
  title: string;
  hostName: string;
  location: string;
  description: string;
  startsAt: string | null;
  timeZone: string;
  templateKey: string;
  designConfig?: string;
  heroUrl: string | null;
  emblemUrl: string | null;
  watermarkUrl: string | null;
};

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

function parseDesignConfig(value: string | undefined): { content?: Record<string, string>; [key: string]: unknown } | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as { content?: Record<string, string>; [key: string]: unknown })
      : undefined;
  } catch {
    return undefined;
  }
}

function parsePreviewStartsAt(value: string | null, timeZone: string) {
  if (!value) {
    return null;
  }

  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  try {
    return parseEventDateTimeLocal(value, timeZone);
  } catch {
    return null;
  }
}

export function InvitationPreview({
  appUrl,
  initialEvent,
}: {
  appUrl: string;
  initialEvent: PreviewState;
}) {
  const [preview, setPreview] = useState(initialEvent);
  const [postcardOverflowing, setPostcardOverflowing] = useState(false);
  const objectUrls = useRef<Record<'heroUrl' | 'emblemUrl' | 'watermarkUrl', string | null>>({
    heroUrl: null,
    emblemUrl: null,
    watermarkUrl: null,
  });

  useLayoutEffect(() => {
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
      const title = readTextValue('title');
      const hostName = readTextValue('hostName');
      const location = readTextValue('location');
      const description = readTextValue('description');
      const templateKey = readTextValue('templateKey') || 'classic';
      const theme = getInvitationTemplateTheme(templateKey);
      const designConfig = parseDesignConfig(readTextValue('designConfig') || initialEvent.designConfig);

      setPreview((current) => ({
        ...current,
        title,
        hostName,
        location,
        description,
        startsAt: readTextValue('startsAt') || null,
        timeZone: readTextValue('timeZone') || initialEvent.timeZone,
        templateKey,
        designConfig: designConfig
          ? JSON.stringify({
              ...designConfig,
              content: {
                ...designConfig.content,
                eyebrow: theme.eyebrow,
                introTitle: theme.introTitle,
                title,
                hostLine: `Hosted by ${hostName}`,
                whereValue: location || 'Location details will be shared soon.',
                description,
                rsvpHeading: theme.rsvpTitle,
              },
            })
          : undefined,
        heroUrl: updateAssetPreview(heroInput, 'heroUrl', initialEvent.heroUrl),
        emblemUrl: updateAssetPreview(emblemInput, 'emblemUrl', initialEvent.emblemUrl),
        watermarkUrl: updateAssetPreview(watermarkInput, 'watermarkUrl', initialEvent.watermarkUrl),
      }));
    };

    const handleDesignChange = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
        return;
      }

      setPreview((current) => ({ ...current, designConfig: event.detail }));
    };

    window.addEventListener('invitation-design-change', handleDesignChange);
    form.addEventListener('input', syncPreview);
    form.addEventListener('change', syncPreview);
    document.addEventListener('input', syncPreview, true);
    document.addEventListener('change', syncPreview, true);
    heroInput?.addEventListener('change', syncPreview);
    emblemInput?.addEventListener('change', syncPreview);
    watermarkInput?.addEventListener('change', syncPreview);
    syncPreview();

    return () => {
      window.removeEventListener('invitation-design-change', handleDesignChange);
      form.removeEventListener('input', syncPreview);
      form.removeEventListener('change', syncPreview);
      document.removeEventListener('input', syncPreview, true);
      document.removeEventListener('change', syncPreview, true);
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
    const startsAt = parsePreviewStartsAt(preview.startsAt, preview.timeZone);
    const base = buildInvitationPresentation({
      appUrl,
      inviteUrl: '#preview',
      event: {
        title: preview.title,
        hostName: preview.hostName,
        location: preview.location,
        description: preview.description,
        startsAt,
        timeZone: preview.timeZone,
        templateKey: preview.templateKey,
        designConfig: parseDesignConfig(preview.designConfig),
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
          This preview mirrors the editable text, typography, variables, and graphic slots that will be saved with the event.
        </p>
      </div>

      <div className="stack invitation-preview-stack">
        <ScaledPostcardCanvas onOverflowChange={setPostcardOverflowing}>
          <section className={`${presentation.theme.previewCardClassName} ${presentation.theme.pageClassName} invitation-main-card invitation-shell invitation-card-frame invitation-preview-card`}>
          {presentation.assetUrls.watermark ? <img className="invitation-watermark" src={presentation.assetUrls.watermark} alt="" /> : null}
          {presentation.assetUrls.hero ? (
            <img className={`${presentation.theme.heroClassName} invitation-hero-frame`} src={presentation.assetUrls.hero} alt={`${presentation.title} hero`} />
          ) : null}
          <div className={presentation.theme.contentClassName}>
            <section className="stack invitation-main-copy invitation-copy-panel" aria-label="Invitation details preview">
              <div className="stack compact-info invitation-heading-block">
                {presentation.assetUrls.emblem ? <img className="invitation-emblem" src={presentation.assetUrls.emblem} alt="Event emblem" /> : null}
                <p className="eyebrow" style={textStyle(presentation.design, 'eyebrow')}>{presentation.design.content.eyebrow}</p>
                <p className="invitation-kicker" style={textStyle(presentation.design, 'introTitle')}>{presentation.design.content.introTitle}</p>
                <h1 aria-label={presentation.title} style={textStyle(presentation.design, 'title')}>{presentation.titleLines.map((line, index) => <span key={line + index} className="invitation-title-line">{line}</span>)}</h1>
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
              <section className="stack compact-info invitation-about-panel">
                <h3 style={textStyle(presentation.design, 'aboutHeading')}>{presentation.design.content.aboutHeading}</h3>
                <p className="pre-wrap" style={textStyle(presentation.design, 'description')}>{presentation.design.content.description}</p>
                <p className="muted invitation-plus-one-note" style={textStyle(presentation.design, 'plusOneText')}>{presentation.design.content.plusOneText}</p>
              </section>
            </section>
          </div>
          </section>
        </ScaledPostcardCanvas>
        {postcardOverflowing ? (
          <p className="invitation-overflow-warning compact-info" role="alert">
            Some postcard text exceeds the fixed 2:3 design surface and may be clipped. Reduce the copy or font size before saving.
          </p>
        ) : null}

        <section className={`${presentation.theme.previewCardClassName} ${presentation.theme.pageClassName} invitation-response-card invitation-card-frame invitation-preview-card invitation-preview-response-card`}>
          <div className="stack compact-info invitation-rsvp-copy invitation-rsvp-copy-shell">
            <h3 style={textStyle(presentation.design, 'rsvpHeading')}>{presentation.design.content.rsvpHeading}</h3>
            <p className="muted" style={textStyle(presentation.design, 'rsvpIntro')}>{presentation.design.content.rsvpIntro}</p>
          </div>
          <div className={`${presentation.theme.rsvpPanelClassName} invitation-rsvp-form invitation-preview-form invitation-rsvp-form-shell`}>
            <label>
              <span style={textStyle(presentation.design, 'rsvpStatusLabel')}>{presentation.design.content.rsvpStatusLabel}</span>
              <select disabled defaultValue="GOING">
                <option value="GOING">Going</option>
              </select>
            </label>
            <label>
              <span style={textStyle(presentation.design, 'headcountLabel')}>{presentation.design.content.headcountLabel}</span>
              <input disabled type="number" min={1} max={2} defaultValue={1} />
            </label>
            <label>
              <span style={textStyle(presentation.design, 'noteLabel')}>{presentation.design.content.noteLabel}</span>
              <textarea disabled rows={3} defaultValue="Preview only" />
            </label>
            <button type="button" disabled style={textStyle(presentation.design, 'saveRsvpLabel')}>
              {presentation.design.content.saveRsvpLabel}
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
