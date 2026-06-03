Flicklet — Global Cursor Rules

Purpose: This document governs all Cursor-driven work across the Flicklet repository. It defines scope control, paths, environments, branching, testing, security, accessibility, performance, and rollback standards.

For phase-specific rules (e.g., Mobile Compact V1 on React V2), keep a separate file that overrides these global rules for that phase only.

1) Scope & Source of Truth

Every Cursor task must declare scope at the top: active app, directories allowed, and explicit out-of-scope items.

Phase-specific rules (e.g., MOBILE_COMPACT_RULES.md) override this document within their declared scope.

If any rule conflicts, the narrower phase doc wins for its scope. This global doc remains the default everywhere else.

Required banner for each task
ACTIVE APP: <apps/web | www>
ALLOWED PATHS: <list>
HARD BLOCKS: <list>
NO UI/BEHAVIOR CHANGE? <yes/no>
ROLLBACK: <one-line instruction>

2) Repository Structure
apps/web/                 # React V2 app (primary)
www/                      # Legacy V1 (vanilla) app (read-only unless explicitly scoped)
tests/                    # Playwright and other tests (organized by app)
reports/                  # Static analysis outputs (organized by app/scope)
legacy/                   # Archived artifacts (never executed)


Primary app: apps/web (React V2)
Legacy app: www (vanilla V1). Do not modify unless a task explicitly says “Legacy V1.”

3) Environments & Servers

React V2 dev server: http://localhost:8888

Do not start a second dev server if one is already running.

Tests should use E2E_BASE_URL env var (default http://localhost:8888).

If a task needs a different port or app, declare it in the task banner.

4) Branching, Commits, and Tags

Default branch: main

Branch naming:

Feature: feat/<area>/<short-name>

Fix: fix/<area>/<short-name>

Chore: chore/<area>/<short-name>

Commit style: Conventional commits (e.g., feat(tokens): add compact gate)

Tags: Use archive/<name>-YYYYMMDD for archived work; release tags follow SemVer if applicable.

5) Feature Flags

Flags are gate first, code later. Default OFF.

LocalStorage key format: flag:<name>

React V2 helper (apps/web/src/lib/flags.ts or .tsx):

export function flag(name: string): boolean {
  try {
    const v = localStorage.getItem('flag:' + name);
    if (v !== null) return v === 'true';
  } catch {}
  return false;
}


When a UI depends on a flag, add an attribute gate on <html> or a top provider. Remove the flag after one release cycle if the feature is permanent.

6) Paths & Ownership

React V2 work: apps/web/**

Legacy V1 work: www/** only if the task explicitly says so.

Tests: tests/** grouped by app and feature.

Reports: reports/** grouped by app and feature.

Archives: move mis-scoped or retired files to legacy/<reason>/... with a commit message explaining the move.

7) Styling & Tokens

Prefer CSS variables/tokens and cascade over specificity hacks.

Avoid !important. If unavoidable for third-party overrides:

Comment format: /* OVERRIDE: <lib> | <reason> | <owner> | expires:<date> */

Token changes must be scoped and gated when experimental.

Do not invent parallel token names (e.g., --*-compact) if the intent is to override existing tokens under a gate. Override the real tokens inside a gated selector.

8) Testing & Quality
Playwright (E2E)

Base URL: process.env.E2E_BASE_URL || 'http://localhost:8888'

Tests must fail on any console error.

Place tests under tests/e2e/<app>/<feature>/....

Unit/Component tests

Keep them colocated with source or in a __tests__ folder under the same app.

Reports

Static analyses go to reports/, named clearly by app and feature (e.g., v2-css-specificity-mobile.csv).

9) Accessibility (WCAG 2.1 AA)

ARIA roles, labels, and focus management are mandatory for dialogs/sheets/menus.

Color contrast AA minimums.

Keyboard access for all interactive elements.

Add at least one a11y smoke test per new surface if UI is in scope.

10) Security & Secrets

No secrets in the repo. Use environment variables or platform-specific secret stores.

CSP should be defined in the app’s config (e.g., Vite, hosting config), not sprinkled inline without review.

Sanitize inputs and validate API responses.

11) Performance

Budget for mobile first. Keep rails and lists efficient.

Prefer lazy loading, request coalescing, and memoization where it pays off.

Avoid layout thrash; use CSS whenever possible.

12) Server Management Rule

Do not start additional dev servers inside Cursor tasks. The user controls the dev server lifecycle.

If a test requires a server, assume it is already running on the declared port.

13) PR Checklist (binary acceptance)

 Scope banner present and correct (active app, allowed paths, hard blocks).

 Only files in allowed paths changed.

 If “no UI change,” screenshots and visual diffs are not required.

 Tests pass with zero console errors.

 Feature flags default OFF and are gated.

 Rollback is one flag flip or a single revert commit.

14) Rollback

Flagged features: turn the flag OFF.

Merged branches: revert the merge commit by SHA, or tag-based rollback if tagged.

Archived work: move files to legacy/<reason>/... to keep history.

15) Working With Multiple Apps

React V2 (apps/web) is the default active app.

To work on Legacy V1 (www), the task banner must say:

ACTIVE APP: www (Legacy V1)
HARD BLOCKS: apps/web/**


Never mix changes across apps in one PR.

16) Coding Standards (brief)

TypeScript/JavaScript: Descriptive names, avoid magic numbers, handle errors.

React: Functional components, hooks, no side effects in render, memoize where appropriate.

CSS: BEM-like or component-scoped styles, tokens for theming, attribute/data-driven state when possible.

17) Tooling

Node/PNPM/Yarn: Use the versions defined in the repo (engines or .nvmrc if present).

Linters/Formatters: ESLint + Prettier; run on commit or in CI as configured.

CI: Respect CI scripts; do not add new steps without approval.

18) Task Template (copy/paste)
ROLE: <role> in STRICT PM MODE
BRANCH: <type/area-name>
GOAL: <one-sentence goal>

ACTIVE APP: <apps/web | www>
ALLOWED PATHS: <exact globs>
HARD BLOCKS: <exact globs>
NO UI/BEHAVIOR CHANGE: <yes/no>

TASKS:
1) <step one>
2) <step two>
3) <step three>

CONSTRAINTS:
- <hard constraints>
- <do-nots>

OUTPUT:
- <files to expect>

ACCEPTANCE (BINARY):
- <checklist>

ROLLBACK:
- <flag flip or revert steps>

19) Maintenance

Update this file only when repo-wide norms change.

Keep phase-specific rules separate and link to them from the task banner.

Archive deprecated guidance under legacy/ with a date-stamped tag.