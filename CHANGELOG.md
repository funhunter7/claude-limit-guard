# Changelog

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
