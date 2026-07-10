# Phase 3 Event Authoring and Invitation Presentation Implementation Plan

> **For Hermes:** Use `subagent-driven-development` to implement this plan task-by-task.

**Goal:** Upgrade the app from a functional invite sender into a host-editable invitation experience: editable event details after creation, safer hero-image handling, and richer public invitation presentation.

**Architecture:** Keep the existing narrow Next.js + Prisma monolith. Add a small event-update service and server action for host editing, harden the asset pipeline instead of inventing a media subsystem, and improve the public invitation rendering using the existing event/invitation models. Structure work so the foundational service task lands first, then the authoring, asset, and presentation tracks can proceed mostly in parallel, followed by one integration/release pass.

**Tech Stack:** Next.js App Router server actions, Prisma, TypeScript, Vitest, Playwright, semantic-release, Docker/Portainer.

---

## Why this slice next

This is the next sensible product step because the current app can create and send invites, but hosts still have to get the event right on the first try and the public invitation page is fairly bare. The existing schema already supports `description`, `startsAt`, and `heroImagePath`, so we can unlock a much better user-facing experience without inventing new persistence models.

It is also a good fit for parallel execution:
- one small foundation task establishes the event-update seam
- authoring UI work, asset hardening, and public invitation polish can then be split across subagents with limited file overlap
- final integration/release/deploy happens once the three tracks land

---

## Scope and acceptance criteria

### In scope
- Hosts can edit event title, host name, location, start time, and description after creation.
- Hero image upload becomes safer and less fragile (type + size validation, clearer failure behavior, and sane media serving headers).
- The public invitation page feels more like a real invitation instead of a raw form wrapper.
- E2E coverage proves create → edit → upload → invitation view still works.
- Release/deploy flow follows the established pattern: subagent implementation, review, merge to `main`, semantic release, production deploy, live verification.

### Explicitly out of scope
- Multi-template invitation system
- Rich text/WYSIWYG editor
- Bulk CSV import/export
- Guest segmentation or household grouping
- SMS or non-email invite channels

---

## Parallelization map

### Must happen first
1. **Task 1 — event update domain seam**

### Can run in parallel after Task 1 lands
2. **Task 2 — host edit form and dashboard wiring**
3. **Task 3 — hero image pipeline hardening**
4. **Task 4 — public invitation presentation polish**

### Must happen after Tasks 2–4
5. **Task 5 — end-to-end regression coverage**
6. **Task 6 — release, deploy, verify, docs**

---

## Relevant files

### Existing code likely to change
- `src/app/admin/actions.ts`
- `src/app/admin/page.tsx`
- `src/app/admin/events/[eventId]/actions.ts`
- `src/app/admin/events/[eventId]/page.tsx`
- `src/app/i/[token]/page.tsx`
- `src/app/media/[fileName]/route.ts`
- `src/modules/events/event-service.ts`
- `src/modules/assets/local-asset-storage.ts`
- `src/modules/invitations/invitation-service.ts`
- `prisma/schema.prisma` *(only if a truly necessary persistence tweak appears; avoid unless forced)*

### New tests likely needed
- `tests/unit/events/event-service.test.ts`
- `tests/unit/assets/local-asset-storage.test.ts`
- `tests/unit/media/media-route.test.ts` *(or equivalent near route tests if a project pattern emerges)*
- `tests/e2e/local-smoke.spec.ts`

---

## Task 1: Add an event update service seam

**Objective:** Create the narrow domain API that lets hosts edit existing event metadata safely.

**Why first:** Tasks 2 and 4 both benefit from a clean update path and shared validation rules.

**Files:**
- Modify: `src/modules/events/event-service.ts`
- Create: `tests/unit/events/event-service.test.ts`
- Modify: `src/app/admin/actions.ts` only if a tiny helper export is needed, otherwise leave untouched

**Requirements:**
- Add `updateEvent(eventId, input)` with support for:
  - `title`
  - `hostName`
  - `location`
  - `description`
  - `startsAt`
- Preserve existing slug behavior unless title changes are explicitly meant to change public URLs. Default recommendation: **do not regenerate slug** during edits.
- Trim string fields consistently.
- Allow blank optional fields to persist as empty string / null in the current style.

**Step 1: Write failing unit tests**
- create `tests/unit/events/event-service.test.ts`
- cover:
  - updates trim whitespace
  - blank `startsAt` becomes `null`
  - slug remains unchanged on edit

**Step 2: Run narrow test to verify failure**
- Run: `npm test -- tests/unit/events/event-service.test.ts`
- Expected: FAIL because `updateEvent` and/or test seam does not exist yet.

**Step 3: Implement the minimal service**
- Add `UpdateEventInput` type.
- Implement `updateEvent()` in `src/modules/events/event-service.ts`.
- Keep the service narrow; no file upload logic here.

**Step 4: Verify pass**
- Run: `npm test -- tests/unit/events/event-service.test.ts`
- Expected: PASS

**Step 5: Sanity gate**
- Run: `npm run lint && npm run typecheck`
- Expected: PASS

**Step 6: Commit**
```bash
git add src/modules/events/event-service.ts tests/unit/events/event-service.test.ts
git commit -m "feat: add event update service"
```

---

## Task 2: Add host-side event editing on the dashboard

**Objective:** Let hosts correct event details after creation without touching the DB manually like barbarians.

**Parallel group:** Can run after Task 1.

**Files:**
- Modify: `src/app/admin/events/[eventId]/actions.ts`
- Modify: `src/app/admin/events/[eventId]/page.tsx`
- Reuse: `src/modules/events/event-service.ts`

**Requirements:**
- Add `updateEventAction(eventId, formData)`.
- Dashboard shows an editable form for current event metadata.
- Form includes:
  - title
  - host name
  - location
  - start time
  - description
- Revalidate `/admin/events/[eventId]` after save.
- Keep the guest-management form intact.

**Step 1: Add the smallest failing UI or behavioral proof possible**
- If practical, add a narrow unit test around the action contract.
- If not practical with current test seams, document that the final proof is in Task 5 e2e.

**Step 2: Implement the server action**
- Parse `startsAt` carefully from `datetime-local` input.
- Call `updateEvent(eventId, ...)`.
- Revalidate the event dashboard path once.

**Step 3: Wire the edit form into the dashboard**
- Prefill current event values.
- Use a dedicated panel distinct from the guest form.
- Keep the layout readable; do not create a sprawling control room.

**Step 4: Verify local gates**
- Run: `npm run lint && npm run typecheck`
- Expected: PASS

**Step 5: Commit**
```bash
git add src/app/admin/events/[eventId]/actions.ts src/app/admin/events/[eventId]/page.tsx
git commit -m "feat: allow editing event details"
```

---

## Task 3: Harden the hero-image pipeline

**Objective:** Make image uploads safer, more predictable, and less likely to produce a ridiculous little operational own-goal.

**Parallel group:** Can run after Task 1. Keep this task off the event-edit form files.

**Files:**
- Modify: `src/modules/assets/local-asset-storage.ts`
- Modify: `src/app/media/[fileName]/route.ts`
- Modify: `src/app/admin/events/[eventId]/actions.ts` only if upload error handling must return a stable result shape
- Create: `tests/unit/assets/local-asset-storage.test.ts`
- Create/Modify: route-level media test file if feasible under current tooling

**Requirements:**
- Enforce allowed MIME types (already present) and add explicit **file size limit**.
- Reject suspicious file names / path tricks at the media route boundary.
- Serve media with safer headers:
  - `content-type`
  - `cache-control`
  - `x-content-type-options: nosniff`
- Prefer deterministic behavior for unsupported or missing files.
- If upload fails, do not silently pretend success.

**Step 1: Write failing unit tests**
- add tests for:
  - supported PNG/JPEG/WebP passes
  - unsupported type throws
  - oversize file throws

**Step 2: Add route-level proof if practical**
- verify the media route does not serve path traversal attempts and sets `nosniff`

**Step 3: Implement minimal hardening**
- add `MAX_UPLOAD_BYTES`
- validate file size in `saveUploadedImage`
- validate `fileName` in the media route before joining the path
- add `x-content-type-options: nosniff`

**Step 4: Verify narrow tests**
- Run the narrowest test commands for the touched files.
- Then run: `npm run lint && npm run typecheck`

**Step 5: Commit**
```bash
git add src/modules/assets/local-asset-storage.ts src/app/media/[fileName]/route.ts tests/unit/assets/local-asset-storage.test.ts tests/
git commit -m "feat: harden hero image handling"
```

---

## Task 4: Polish the public invitation presentation

**Objective:** Make the invite page feel intentional and event-like, not merely technically extant.

**Parallel group:** Can run after Task 1. Avoid touching the hero-upload internals.

**Files:**
- Modify: `src/app/i/[token]/page.tsx`
- Modify: `src/modules/invitations/invitation-service.ts` only if a tiny formatting/helper seam is truly needed
- Optionally create: invitation-view unit coverage if a narrow helper is extracted

**Requirements:**
- Improve content hierarchy on the invite page:
  - title
  - host
  - when
  - where
  - description
  - RSVP section
- Keep the current RSVP workflow intact.
- Improve human-facing time display versus raw ISO mail-only formatting where relevant.
- Show friendlier empty-state copy for missing location/time/description.
- If the guest note should surface, do so only if it is tasteful and already present in the data model; otherwise leave it alone.

**Step 1: Add a narrow helper only if it improves testability**
- Avoid premature abstraction. A simple `formatEventDate()` helper is fine if needed.

**Step 2: Implement the page polish**
- improve headings and sectioning
- preserve hero-image rendering
- preserve RSVP form behavior

**Step 3: Verify static gates**
- Run: `npm run lint && npm run typecheck`
- Expected: PASS

**Step 4: Commit**
```bash
git add src/app/i/[token]/page.tsx src/modules/invitations/invitation-service.ts tests/
git commit -m "feat: improve invitation presentation"
```

---

## Task 5: Extend end-to-end smoke coverage for the new host flow

**Objective:** Prove the edited event details and upload flow survive real browser usage.

**Must wait for Tasks 2–4.**

**Files:**
- Modify: `tests/e2e/local-smoke.spec.ts`
- Modify: `stacks/apps/invitations/.env.local-smoke` only if the local flow truly needs additional knobs

**Requirements:**
- Create an event.
- Edit event metadata after creation.
- Upload a safe local hero image.
- Open the invitation page.
- Verify updated title/description/location/time appear.
- Verify the hero image renders.
- Preserve the existing draft/sent coverage unless the test must be carefully reorganized.

**Step 1: Add failing e2e assertions**
- Event edit should not yet be reflected.
- Hero image should not yet be visible before implementation.

**Step 2: Run the specific Playwright test to verify failure**
- Run the project’s established Playwright command.
- Expected: FAIL before the implementation set is complete.

**Step 3: Update the smoke scenario**
- Add a deterministic local image fixture if needed.
- Keep all test addresses local/fake.

**Step 4: Verify pass**
- Run: `npx playwright test tests/e2e/local-smoke.spec.ts`
- Expected: PASS

**Step 5: Commit**
```bash
git add tests/e2e/local-smoke.spec.ts stacks/apps/invitations/.env.local-smoke tests/fixtures/
git commit -m "test: cover event editing and hero presentation"
```

---

## Task 6: Full verification, release, deploy, docs

**Objective:** Close the loop properly: all gates, semantic release, production deploy, live verification, and project notes.

**Files:**
- Modify: `README.md` only if the current feature summary is now materially stale
- Modify: `/home/brian/wiki/01-Projects/invitations-platform/tasks.md`
- Modify: `/home/brian/wiki/01-Projects/invitations-platform/Index.md`
- Modify: `/home/brian/wiki/dailies/2026-07-10.md`
- Modify: `stacks/apps/invitations/README.md` only if deployment/runtime notes changed

**Step 1: Full local verification**
From `/home/brian/src/invitations`:
```bash
npm test
npm run lint
npm run typecheck
npx playwright test tests/e2e/local-smoke.spec.ts
```
Expected: PASS

**Step 2: Git hygiene**
- Rebase/pull if needed.
- Push `main` after the approved subagent work lands.

**Step 3: Release verification**
- Watch CI and release workflows.
- Confirm semantic-release result and tag.
- Confirm GitHub Release exists.

**Step 4: Deploy**
- Build the production image.
- Load/publish using the now-repaired deployment path.
- Redeploy the Git-backed Portainer stack using the verified payload/skill procedure.

**Step 5: Production verification**
- Verify app/db containers healthy.
- Verify `https://invites.hblucas.org/api/health` returns `{"status":"ok"}`.
- Run one cautious browser/HTTP verification of the edited invitation presentation.

**Step 6: Docs**
- update project notes/wiki
- record release tag and stack id if changed
- note any follow-up work explicitly

**Step 7: Final commit(s)**
Use conventional commits for any remaining docs/deploy fixes.

---

## Subagent execution order

### Stage A — serial foundation
- Task 1 implementer
- Task 1 spec review
- Task 1 quality review

### Stage B — parallel feature tracks
Dispatch three implementer subagents in parallel after Task 1 passes:
- Task 2 implementer (event editing)
- Task 3 implementer (asset hardening)
- Task 4 implementer (public invitation presentation)

Then run per-task reviews:
- Task 2 spec review → Task 2 quality review
- Task 3 spec review → Task 3 quality review
- Task 4 spec review → Task 4 quality review

Do not let two subagents edit `src/app/admin/events/[eventId]/actions.ts` at the same time without rebasing/coordination; Task 3 should touch that file only if truly necessary.

### Stage C — integration and release
- Task 5 implementer
- Task 5 spec review
- Task 5 quality review
- Task 6 controller-run verification/release/deploy

---

## Risks and guardrails

- **File overlap risk:** Tasks 2 and 3 may both be tempted to touch `src/app/admin/events/[eventId]/actions.ts`. Keep Task 3 out of that file unless upload error reporting genuinely requires it.
- **Over-scoping risk:** Do not let this become a template-builder project in disguise.
- **Testing seam risk:** The repo currently has light unit coverage outside a few domains. If route/action tests prove awkward, prefer honest documented reliance on stronger e2e rather than fake coverage.
- **Date formatting drift:** Use a stable display format choice consistently between host and guest surfaces.
- **Upload fixture risk:** Keep test media tiny and deterministic.
- **Release risk:** Only deploy after the full local and GitHub gates pass.

---

## Recommended follow-up slice after this one

If this phase lands cleanly, the next parallel-friendly slice should be **guest operations**:
- resend/copy invite links
- guest edit/remove
- import/export
- response summary/export

That can be staged cleanly after this authoring/presentation pass.
