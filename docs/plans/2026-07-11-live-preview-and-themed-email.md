# Live Preview + Themed Email Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Let the host see a faithful invitation preview while editing an event, and send invite emails that visually match the chosen invitation theme.

**Architecture:** Extract the invitation presentation into shared render helpers so the public invite page and outgoing email both use the same theme metadata, copy hierarchy, and event-detail formatting. Add a host-side preview card to the admin event page that renders from the current saved event state first, then upgrade to live client-side preview from unsaved form fields with a small client component rather than a second app surface.

**Tech Stack:** Next.js App Router, React server/client components, existing template catalog/theme helpers, nodemailer, Vitest, Playwright.

---

## Design target grounded from the inspiration image

The reference image suggests a new **ceremonial / military** invitation style with these reusable traits:

- centered, highly symmetrical composition
- formal serif hierarchy
- bordered card with layered frame treatment
- olive / parchment / muted gold palette
- subdued insignia / seal / watermark motif
- official, ceremonial copy tone rather than casual party copy

### Product translation

Do **not** build a military-only one-off path. Instead:
- add a new reusable theme option such as `ceremonial` or `formal-seal`
- model theme metadata so it can carry:
  - palette tokens
  - eyebrow / intro copy
  - layout class names
  - optional emblem / watermark treatment
  - email-safe style tokens
- keep RSVP logic unchanged

---

## Current code seams

### Public invite rendering
- `src/app/i/[token]/page.tsx`
- `src/modules/templates/invitation-template-theme.ts`
- `src/modules/templates/template-catalog.ts`
- `src/app/globals.css`

### Host editing surface
- `src/app/admin/events/[eventId]/page.tsx`
- `src/app/admin/events/[eventId]/actions.ts`
- `src/modules/events/event-service.ts`

### Email sending
- `src/modules/invitations/invitation-service.ts`
- `src/modules/notifications/email-client.ts`

### Existing tests
- `tests/unit/templates/template-catalog.test.ts`
- `tests/unit/events/event-service.test.ts`
- `tests/e2e/local-smoke.spec.ts`

These are the narrow seams. No schema change is required unless we later decide to support uploaded emblems/background assets per event.

---

## Recommended implementation shape

### Shared presentation layer
Create a shared invitation-presentation module that can produce a normalized view model from event + guest data.

Suggested new files:
- `src/modules/invitations/invitation-presentation.ts`
- `src/modules/invitations/invitation-email-template.tsx`
- `src/app/admin/events/[eventId]/InvitationPreview.tsx`

Responsibilities:

1. `invitation-presentation.ts`
   - format date/time strings once
   - derive host/location/description fallbacks once
   - expose shared theme-aware copy blocks
   - expose email-safe fields (title, intro, detail rows, RSVP URL)

2. `invitation-email-template.tsx`
   - render HTML email using the same theme metadata
   - include plain-text fallback builder beside HTML builder
   - avoid fragile CSS dependencies; use table/div + inline styles suitable for mail clients

3. `InvitationPreview.tsx`
   - client component reading current form field values
   - mirrors the public invitation card inside admin
   - updates instantly as the host edits title, host name, date, location, description, template, and hero image selection state

### Preview strategy
Ship this in two passes:

1. **Saved-state preview first**
   - render preview on admin page from current event data
   - confirms layout and shared presenter are correct

2. **Live unsaved preview second**
   - wrap the event details form + preview in a small client island
   - initialize with server values
   - update preview on input events without autosaving

This keeps the seam sane and prevents turning the whole page into a client-side circus.

### Email strategy
Replace the current text-only invite in `issueInvitation()` with:
- `text`: generated from shared presenter
- `html`: generated from the themed email template

The email should visually echo the invitation, but must be simplified for email-client reality:
- same palette
- same heading hierarchy
- same ceremony/formality
- same event details structure
- optional watermark/emblem if it survives email safely
- a prominent RSVP button linking to `/i/[token]`

Do not attempt to embed the full web RSVP form inside email.

---

## Task breakdown

### Task 1: Add failing unit coverage for shared invitation presentation

**Objective:** Lock down the shared view-model contract before changing UI/email rendering.

**Files:**
- Create: `tests/unit/invitations/invitation-presentation.test.ts`
- Create: `src/modules/invitations/invitation-presentation.ts`

**Tests should cover:**
- fallback host/location/description text
- date formatting behavior
- theme-aware eyebrow / intro / RSVP heading mapping
- generated invite URL passthrough
- email/plaintext detail rows

**Run:**
- `npm test -- tests/unit/invitations/invitation-presentation.test.ts`

---

### Task 2: Extract shared presenter and keep public invite page green

**Objective:** Make `/i/[token]` consume the shared presenter without changing behavior materially.

**Files:**
- Modify: `src/app/i/[token]/page.tsx`
- Modify/Create: `src/modules/invitations/invitation-presentation.ts`
- Possibly modify: `src/modules/templates/invitation-template-theme.ts`

**Verification:**
- `npm test -- tests/unit/invitations/invitation-presentation.test.ts tests/unit/templates/template-catalog.test.ts`
- `npm run build`

---

### Task 3: Add failing email-template tests

**Objective:** Prove outgoing emails include themed HTML plus text fallback.

**Files:**
- Create: `tests/unit/invitations/invitation-email-template.test.ts`
- Create: `src/modules/invitations/invitation-email-template.tsx`

**Tests should cover:**
- subject and major copy blocks
- HTML contains title, host, date, location, RSVP CTA
- HTML theme tokens differ by template key
- plain-text output still includes RSVP URL and essential details

**Run:**
- `npm test -- tests/unit/invitations/invitation-email-template.test.ts`

---

### Task 4: Switch invite sending to themed HTML email

**Objective:** Make sent invites resemble the invitation instead of a plain transactional note.

**Files:**
- Modify: `src/modules/invitations/invitation-service.ts`
- Modify/Create: `src/modules/invitations/invitation-email-template.tsx`

**Implementation notes:**
- build presenter data after invite token creation
- pass `html` and `text` to `transport.sendMail`
- keep `subject` simple and stable

**Verification:**
- `npm test -- tests/unit/invitations/invitation-email-template.test.ts`
- update or add invitation-service mailer test if needed

---

### Task 5: Add saved-state preview to admin event page

**Objective:** Show the host what the current invitation looks like without leaving the editor.

**Files:**
- Create: `src/app/admin/events/[eventId]/InvitationPreview.tsx`
- Modify: `src/app/admin/events/[eventId]/page.tsx`
- Reuse: `src/modules/invitations/invitation-presentation.ts`

**UI shape:**
- split event editor section into form + preview
- preview card uses same theme classes as public invite where possible
- show a muted note that RSVP controls are preview-only in admin

**Verification:**
- add unit/snapshot-ish coverage only if helpful
- `npm run build`

---

### Task 6: Upgrade preview to live unsaved form mirroring

**Objective:** Make the preview respond immediately while the host edits fields.

**Files:**
- Create/Modify: `src/app/admin/events/[eventId]/InvitationPreview.tsx`
- Possibly create: `src/app/admin/events/[eventId]/EventDetailsEditor.tsx`
- Modify: `src/app/admin/events/[eventId]/page.tsx`

**Implementation notes:**
- use a small client component
- track local state for:
  - title
  - host name
  - startsAt
  - location
  - description
  - templateKey
- optionally show selected hero image preview if a new file is chosen, but this can be deferred one pass if it complicates multipart handling

**Verification:**
- Playwright should assert preview updates before save

---

### Task 7: Add a ceremonial theme inspired by the reference image

**Objective:** Translate the military invitation style into a reusable formal theme.

**Files:**
- Modify: `src/modules/templates/template-catalog.ts`
- Modify: `src/modules/templates/invitation-template-theme.ts`
- Modify: `src/app/globals.css`
- Extend: `tests/unit/templates/template-catalog.test.ts`

**Theme ingredients:**
- formal serif typography
- olive/parchment/gold palette
- framed layout
- subtle watermark / crest treatment via CSS background
- restrained wording, e.g. `cordially invited`, `reception`, `request the pleasure of your company`

**Do not require:**
- external image assets for v1
- user-uploaded insignia management

Use CSS-only framing and watermark treatment first.

---

### Task 8: Extend E2E smoke for preview and themed email

**Objective:** Prove the real host flow works.

**Files:**
- Modify: `tests/e2e/local-smoke.spec.ts`

**Assertions to add:**
- changing template updates preview before save
- changing title/location/description updates preview before save
- after send-invite, captured SMTP output contains themed HTML markers
- public invite still renders matching title/theme after save

If the local SMTP debugging server is too primitive for HTML assertions, swap to a tiny mail capture helper script for the smoke environment rather than pretending text-only verification is enough.

---

## Risks and constraints

### Safe to keep unchanged
- Prisma schema
- RSVP data model
- invite token logic
- deployment stack/env

### Risks
- turning the whole admin page into a client component unnecessarily
- duplicating invitation markup between public page, preview, and email
- overfitting the military theme into event-specific language
- using web CSS patterns that render poorly in email clients
- making preview dependent on upload persistence before save

### Mitigations
- keep a single shared presenter module
- keep email HTML intentionally simpler than the web page
- use client preview only for the editor island
- treat hero-image live preview as optional enhancement if it slows the core pass

---

## Acceptance criteria

- Host sees an invitation preview on the admin event page
- Preview updates live as core fields are edited
- Preview and public invite use the same theme vocabulary and content hierarchy
- Sent invite emails include themed HTML matching the chosen invitation style
- Plain-text email fallback remains present and correct
- Existing RSVP flow still works unchanged
- Unit tests, lint, typecheck, build, and Playwright smoke all pass

---

## Suggested commit slices

1. `test: add invitation presentation view-model coverage`
2. `refactor: share invitation presentation data`
3. `feat: add themed invitation email html`
4. `feat: add admin invitation preview`
5. `feat: make invitation preview live during editing`
6. `feat: add ceremonial invitation theme`
7. `test: extend smoke coverage for preview and themed email`

---

## Verification commands

```bash
npm test -- tests/unit/invitations/invitation-presentation.test.ts \
  tests/unit/invitations/invitation-email-template.test.ts \
  tests/unit/templates/template-catalog.test.ts

npm run test:e2e -- tests/e2e/local-smoke.spec.ts
npm run lint
npm run typecheck
npm run build
```

---

## Recommendation

Build this in the order above, with **shared presenter first**. That is the smallest seam that unlocks both preview and matching email without creating three conflicting render paths, which would be exactly the sort of avoidable mess one regrets in quiet moments.