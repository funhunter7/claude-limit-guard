# Changelog

## 0.11.1 — 2026-06-13

- **Fix: a pre-existing handoff file no longer disables the Stop guard.** The `--stop` hook gated
  on `breached.length && !handoffExists()`, so if a handoff file (`.claude/RESUME.md` by default)
  was already present, the guard would silently never block — even far over threshold. A
  long-lived or committed handoff (e.g. a development `RESUME.md`) therefore permanently disabled
  the hard stop in that project, while the status line, doctor and context injection all kept
  working (so nothing flagged it). Loop prevention is now the per-window `shouldBlockStop` marker
  alone, which already blocks exactly once per reset window; once the window rolls over the guard
  blocks again and the guard action re-saves the handoff with the latest state. No config or
  status-line change — re-run `/plugin update` to pick up the fix.

## 0.11.0 — 2026-06-13

- **Status line refreshes after a limit reset.** If a session sat idle across a window's reset,
  the status line could keep showing the pre-reset value: the native `rate_limits` Claude Code
  provides on stdin only update after an API response, and the hot path trusted them
  unconditionally. Now, once a watched window's `resets_at` has passed, the plugin treats that
  data (and the cache populated from it) as stale and re-queries the OAuth usage endpoint for the
  fresh post-reset value — so the displayed number is correct the moment the status line next runs
  after a reset. The reset time is read dynamically from the data, never hard-coded. New pure
  helper `watchedExpired` in `lib/stdinUsage.mjs`.
- **`/limit-guard-setup` sets `refreshInterval: 60`.** The wired status line now re-runs on a
  60-second timer in addition to Claude Code's event-driven updates, so the value self-updates
  shortly after a reset even while the session is idle (the idle re-runs make no network call
  until a reset actually passes). Re-run `/limit-guard-setup` to add `refreshInterval` to an
  existing wiring; manual installs can add it themselves (see the README).

## 0.10.2 — 2026-06-11

- **Config hardening (audit follow-up).** A hand-edited `.claude/limit-guard.json` can no longer
  silently disable the guard: an out-of-range or non-numeric `threshold`/`warnBand` (e.g. `200`,
  `"high"`) now falls back to the default instead of being applied verbatim. Values set via
  `/limit-guard-config` were always validated; this closes the raw-file-edit gap.
- **Invalid locale no longer blanks the status line.** A structurally invalid `locale` tag
  (rejected by `Intl` with a `RangeError`) now falls back to the OS locale instead of crashing
  every formatter and rendering `limit ?`.

## 0.10.1 — 2026-06-08

- **Translation review pass.** All 14 best-effort locales were reviewed for terminology
  consistency and naturalness (en + cs unchanged). Concrete fixes: `de` unifies "status line
  wired" on *eingerichtet*, `pl` corrects the grammatical gender of *cache* (*świeży*), and
  `tr` unifies the suffix apostrophe on the straight ASCII form. The other 11 locales were
  verified already-consistent. Back-translations are recorded under `docs/superpowers/specs/`.
- **Placeholder-integrity test.** A new test exercises every interpolated message builder in
  all 16 locales with sentinel arguments, failing if any translation drops a placeholder
  (handoff path, branch, window, threshold, …) — a guard against future translation edits.

## 0.10.0 — 2026-06-07

- **Reset notification.** With `notifications` on, a one-shot OS toast now also fires when a watched
  window resets (a sharp drop vs. the previous reading), so you know the moment you're clear again.
- **`/limit-guard-doctor`.** A self-check command: Node ≥ 18, OAuth token present, status line wired,
  usage cache fresh, and installed-vs-latest plugin version — each with a fix hint when it fails.
  Health probes were extracted into `lib/health.mjs` and shared with `/limit-guard-status`.
- **`/limit-guard-setup`.** Auto-wires the status line into `~/.claude/settings.json`, backing up the
  previous file first; idempotent (a no-op when already wired) and preserves other settings keys.
- **`/limit-guard-snooze`.** Temporarily pauses the guard's stop/handoff directives until the next
  reset (`clear` cancels early). The status line and notifications keep working while snoozed.
- **14 new languages.** Messages are now split into per-language modules under `lib/messages/`, adding
  best-effort de, es, fr, it, pl, sk, uk, ru, ja, zh, ko, pt, nl, tr (en + cs remain first-class);
  any missing key falls back to English, enforced by a structural key-set test.
- **Timezone-independent formatting tests.** The formatting helpers accept an optional explicit
  `timeZone`, letting the clock/date tests be deterministic without relying on the `TZ` CI pin.

## 0.9.0 — 2026-06-07

- **Desktop notifications (opt-in).** New `notifications` option (`off` | `on`, default `off`).
  When on, a single OS notification fires when a window enters the warn band or crosses the
  threshold — macOS (`osascript`), Linux (`notify-send`), Windows (WinRT toast via PowerShell),
  all zero-dependency and best-effort. Gated once-per-crossing so the status line never spams.
- **Per-model 7-day windows.** `watch` now also accepts `seven_day_opus` / `seven_day_sonnet`,
  mapped best-effort when those (undocumented) keys appear in the payload, with localized labels
  (`Week Opus:` / `Week Sonnet:`, short `7dO` / `7dS`). The default watch is unchanged.
- **Usage history & `/limit-guard-stats`.** The status line records a throttled, rolling ~7-day
  usage log under `~/.claude`; the new `/limit-guard-stats` command summarizes it — number of
  readings, peak 5h/7d utilization, and reset count. Localized (en + cs).

## 0.8.1 — 2026-06-07

- **Projection accuracy.** History writes are now throttled to one reading per minute, and the
  projection refuses to fit a segment spanning under 2 minutes — so a fast-refreshing status
  line can no longer extrapolate a "% per minute" slope from sub-second noise (the jumpy
  `📈 ~3m` artifact). The fit also discards readings from before a window reset (a >15-point
  drop) and won't show a future ETA once the latest reading is already at/above the threshold.
- **Warn band respects per-window thresholds.** `warn_action` notices now use each window's
  effective threshold as the upper bound, closing a gap where a window with a per-window
  threshold above the global one got neither a warn nor a breach between the two values.
- **Docs & diagnostics.** README documents the v0.7/v0.8 options (`warn_action`,
  `threshold_five_hour`/`seven_day`, `label_style`, `reset_display`, `projection_display`) and
  the `/limit-guard-status` command; `/limit-guard-status` now reports those options plus a
  burn-rate history health line.

## 0.8.0 — 2026-06-07

- **Two-stage guard — `warn_action`.** Below the blocking threshold, when a watched window
  enters the warn band (`warn_band ≤ util < threshold`), the `UserPromptSubmit` hook now
  appends a gentle, **non-blocking** notice (`APPROACHING LIMIT (…)` / `BLÍŽÍ SE LIMIT (…)`).
  The hard Stop block still fires only at the threshold. Configurable via `warn_action`
  (mirrors `guard_action`); `/limit-guard-action` gained `--kind guard|warn`.
- **Per-window thresholds.** New `threshold_five_hour` / `threshold_seven_day` options let
  you set a stricter (or looser) guard threshold for a single window; unset windows fall
  back to the global `threshold`. The status-line band color uses the per-window threshold
  too. Wired through `breachedLimits(…, overrides)`, config, the picker, and `/config`.
- **Burn-rate projection.** Opt-in `projection_display` (`off` | `on`, default `off`) adds a
  compact `📈 ~1h40m to 90%` segment estimating time until the soonest watched window hits
  its threshold, from a least-squares fit of recent readings. Backed by a new bounded history
  ring buffer (`lib/history.mjs`) in the OS temp dir, written fire-and-forget per status-line
  render. Localized connector (en `to` / cs `do`).
- **Richer handoff directives.** The guard now instructs the agent to record the current
  **git branch**, the **files changed so far**, and the **concrete next step to resume** in
  the handoff (en + cs), and `templates/limit-guard.md` matches.
- **Internal:** `formatStatusLine` / `formatLimit` / `formatReset` refactored to
  options-object signatures (removes the growing positional-parameter list).

## 0.7.0 — 2026-06-06

- **Compact label style.** New `label_style` option (`full` | `short`, default `full`). With
  `short`, window labels render as `5h` / `7d` instead of the full localized words — a
  pressure valve for status-line length. Wired through `messages.mjs` (en + cs), config,
  the `/limit-guard-config` picker, and `/config`. Default output is unchanged.
- **Reset countdown.** New `reset_display` option (`clock` | `relative` | `both`, default
  `clock`). `relative` shows the time until reset (`→ in 2h13m`, Czech `→ za 2h13m`);
  `both` shows the clock plus the countdown in parentheses (`→ 06:00 (in 2h13m)`). Whole-hour
  countdowns drop the minutes (`→ in 8h`). `clock` keeps the previous behavior.
- **New `/limit-guard-status` command.** A localized diagnostic that prints the resolved
  config and a health snapshot — OAuth token present, status-line cache age, and whether the
  status line is wired in `~/.claude/settings.json` — so you can confirm the plugin is set
  up correctly. Backed by `bin/status.mjs` (pure `renderStatus` + best-effort probes).

## 0.6.0 — 2026-06-06

- **Localized status-line labels.** The window labels are now full localized words instead
  of `5h`/`7d` — English `Limit session:` / `Week Limit:`, Czech `Limit relace:` /
  `Týdenní limit:` — sourced from `messages.mjs` by the (OS-driven) locale.
- **Linting.** Added ESLint (flat config, `@eslint/js` recommended) as a devDependency with
  `npm run lint` / `npm run check`, plus a CI `lint` job on Node 22. Fixed the two findings
  it surfaced (redundant assignment in `stopGuard`, underscore-param convention).
- **Richer reset display for cross-day windows.** A reset on another day (typically the
  7-day window) now shows the full weekday plus a date and time —
  `→ Wednesday 6/3/2026 10:00` — instead of a bare abbreviation. The date follows the
  locale's field order with slash separators and a year (US month-first `6/3/2026`, Europe
  day-first `3/6/2026`, Japan `2026/6/3`). Same-day resets still render just `→ HH:MM`.
- **Locale follows the OS by default.** `locale` now defaults to `system`: weekday/date
  names and message language are read from the operating system (cross-platform — Linux
  `LANG`/`LC_*` and Windows region), so no language needs to be set. Pin a BCP-47 tag to
  override. New `resolveLocale` in `lib/format.mjs`.
- **Leaner `/config` dialog.** The OS/terminal-driven options (`locale`, `time_format`,
  `style`) are no longer prompted in `/config` since they auto-detect. `time_format` and
  `style` remain overridable on demand.
- **New `/limit-guard-config` command.** Pick settings (`threshold`, `warn_band`, `watch`,
  `time_format`, `style`) from menus instead of typing them, at global or per-project
  scope. Backed by `bin/config.mjs` and `lib/configOptions.mjs` (validated coercion) and
  generic option setters in `lib/guardConfig.mjs`.
- **Stop guard 7-day coverage.** Confirmed (with regression tests) that the Stop hook
  already blocks on the 7-day window when it crosses the threshold, not just the 5-hour one.

## 0.4.0

- **Status line honors `/config` options.** `loadConfig` now reads the plugin's options
  from `~/.claude/settings.json` `pluginConfigs[...].options`, so the status line follows
  your `threshold`, `locale`, `time_format`, `warn_band`, `watch`, and `style` settings —
  previously those reached only the hooks (via env vars Claude Code injects) and the
  status line fell back to defaults. New `lib/pluginSettings.mjs` holds the shared
  settings-path/key logic; `null` option values are treated as unset.
- **Fix: `/limit-guard-action` global writes.** `setGlobalGuard`/`clearGlobalGuard` now
  read and write `guard_action` under `pluginConfigs[...].options` (where Claude Code's
  `/config` stores it) instead of a flat key, clean up any legacy flat copy, and drop an
  emptied `options` object.

## 0.3.2

- **Fix: duplicate hooks file on load.** `hooks/hooks.json` is auto-loaded by Claude Code
  from its conventional path, so the explicit `"hooks": "./hooks/hooks.json"` in
  `plugin.json` made the loader report a "Duplicate hooks file detected" error. Dropped the
  redundant manifest field; the regression test now asserts the standard path is not
  re-referenced. (Hooks themselves work as of 0.3.1.)

## 0.3.1

- **Fix: hooks never loaded.** `hooks/hooks.json` listed the events at the top level, but
  Claude Code's plugin schema expects them nested under a top-level `hooks` record. The
  `UserPromptSubmit`/`Stop`/`SessionStart` hooks now load instead of failing validation
  on install. Added a `manifest.test.mjs` regression test for the manifest shape.

## 0.3.0

- **Configurable warning band** — new `warn_band` option (default 80) sets the amber
  threshold in the status line; previously hardcoded.
- **Configurable watch list** — `watch` (comma-separated limit windows) is now exposed in
  `/config`, not just the per-project JSON file.
- **Debug logging** — `CLAUDE_LIMIT_GUARD_DEBUG=1` prints fetch/cache/auth decisions to
  stderr to diagnose otherwise-silent status-line failures.
- **Overridable User-Agent** — `CLAUDE_LIMIT_GUARD_CC_VERSION` overrides the pinned
  `claude-code/<version>` User-Agent sent to the usage endpoint.
- Internal: `parseCwd` extracted from the stdin entrypoint and unit-tested; handoff
  existence is now checked lazily (only for `--resume-check`/`--stop`).

## 0.2.0

- **Configurable time format** — new `time_format` option (`system`/`12`/`24`).
- **Interactive guard action** — `/limit-guard-action` command sets/clears the guard
  action globally or per-project (tested helper).
- **Token state** — the status line shows `🔑 sign in` when the OAuth token is missing
  or expired, instead of a blank reading.
- **Localized messages** — guard directives and labels follow `locale` (English default,
  Czech for `cs-*`).
- **ASCII style** — new `style` option (`auto`/`emoji`/`ascii`); `auto` falls back to
  ASCII on legacy Windows console where colored emoji don't render.
- **Safer Stop hook** — the Stop guard no longer loops when a custom guard action does
  not write a handoff (one block per reset window, scoped per project).
- **Robust global config key** — the global guard action is written under the real
  `claude-limit-guard@<marketplace>` key (auto-detected, or `CLAUDE_LIMIT_GUARD_PLUGIN_KEY`
  override) instead of a hardcoded marketplace name.
- CI runs the test suite on push/PR. MIT licensed.

## 0.1.0

- Initial release: usage status line, context injection, threshold guard with
  handoff/resume, per-project and `/config` configuration.
