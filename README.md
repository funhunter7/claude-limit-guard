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

The plugin exposes three settings you can change **directly in Claude Code** via `/config`
(under this plugin's options):

| Option | Type | Default | Effect |
|--------|------|---------|--------|
| `threshold` | number | `95` | At or above this usage percentage the guard routine triggers. |
| `locale` | string (BCP-47) | `en-US` | Language for the weekday in the status-line reset countdown, e.g. `cs-CZ`, `de-DE`, `ja-JP`. |
| `guard_action` | string | `""` | What Claude should do when the threshold is reached. Leave empty to use the built-in save-and-handoff routine. |
| `time_format` | string | `system` | Reset time format in the status line: `system` (follow OS), `12` (`→5:00 PM`), or `24` (`→17:00`). |

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

Usage data comes from `GET https://api.anthropic.com/api/oauth/usage` using your local
OAuth token — same source as `/usage`. Cached ~45s.
