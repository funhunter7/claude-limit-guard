---
description: Show the resolved claude-limit-guard config and a health snapshot (token, cache, status-line)
allowed-tools: Bash
---

Communicate with the user exclusively in Czech.

Run the diagnostic command and show its output to the user:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/status.mjs"
```

The command prints the resolved configuration (threshold, watch windows, label style, etc.) and a
quick health snapshot: whether the OAuth token is present, how old the usage cache is, and whether
the status-line is wired in `~/.claude/settings.json`.

Report the output verbatim. If the token is missing, remind the user to sign in to Claude Code.
If the status-line is not wired, remind the user to add the `statusLine` entry to
`~/.claude/settings.json` as described in the README.
