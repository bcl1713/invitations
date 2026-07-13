# Phase 5 Guest Roster Management Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task, with spec-compliance and code-quality review after each task.

**Goal:** Make the host guest roster safe and efficient to operate after invitations have been created, without changing the RSVP or invitation-token model.

**Architecture:** Keep the existing Next.js App Router + Prisma monolith. Add a pure roster-query helper for search/filter behavior, narrow guest deletion and invitation-delivery service seams, and small server actions on the existing event dashboard. Preserve the current event, guest, invitation, and RSVP tables; deletion must be scoped by both `eventId` and `guestId`, and any destructive operation must be explicit in the UI.

**Tech Stack:** Next.js App Router server actions, Prisma/PostgreSQL, TypeScript, Vitest, Playwright, existing local asset storage and email client.

---

## Why this is the next phase

The current dashboard already supports:

- adding guests, including add-and-send;
- editing guest name, email, note, and plus-one permission;
- filtering by invitation/RSVP state;
- manually sending an invitation;
- exporting the guest roster as CSV.

The remaining operational gap is day-to-day roster management. A host cannot quickly find a person in a large roster, remove a mistaken entry, or tell whether the existing `Send invite` control is a first send or a resend. Those are small seams with high operator payoff and much less product risk than introducing a new import system, household model, or event lifecycle subsystem.

## Scope and acceptance criteria

### In scope

- Search guests by name or email, case-insensitively, while retaining the existing status filters.
- Preserve the selected search/filter state in the URL so refresh and back-navigation behave predictably.
- Add an explicit, host-authenticated delete-guest action scoped to the event.
- Require browser confirmation before deletion and explain that the guest's invitation/RSVP records will also be removed by the existing cascade relation.
- Make invitation action wording state-aware: `Send invite` for drafts and `Resend invite` for already-sent invitations.
- Preserve the existing token behavior: resending replaces the stored token, so an older link becomes invalid.
- Add focused unit coverage and extend the local E2E smoke flow.
- Update the dashboard/operator documentation if wording is now inaccurate.

### Explicitly out of scope

- CSV import or bulk guest operations.
- Household/group invitations.
- SMS or additional delivery channels.
- Event deletion, archiving, or duplication.
- Changes to the RSVP schema or invitation-token format.
- Background retries, delivery tracking, or bounce processing.

## Smallest safe architecture seam

1. `src/modules/events/event-dashboard-filters.ts` remains the pure URL/filter seam; extend it with a normalized search query and a pure `searchGuests()` helper rather than putting filtering logic in the page.
2. `src/modules/guests/guest-service.ts` gains `deleteGuest(eventId, guestId)` using a compound `where` condition. Prisma's existing cascade relations remove the invitation and RSVP rows.
3. `src/app/admin/events/[eventId]/actions.ts` gains `deleteGuestAction()` with `requireHostSession()`, scoped service call, a not-found guard, and one `revalidatePath()`.
4. `src/modules/invitations/invitation-service.ts` keeps resend behavior in `issueInvitation()`; the UI derives the action label from `guest.invitation?.sentAt` and documents token replacement.
5. `src/app/admin/events/[eventId]/page.tsx` wires the query state and row actions without converting the page into a client component.

No Prisma migration is expected. Confirm the existing `onDelete: Cascade` relations with tests before relying on them.

## Parallelization map

### Foundation first

1. **Task 1 — lock down roster-query and delete-service contracts**

### Can run in parallel after Task 1

2. **Task 2 — add search/filter URL state and dashboard wiring**
3. **Task 3 — add explicit delete action and confirmation UI**
4. **Task 4 — clarify send versus resend semantics**

### Must happen after Tasks 2–4

5. **Task 5 — extend local E2E coverage**
6. **Task 6 — full verification, documentation, release readiness**

Avoid having parallel workers modify `page.tsx` simultaneously; integrate Tasks 2–4 sequentially if file ownership cannot be isolated cleanly. The repository has suffered enough from optimistic file-sharing arrangements.

---

## Task 1: Define pure roster search and scoped deletion contracts

**Objective:** Establish testable domain seams before changing the dashboard.

**Files:**

- Modify: `src/modules/events/event-dashboard-filters.ts`
- Modify: `src/modules/guests/guest-service.ts`
- Modify: `tests/unit/events/event-dashboard-filters.test.ts`
- Modify: `tests/unit/guests/guest-service.test.ts`

**Step 1: Write failing search tests**

Cover:

- empty query returns all guests in original order;
- name matching is case-insensitive;
- email matching is case-insensitive;
- whitespace-only queries normalize to empty;
- search combines with the existing `all`, `draft`, `sent`, `responded`, and `no-response` filters without changing status semantics.

Run:

```bash
npm test -- tests/unit/events/event-dashboard-filters.test.ts
```

Expected: FAIL because the search helper/URL state is not yet present.

**Step 2: Implement the smallest pure helper**

Add a normalized search query and a helper that filters the already-loaded guest view models by `name` or `email`. Do not add database pagination or a new query layer in this phase.

**Step 3: Write failing deletion tests**

Cover:

- `deleteGuest(eventId, guestId)` calls Prisma with both identifiers;
- a guest from another event is not deleted;
- a missing guest returns a predictable not-found result or throws the established service error;
- the service does not perform an unscoped `delete({ where: { id: guestId } })`.

Run:

```bash
npm test -- tests/unit/guests/guest-service.test.ts
```

Expected: FAIL because the delete seam does not exist.

**Step 4: Implement scoped deletion**

Use the existing Prisma relation cascades. Keep the service responsible only for the guest record and its event scope; do not add asset or event cleanup logic.

**Step 5: Verify and commit**

```bash
npm test -- tests/unit/events/event-dashboard-filters.test.ts tests/unit/guests/guest-service.test.ts
npm run lint
npm run typecheck
git add src/modules/events/event-dashboard-filters.ts src/modules/guests/guest-service.ts tests/unit/events/event-dashboard-filters.test.ts tests/unit/guests/guest-service.test.ts
git commit -m "feat: add guest roster management seams"
```

Expected: all targeted tests, lint, and typecheck pass.

---

## Task 2: Add search while preserving status filters

**Objective:** Let hosts locate a guest without losing the current filter workflow.

**Files:**

- Modify: `src/app/admin/events/[eventId]/page.tsx`
- Modify: `src/modules/events/event-dashboard-filters.ts`
- Modify: `tests/unit/events/event-dashboard-filters.test.ts`

**Implementation:**

- Accept `guestSearch` in `searchParams`.
- Normalize it before filtering.
- Apply the existing status filter first or through the pure helper, then apply name/email search consistently.
- Add a labeled search input near the guest filter links.
- Submit through `GET` to `/admin/events/[eventId]` with `guestFilter` and `guestSearch`.
- Preserve both values in every filter link.
- Add a clear-search link when a query is active.
- Show an explicit empty result message such as `No guests match this search.`
- Use `defaultValue` from the URL rather than client-side state.

Do not introduce debounce, a client-side roster store, or database search yet; the dashboard currently loads the event roster as one bounded dataset.

**Verification:**

```bash
npm test -- tests/unit/events/event-dashboard-filters.test.ts
npm run lint
npm run typecheck
```

Add a focused Playwright assertion in the later E2E task rather than making this task dependent on the full smoke environment.

**Commit:**

```bash
git add src/app/admin/events/[eventId]/page.tsx src/modules/events/event-dashboard-filters.ts tests/unit/events/event-dashboard-filters.test.ts
git commit -m "feat: add guest roster search"
```

---

## Task 3: Add explicit delete-guest action and confirmation

**Objective:** Allow hosts to remove an incorrectly added guest without exposing an unscoped destructive operation.

**Files:**

- Modify: `src/app/admin/events/[eventId]/actions.ts`
- Modify: `src/app/admin/events/[eventId]/page.tsx`
- Modify: `tests/unit/events/guest-actions.test.ts` if the existing action seam supports it
- Create or modify: a focused route/action test if the current test pattern requires one

**Step 1: Add the server action**

Implement `deleteGuestAction(eventId, guestId)`:

- require the host session;
- call `deleteGuest(eventId, guestId)`;
- reject a zero-row/missing result with the established error style;
- revalidate `/admin/events/${eventId}` exactly once.

**Step 2: Add the row control**

- Add a `Delete guest` submit button inside each row's action stack.
- Use the existing server action binding.
- Add `formAction`/`formMethod` only if it preserves the current server-action behavior; otherwise use a small client confirmation wrapper.
- Require `window.confirm()` or an equivalent accessible confirmation control.
- State that the guest's invitation and RSVP will also be removed and that the current invitation link will no longer work.
- Do not allow deletion merely by following a GET link.

**Step 3: Verify cascade behavior**

Use the existing integration/database setup if available. Prove that deleting a guest removes its invitation and RSVP records, while another event's guest remains untouched.

**Verification:**

```bash
npm test -- tests/unit/guests/guest-service.test.ts tests/unit/events/guest-actions.test.ts
npm run lint
npm run typecheck
```

**Commit:**

```bash
git add src/app/admin/events/[eventId]/actions.ts src/app/admin/events/[eventId]/page.tsx tests/
git commit -m "feat: allow scoped guest deletion"
```

---

## Task 4: Clarify first-send versus resend behavior

**Objective:** Remove ambiguity from the invitation control and make token replacement deliberate.

**Files:**

- Modify: `src/app/admin/events/[eventId]/page.tsx`
- Modify: `src/modules/invitations/invitation-service.ts` only if a small result/semantic helper is needed
- Modify: `tests/unit/invitations/invitation-service.test.ts` or create it if no suitable coverage exists
- Modify: `README.md` or operator docs only if the current delivery description is incomplete

**Implementation:**

- Render `Send invite` when `guest.invitation?.sentAt` is absent.
- Render `Resend invite` when it is present.
- Add concise helper text: resending creates a fresh token and invalidates the previous invitation URL.
- Preserve the existing SMTP-before-persist ordering and `sentAt` update behavior.
- Do not add a separate resend table or delivery-history model.

**Tests:**

- first issue creates a sent invitation;
- subsequent issue replaces the token and updates `sentAt`;
- invitation email uses the newly generated URL;
- failure to send does not mark the invitation as sent.

**Verification:**

```bash
npm test -- tests/unit/invitations/invitation-service.test.ts
npm run lint
npm run typecheck
```

**Commit:**

```bash
git add src/app/admin/events/[eventId]/page.tsx src/modules/invitations/invitation-service.ts tests/ README.md docs/
git commit -m "feat: clarify invitation resend behavior"
```

---

## Task 5: Extend local E2E coverage

**Objective:** Prove the complete roster-management workflow through the real host UI.

**Files:**

- Modify: `tests/e2e/local-smoke.spec.ts`
- Modify: `docs/testing/local-e2e.md` only if a new setup requirement appears

**Assertions:**

1. Create the event and guests using the existing smoke flow.
2. Search by a distinctive guest name and verify only the matching row remains.
3. Search by email fragment and verify matching behavior is case-insensitive.
4. Switch between `Draft`, `Sent`, and `All` while retaining or clearing search as designed.
5. Verify the sent guest row says `Resend invite` and the draft guest row says `Send invite`.
6. Delete a disposable draft guest after accepting the confirmation dialog.
7. Verify the row disappears and the dashboard count decreases.
8. Verify the existing sent guest's invitation page still works.
9. Verify a cancelled confirmation leaves the guest intact.

Run the established local stack first, then:

```bash
npm run test:e2e -- tests/e2e/local-smoke.spec.ts
```

Expected: PASS with no real email delivery and no production database access.

**Commit:**

```bash
git add tests/e2e/local-smoke.spec.ts docs/testing/local-e2e.md
git commit -m "test: cover guest roster management"
```

---

## Task 6: Full verification and release readiness

**Objective:** Leave the phase reviewable and safe to promote through `dev` and the human-gated release flow.

**Verification commands:**

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e -- tests/e2e/local-smoke.spec.ts

git status --short --branch
git diff --stat
```

Expected:

- all unit tests pass;
- lint, typecheck, and production build pass;
- local E2E passes against the disposable stack;
- working tree is clean after committing;
- implementation branches target `dev`, not `main`.

Review explicitly for:

- event/guest authorization scope on every action;
- no destructive GET endpoint;
- confirmation text and keyboard accessibility;
- search/filter URL behavior after refresh and back navigation;
- no accidental Prisma migration or schema change;
- resend token invalidation documented and tested;
- no unbounded client-side state or accidental email delivery.

Update `README.md` or `docs/development-workflow.md` only where the shipped behavior makes the existing documentation inaccurate. Then open the PR to `dev`; do not release directly to `main`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Guest deletion removes RSVP history unexpectedly | Make the confirmation explicit; keep deletion out of bulk operations; cover cascade behavior in integration tests. |
| Cross-event deletion or ID tampering | Require host session and pass both `eventId` and `guestId` to the Prisma `where` clause; test a guest belonging to another event. |
| Resend invalidates a link someone already opened | Label the action `Resend invite`, explain token replacement, and retain the current behavior rather than silently changing it. |
| Search becomes slow as rosters grow | Keep this phase bounded to the existing loaded roster; introduce database pagination/search only after real roster sizes justify it. |
| Confirmation is bypassed or inaccessible | Use a real form POST/server action plus an accessible confirmation mechanism; verify cancel behavior in Playwright. |
| Multiple workers conflict in the dashboard page | Assign one owner for `page.tsx` integration or land Tasks 2–4 sequentially. |

## Definition of done

- [ ] Guest search works by name and email.
- [ ] Existing status filters and URL state remain correct.
- [ ] Guest deletion is host-authenticated, event-scoped, explicit, and tested.
- [ ] Cascade removal of invitation and RSVP is verified.
- [ ] First-send and resend labels are unambiguous.
- [ ] Resend token replacement is documented and tested.
- [ ] Local E2E covers search, cancel/delete, and send/resend wording.
- [ ] Full verification passes.
- [ ] Work is ready for review on `dev`, with no direct implementation PR to `main`.
