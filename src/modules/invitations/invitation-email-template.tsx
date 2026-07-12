import type { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';
import { fontCssFamily, type DesignBlock } from '@/modules/invitations/invitation-design';

type InvitationPresentation = ReturnType<typeof buildInvitationPresentation>;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderOptionalImage(src: string | null, alt: string, style: string) {
  if (!src) {
    return '';
  }

  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="${style}" />`;
}

function designStyle(presentation: InvitationPresentation, block: DesignBlock, extra = '') {
  const style = presentation.design.typography[block];
  return `font-family:${escapeHtml(fontCssFamily(style.fontFamily))};font-size:${style.fontSize}px;font-weight:${style.fontWeight};font-style:${style.fontStyle};text-align:${style.textAlign};${extra}`;
}

export function buildInvitationEmailHtml(presentation: InvitationPresentation) {
  const { theme, assetUrls } = presentation;

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background-color:${theme.emailStyles.pageBackground};color:${theme.emailStyles.textColor};font-family:${theme.emailStyles.fontFamily};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:linear-gradient(180deg, ${theme.emailStyles.cardBackground} 0%, ${theme.emailStyles.pageBackground} 100%);border:2px solid ${theme.emailStyles.borderColor};border-radius:6px;overflow:hidden;position:relative;box-shadow:0 16px 40px rgba(15,23,42,0.12);">
              <tbody>
                ${assetUrls.hero ? `<tr><td style="padding:24px 24px 0 24px;">${renderOptionalImage(assetUrls.hero, `${presentation.title} hero`, 'width:100%;display:block;max-height:220px;object-fit:cover;border-radius:6px;border:1px solid rgba(139,125,82,0.25);')}</td></tr>` : ''}
                <tr>
                  <td style="padding:32px;position:relative;">
                    ${assetUrls.watermark ? renderOptionalImage(assetUrls.watermark, '', 'position:absolute;inset:48px auto auto 50%;width:260px;transform:translateX(-50%);opacity:0.1;pointer-events:none;') : ''}
                    <div style="position:relative;z-index:1;border:1px solid ${theme.emailStyles.borderColor};border-radius:6px;padding:24px;background:${theme.emailStyles.panelBackground};text-align:center;">
                      ${renderOptionalImage(assetUrls.emblem, 'Event emblem', 'width:84px;height:84px;object-fit:contain;margin:0 auto 16px auto;display:block;padding:6px;border:1px solid rgba(181,153,92,0.34);border-radius:999px;background:radial-gradient(circle, rgba(255,251,241,0.95) 0%, rgba(245,236,216,0.86) 72%, rgba(181,153,92,0.1) 100%);')}
                      <p style="${designStyle(presentation, 'eyebrow', 'text-transform:uppercase;letter-spacing:0.18em;color:' + theme.emailStyles.accentColor + ';margin:0;')}">${escapeHtml(presentation.design.content.eyebrow)}</p>
                      <p style="${designStyle(presentation, 'introTitle', 'text-transform:uppercase;letter-spacing:0.18em;color:' + theme.emailStyles.accentColor + ';margin:12px 0 0 0;')}">${escapeHtml(presentation.design.content.introTitle)}</p>
                      <h1 style="${designStyle(presentation, 'title', 'margin:12px 0;line-height:1.08;letter-spacing:0.06em;text-transform:uppercase;')}">${escapeHtml(presentation.title)}</h1>
                      <p style="${designStyle(presentation, 'hostLine', 'margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.08em;')}">${escapeHtml(presentation.design.content.hostLine)}</p>
                      <p style="${designStyle(presentation, 'guestLine', 'margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.08em;')}">${escapeHtml(presentation.design.content.guestLine)}</p>
                      <p style="margin:0;font-size:18px;">${escapeHtml(presentation.emailIntro)}</p>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;position:relative;z-index:1;">
                      <tbody>
                        <tr>
                          <td style="padding:16px;border:1px solid ${theme.emailStyles.borderColor};background-color:${theme.emailStyles.panelBackground};">
                            <strong style="${designStyle(presentation, 'whenLabel')}">${escapeHtml(presentation.design.content.whenLabel)}</strong>
                            <div style="${designStyle(presentation, 'whenValue')}">${escapeHtml(presentation.whenText)}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px;border:1px solid ${theme.emailStyles.borderColor};background-color:${theme.emailStyles.panelBackground};">
                            <strong style="${designStyle(presentation, 'whereLabel')}">${escapeHtml(presentation.design.content.whereLabel)}</strong>
                            <div style="${designStyle(presentation, 'whereValue')}">${escapeHtml(presentation.whereText)}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="${designStyle(presentation, 'description', 'margin-top:24px;')}">${escapeHtml(presentation.description)}</p>
                    <p style="${designStyle(presentation, 'plusOneText', 'margin-top:12px;')}">${escapeHtml(presentation.plusOneText)}</p>
                    <div style="margin-top:28px;text-align:center;position:relative;z-index:1;">
                      <p style="${designStyle(presentation, 'rsvpHeading', 'margin:0 0 12px 0;')}">${escapeHtml(presentation.design.content.rsvpHeading)}</p>
                      <a href="${escapeHtml(presentation.inviteUrl)}" style="${designStyle(presentation, 'saveRsvpLabel', `display:inline-block;padding:14px 24px;border-radius:5px;background-color:${theme.emailStyles.buttonBackground};color:${theme.emailStyles.buttonTextColor};text-decoration:none;text-transform:uppercase;letter-spacing:0.12em;`)}">${escapeHtml(presentation.design.content.saveRsvpLabel)}</a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}

export function buildInvitationEmailText(presentation: InvitationPresentation) {
  return [
    `${presentation.title}`,
    '',
    `${presentation.emailIntro}`,
    `Hosted by ${presentation.hostName}`,
    `When: ${presentation.whenText}`,
    `Where: ${presentation.whereText}`,
    '',
    presentation.description,
    presentation.plusOneText,
    '',
    `RSVP: ${presentation.inviteUrl}`,
  ].join('\n');
}
