# Changelog

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
