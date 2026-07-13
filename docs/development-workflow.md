# Development workflow

## Branches

- `main` is the release branch and remains human-gated.
- `dev` is the integration branch for ordinary development.
- Feature, fix, refactor, test, docs, and CI branches must start from `dev` and open pull requests back to `dev`.

## Pull-request flow

1. Create a short-lived branch from `dev`.
2. Implement the change, run the applicable checks, and self-review the diff.
3. Open a pull request targeting `dev`.
4. Hand the PR to the separate reviewer phase. The implementer must not merge its own PR.
5. After the reviewer records a passing review, apply the `review-approved` label. The repository workflow enables squash auto-merge for an open, mergeable PR targeting `dev`; GitHub still waits for the required CI checks.
6. Verify the merge commit is present on `dev` and update the Kanban phase card.

The `review-approved` label is an explicit reviewer handoff, not a substitute for review. It must only be applied after the reviewer has inspected the PR, checks, tests, and documentation impact.

## Release flow

When the accumulated work on `dev` is ready for release:

1. Open a release pull request from `dev` to `main`.
2. Run the full verification suite and review release notes, migrations, and deployment implications.
3. Brian reviews and approves the release PR.
4. Merge to `main` only after that approval. The release workflow then performs the production release/build path.

Do not open ordinary implementation PRs directly against `main`, and do not auto-merge `dev` into `main`.
