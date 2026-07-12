# Postcard Editor and Fixed Canvas Implementation Plan

> **For Hermes:** Use the screenshot-driven UI polish workflow and verify the editor and public card with fresh screenshots before claiming completion.

**Goal:** Replace the vertically growing invitation composition with an editable portrait postcard canvas, using a fixed 2:3 aspect ratio and persisted per-block typography controls.

**Architecture:** Add a JSON-backed event design payload containing editable copy blocks and typography tokens. Normalize legacy events into defaults in the shared presentation layer. Render the same design model in the public invitation and admin preview. Add a client-side editor island with contenteditable blocks, font-family/font-size controls, and a save action that serializes the design payload through the existing server action.

**Tech Stack:** Next.js App Router, React client component, Prisma/PostgreSQL JSON field, existing shared presentation module, Vitest, Playwright.

---

## Acceptance criteria

- The main invitation card is a portrait postcard with a fixed **2:3 aspect ratio**.
- The admin preview preserves that ratio and scales as a single canvas rather than reflowing its internal layout.
- Public invitation cards preserve the same 2:3 ratio; content uses controlled overflow/fit behavior rather than making the card arbitrarily tall.
- All visible invitation copy is editable from the admin editor, including title, host/reserved lines, intro/eyebrow, when/where labels and values, about heading/body, and RSVP heading/copy.
- The editor provides font-family and font-size controls for the selected text block.
- Existing events continue rendering with legacy values through normalized defaults.
- Save/load round-trip preserves content and typography settings.
- Existing invitation, email, and RSVP behavior remains intact.

## Primary files

- Modify `prisma/schema.prisma` — add nullable JSON design payload to `Event`.
- Modify `src/modules/events/event-service.ts` — typed design input and persistence.
- Modify `src/modules/invitations/invitation-presentation.ts` — normalize design defaults and expose content/style tokens.
- Modify `src/app/admin/events/[eventId]/actions.ts` — save serialized design payload.
- Modify `src/app/admin/events/[eventId]/page.tsx` — mount editor and pass normalized design.
- Create `src/app/admin/events/[eventId]/InvitationDesignEditor.tsx` — WYSIWYG copy/style editor and controls.
- Modify `src/app/admin/events/[eventId]/InvitationPreview.tsx` — render scaled fixed-ratio postcard preview.
- Modify `src/app/i/[token]/page.tsx` — render public fixed-ratio postcard from shared design model.
- Modify `src/app/globals.css` — postcard canvas, scaled preview, editor controls.
- Modify relevant invitation unit tests and add design normalization tests.

## Design payload

Use a versioned JSON object so future schema evolution is explicit:

```ts
{
  version: 1,
  aspectRatio: "2:3",
  content: {
    eyebrow: string,
    introTitle: string,
    title: string,
    hostPrefix: string,
    guestPrefix: string,
    whenLabel: string,
    whereLabel: string,
    aboutHeading: string,
    description: string,
    rsvpHeading: string,
    rsvpIntro: string
  },
  typography: {
    [blockName]: { fontFamily: string, fontSize: number }
  }
}
```

The event's existing title/host/location/description/date remain source fields for event semantics and export/email compatibility. Design content defaults are derived from those fields, then override presentation text when saved.

## Implementation order

1. Add normalization/types and tests.
2. Add Prisma JSON field and event update persistence.
3. Replace hard-coded presentation strings with normalized editable content/style tokens.
4. Add the editor island with contenteditable blocks and toolbar controls.
5. Render the fixed 2:3 canvas in preview and public page.
6. Build/test, run a real smoke database, capture admin/public screenshots at mobile and desktop widths.
7. Commit, push, release, explicitly pull the GHCR image, redeploy Portainer stack 157, and verify health/login/container state.
