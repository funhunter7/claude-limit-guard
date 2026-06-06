# RESUME — claude-limit-guard improvements

**Saved:** 2026-06-06 (session paused near the 5-hour limit; continue after it resets ~14:40).

## Where we are
- **v0.6.0 is shipped** (main `a29d014`, tag + GitHub Release, CI green): localized labels, OS-driven locale, weekday+slash-date-with-year reset display, space after the arrow, `/limit-guard-config`, ESLint + CI lint job. Status line is live for the user (`/plugin update` done).
- **Visibility done:** README has an animated demo (`assets/demo.svg`) + static preview (`assets/status-line.svg`); repo has description + 9 topics; PR opened to ComposioHQ/awesome-claude-plugins **#269** (awaiting review). The 45k-star `hesreallyhim/awesome-claude-code` needs a **human web-form** submission by the user (text already drafted in the chat).

## What's next — execute the improvements plan
**Plan:** `docs/superpowers/plans/2026-06-06-improvements.md` (complete, TDD, web-researched).

Run it with **superpowers** (user wants superpowers for everything): subagent-driven-development (recommended) or executing-plans. **Start at Phase A, Task A1.**

- **Phase A → v0.7.0:** `label_style` (full|short), reset countdown (`reset_display`), `/limit-guard-status`.
- **Phase B → v0.8.0:** two-stage guard (`warn_action`), per-window thresholds, burn-rate projection, richer handoff.
- **Phase C → v0.9.0:** OS notifications (zero-dep), per-model 7d windows (conditional), history log + `/limit-guard-stats`.
- **Phase D:** timezone-independent tests, `/limit-guard-doctor`, Awesome badge.

Each phase ends with: `npm run check` green → finishing-a-development-branch (merge main) → bump version + CHANGELOG → tag + push + **GitHub Release** (mandatory per the always-create-github-release preference).

## Working rules for this repo
- TDD always (`node --test`, pin `TZ=Europe/Prague`); `npm run check` = eslint + tests; zero runtime deps.
- Every user-facing string via `lib/messages.mjs` (en+cs), rendered by resolved OS locale.
- Every option in BOTH `lib/config.mjs` (default/validate) AND `lib/configOptions.mjs` (picker).
- Commit/push only on request; GitHub Release for every version.

## First action on resume
Confirm the limit reset, then: brainstorm only if a design is unclear; otherwise dispatch Phase A / Task A1 (`label_style`) via subagent-driven-development.
