import type { buildInvitationPresentation } from '@/modules/invitations/invitation-presentation';

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
                      <p style="margin:0;text-transform:uppercase;letter-spacing:0.18em;color:${theme.emailStyles.accentColor};font-size:12px;">${escapeHtml(presentation.eyebrow)}</p>
                      <p style="margin:12px 0 0 0;text-transform:uppercase;letter-spacing:0.18em;color:${theme.emailStyles.accentColor};font-size:11px;">${escapeHtml(presentation.introTitle)}</p>
                      <h1 style="margin:12px 0;font-family:${theme.emailStyles.headingFontFamily};font-size:36px;line-height:1.08;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(presentation.title)}</h1>
                      <p style="margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.08em;">Hosted by <strong>${escapeHtml(presentation.hostName)}</strong></p>
                      <p style="margin:0 0 12px 0;font-style:italic;opacity:0.82;text-transform:uppercase;letter-spacing:0.08em;">Reserved for ${escapeHtml(presentation.guestName)}</p>
                      <p style="margin:0;font-size:18px;">${escapeHtml(presentation.emailIntro)}</p>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;position:relative;z-index:1;">
                      <tbody>
                        <tr>
                          <td style="padding:16px;border:1px solid ${theme.emailStyles.borderColor};background-color:${theme.emailStyles.panelBackground};">
                            <strong>When</strong>
                            <div>${escapeHtml(presentation.whenText)}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px;border:1px solid ${theme.emailStyles.borderColor};background-color:${theme.emailStyles.panelBackground};">
                            <strong>Where</strong>
                            <div>${escapeHtml(presentation.whereText)}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin-top:24px;position:relative;z-index:1;">${escapeHtml(presentation.description)}</p>
                    <p style="margin-top:12px;position:relative;z-index:1;font-style:italic;">${escapeHtml(presentation.plusOneText)}</p>
                    <div style="margin-top:28px;text-align:center;position:relative;z-index:1;">
                      <a href="${escapeHtml(presentation.inviteUrl)}" style="display:inline-block;padding:14px 24px;border-radius:5px;background-color:${theme.emailStyles.buttonBackground};color:${theme.emailStyles.buttonTextColor};text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;font-size:12px;">${escapeHtml(presentation.rsvpHeading)}</a>
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
