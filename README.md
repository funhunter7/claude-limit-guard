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

## Per-project config
Drop `.claude/limit-guard.json` and `.claude/limit-guard.md` (copy from `templates/`)
into any project to override the threshold and the guard routine for that project.

## How it works
- **Status line** shows `🟢 5h 72% →06:00 · 🟢 7d 39% →Wed` (emoji = band, % always shown).
- **UserPromptSubmit / Stop hooks** inject the live limit; at/above the threshold they
  instruct Claude to run the guard routine.
- **SessionStart hook** offers to resume from the handoff file after a reset.

Usage data comes from `GET https://api.anthropic.com/api/oauth/usage` using your local
OAuth token — same source as `/usage`. Cached ~45s.
