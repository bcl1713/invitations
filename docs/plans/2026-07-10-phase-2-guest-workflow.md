# Phase 2 Guest Workflow and Dashboard Clarity Implementation Plan

> **For Hermes:** Use `subagent-driven-development` to implement this plan task-by-task.

**Goal:** Remove the confusing add-guest/send-invite gap, make invitation state obvious on the host dashboard, and lock the behavior down with regression coverage.

**Architecture:** Keep the existing single-host Next.js + Prisma shape. Extend the event dashboard summary service to expose clearer status counts, add an explicit `sendNow` branch in the existing guest-add server action instead of inventing a new workflow surface, and verify the final user journey through unit and e2e tests.

**Tech Stack:** Next.js App Router server actions, Prisma, Vitest, Playwright, TypeScript.

---

## Scope and acceptance criteria

- A host can add a guest and optionally send the invite in the same submission.
- The event dashboard makes the state model obvious: draft vs sent vs responded.
- Existing manual `Send invite` action remains available.
- RSVP counts remain correct.
- Unit tests cover the summary logic and the new add-guest/send flow.
- E2E coverage proves the real host workflow end-to-end.

## Relevant files

- `src/app/admin/events/[eventId]/actions.ts`
- `src/app/admin/events/[eventId]/page.tsx`
- `src/modules/events/event-dashboard-service.ts`
- `src/modules/events/event-service.ts`
- `src/modules/guests/guest-service.ts`
- `src/modules/invitations/invitation-service.ts`
- `tests/unit/events/event-dashboard-service.test.ts`
- `tests/e2e/local-smoke.spec.ts`

---

### Task 1: Expand dashboard summary vocabulary

**Objective:** Add explicit draft/sent/responded counts so the host dashboard reflects the actual workflow.

**Files:**
- Modify: `src/modules/events/event-dashboard-service.ts`
- Modify: `tests/unit/events/event-dashboard-service.test.ts`
- Modify: `src/modules/events/event-service.ts`

**Step 1: Write failing unit tests**

Extend `tests/unit/events/event-dashboard-service.test.ts` so the summary expectation includes:
- `draftInvites`
- `sentInvites`
- `respondedCount`

Use cases:
- guest added but not sent = draft
- sent without RSVP = sent
- sent with RSVP = responded

**Step 2: Run test to verify failure**

Run: `npm test -- tests/unit/events/event-dashboard-service.test.ts`
Expected: FAIL because the new summary fields do not exist yet.

**Step 3: Implement minimal summary changes**

Update `summarizeGuestStatuses` to return:
- `totalGuests`
- `draftInvites`
- `sentInvites`
- `respondedCount`
- `goingCount`
- `maybeCount`
- `declinedCount`
- `noResponseCount`

Rules:
- `draftInvites`: no `sentAt`
- `sentInvites`: `sentAt` present
- `respondedCount`: RSVP status is not null
- `noResponseCount`: RSVP status is null

Keep the function pure.

**Step 4: Wire the existing event service to the new shape**

Update `src/modules/events/event-service.ts` only as needed so `getEventDashboard()` passes the right input shape without changing unrelated behavior.

**Step 5: Verify pass**

Run: `npm test -- tests/unit/events/event-dashboard-service.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/modules/events/event-dashboard-service.ts src/modules/events/event-service.ts tests/unit/events/event-dashboard-service.test.ts
git commit -m "feat: clarify invitation status summary"
```

---

### Task 2: Add `sendNow` support to guest creation

**Objective:** Allow the add-guest form to create the guest and immediately issue the invite when requested.

**Files:**
- Modify: `src/app/admin/events/[eventId]/actions.ts`
- Modify: `src/modules/guests/guest-service.ts` only if a small return-shape tweak is needed
- Reuse: `src/modules/invitations/invitation-service.ts`
- Create or modify unit coverage near the action or service layer if the project already has an established pattern; otherwise keep the behavioral proof in e2e for the server action branch.

**Step 1: Inspect the current action contract**

Confirm `addGuestAction()` currently:
- requires host session
- creates guest
- revalidates the event dashboard

**Step 2: Write the smallest failing behavioral test available**

If there is a good existing unit-test seam, add coverage for:
- `sendNow = off` → guest created, no invitation issued
- `sendNow = on` → guest created, invitation issued

If there is no practical unit seam without heavy scaffolding, document that this branch will be proven in Task 4 via Playwright and keep this task implementation-only.

**Step 3: Implement the new branch**

In `addGuestAction()`:
- read `sendNow` from `FormData`
- keep `addGuest()` as the guest creation step
- if checked, call `issueInvitation(eventId, guest.id, env.APP_URL, env.APP_SECRET)`
- revalidate once at the end

Do not remove `sendInviteAction()`.

**Step 4: Verify locally**

Run the narrowest available test command first, then:
`npm run lint && npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/admin/events/[eventId]/actions.ts src/modules/guests/guest-service.ts tests/
git commit -m "feat: support add-and-send guest flow"
```

---

### Task 3: Make the host dashboard state obvious

**Objective:** Update the event dashboard UI so hosts can see what happened without guessing.

**Files:**
- Modify: `src/app/admin/events/[eventId]/page.tsx`

**Step 1: Update the add-guest form**

Add a checkbox such as:
- label: `Send invite now`
- helper copy: `Otherwise the guest stays in Draft until you click Send invite.`

Default behavior: unchecked.

**Step 2: Update the summary cards**

Replace the compact stats with clearer labels using the new summary fields:
- Guests
- Draft invites
- Invites sent
- Responded

Optionally keep Going / No response if the layout stays readable, but do not let the summary become cluttered.

**Step 3: Update guest-row wording**

Make the Invite column explicit:
- `Draft`
- `Sent`

If RSVP exists, keep the RSVP column as-is.

**Step 4: Add one short explanatory note**

Near the guests table, add a single sentence clarifying the workflow:
- adding a guest does not send unless `Send invite now` is checked
- manual send remains available per guest

**Step 5: Verify pass**

Run:
- `npm run lint`
- `npm run typecheck`

Expected: PASS

**Step 6: Commit**

```bash
git add src/app/admin/events/[eventId]/page.tsx
git commit -m "feat: clarify host invite workflow in dashboard"
```

---

### Task 4: Add end-to-end regression coverage

**Objective:** Prove the full host workflow, including the confusion we just hit in production.

**Files:**
- Modify: `tests/e2e/local-smoke.spec.ts`
- Modify: `stacks/apps/invitations/.env.local-smoke` only if test data needs adjustment

**Step 1: Add a draft-path assertion**

Extend the Playwright flow so it:
- creates an event
- adds a guest without `Send invite now`
- verifies the row shows `Draft`

**Step 2: Add the immediate-send path**

Then add another guest with `Send invite now` checked and verify the row shows `Sent`.

**Step 3: Keep the test mail-safe**

Use harmless/local test addresses in the smoke environment. Do not point this test at real Gmail delivery.

**Step 4: Run the specific e2e test**

Run: `npm test -- tests/e2e/local-smoke.spec.ts` if supported by the repo, otherwise the project’s established Playwright command.
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e/local-smoke.spec.ts stacks/apps/invitations/.env.local-smoke
git commit -m "test: cover draft and add-and-send invite flows"
```

---

### Task 5: Final verification and docs

**Objective:** Re-run the project gates, update project notes, and leave the repo in a reviewable state.

**Files:**
- Modify: `README.md` only if the host workflow description is genuinely outdated
- Modify: `/home/brian/wiki/01-Projects/invitations-platform/tasks.md`
- Modify: `/home/brian/wiki/01-Projects/invitations-platform/Index.md`
- Modify: `/home/brian/wiki/dailies/2026-07-10.md`

**Step 1: Run verification**

From `/home/brian/src/invitations` run:

```bash
npm test
npm run lint
npm run typecheck
```

Expected: PASS

**Step 2: Review diff**

Run:

```bash
git status --short
git diff --stat
```

**Step 3: Update docs**

Reflect that Phase 2 guest workflow/dashboard clarity is complete or in progress, depending on what actually shipped.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: polish host invite workflow"
```

---

## Execution rules

- TDD where there is a practical seam.
- No broad refactor of auth, RSVP, or email modules.
- Keep the manual `Send invite` action.
- No background mail automation beyond the explicit `sendNow` checkbox.
- Prefer the smallest UI change that removes the workflow ambiguity.

## Verification checklist

- [ ] Draft vs sent vs responded are visible in the dashboard summary.
- [ ] Adding a guest without `Send invite now` leaves the guest in Draft.
- [ ] Adding a guest with `Send invite now` issues an invitation immediately.
- [ ] Manual `Send invite` still works.
- [ ] Unit tests pass.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] E2E flow passes.

## Suggested execution order for subagents

1. Task 1 — summary model and unit tests
2. Task 2 — add-and-send action
3. Task 3 — dashboard UI wording
4. Task 4 — e2e regression
5. Task 5 — final verification and docs
