# claude-limit-guard

Claude Code plugin that watches your subscription usage limits, shows them in the
status line, injects them into Claude's context, and at a configurable threshold
runs a graceful save/handoff so work can resume after the limit resets.

## Requirements
- Node.js ≥ 18 on PATH
- Logged-in Claude Code (reads `~/.claude/.credentials.json`)

## Install (local)
```bash
claude --plugin-dir /path/to/claude-limit-guard
```
Then add the status line to `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"%LOCALAPPDATA%\\path\\to\\claude-limit-guard\\bin\\usage.mjs\" --statusline",
    "refreshInterval": 30
  }
}
```
(Use the absolute path to `bin/usage.mjs`. On macOS/Linux use a normal POSIX path.)

## Configuration

The plugin exposes these settings you can change **directly in Claude Code** via `/config`
(under this plugin's options):

| Option | Type | Default | Effect |
|--------|------|---------|--------|
| `threshold` | number | `95` | At or above this usage percentage the guard routine triggers. |
| `warn_band` | number | `80` | At or above this percentage (but below `threshold`) the status line turns amber. |
| `watch` | string (CSV) | `five_hour,seven_day` | Which limit windows to show/guard, comma-separated. |
| `locale` | string (BCP-47) | `en-US` | Language for the weekday in the status-line reset countdown, e.g. `cs-CZ`, `de-DE`, `ja-JP`. |
| `guard_action` | string | `""` | What Claude should do when the threshold is reached. Leave empty to use the built-in save-and-handoff routine. |
| `time_format` | string | `system` | Reset time format in the status line: `system` (follow OS), `12` (`→5:00 PM`), or `24` (`→17:00`). |
| `style` | string | `auto` | Status-line glyphs: `auto` (detect terminal), `emoji`, or `ascii` (safe for legacy cmd/conhost). |

### Setting them
- **`/config`** — pick the plugin and edit the values interactively (easiest).
- **`~/.claude/settings.json`** — set them under `pluginConfigs` instead:
  ```json
  {
    "pluginConfigs": {
      "claude-limit-guard@claude-limit-guard": {
        "threshold": 90,
        "locale": "cs-CZ",
        "guard_action": "Save a handoff to RESUME.md and stop."
      }
    }
  }
  ```
  Claude Code passes these to the plugin as `CLAUDE_PLUGIN_OPTION_<KEY>` env vars.

### Per-project override
Drop `.claude/limit-guard.json` and `.claude/limit-guard.md` (copy from `templates/`)
into any project to override these settings for that project only.

### Setting the guard action interactively
Run **`/limit-guard-action`** in Claude Code to set or clear the guard action without
editing JSON by hand. It asks whether to apply it **globally** (`settings.json`) or to
the **current project** (`.claude/limit-guard.json`), or to **clear** an existing one.
Writes go through a validated helper that preserves your other settings.

### Precedence (most specific wins)

| Priority | Source |
|----------|--------|
| 1 (highest) | Per-project `.claude/limit-guard.json` |
| 2 | `/config` option (a.k.a. `pluginConfigs` in `settings.json`) |
| 3 (lowest) | Built-in default |

## How it works
- **Status line** shows `🟢 5h 72% →06:00 · 🟢 7d 39% →Wed` (emoji = band, % always shown).
- **UserPromptSubmit / Stop hooks** inject the live limit; at/above the threshold they
  instruct Claude to run the guard routine.
- **SessionStart hook** offers to resume from the handoff file after a reset.
- **Localization & rendering:** messages follow `locale` (English default, Czech for
  `cs-*`). On legacy Windows console (cmd/conhost) where colored emoji don't render,
  `style: auto` falls back to ASCII (`[OK] 5h 72% ->06:00 | ...`). A missing/expired
  token shows `🔑 sign in`.

Usage data comes from `GET https://api.anthropic.com/api/oauth/usage` using your local
OAuth token — same source as `/usage`. Cached ~45s.

## Troubleshooting
The status line and hooks stay silent on failure (so a network blip never breaks your
prompt). Two environment variables help when the reading looks wrong:

| Env var | Effect |
|---------|--------|
| `CLAUDE_LIMIT_GUARD_DEBUG=1` | Print fetch/cache/auth decisions to **stderr** (`[limit-guard] …`). Set anything other than ``/`0`/`false`/`no` to enable. |
| `CLAUDE_LIMIT_GUARD_CC_VERSION` | Override the `claude-code/<version>` User-Agent sent to the usage endpoint, in case a pinned version is ever rejected. |
