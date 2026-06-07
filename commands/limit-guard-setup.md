---
description: Auto-wire the claude-limit-guard status line into ~/.claude/settings.json (with a backup)
allowed-tools: Bash
---

Communicate with the user exclusively in Czech.

The user wants the plugin to wire its status line into the global settings automatically, instead of
editing `~/.claude/settings.json` by hand. Run:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/setup.mjs" "${CLAUDE_PLUGIN_ROOT}"
```

This sets `statusLine` in `~/.claude/settings.json` to run this plugin. Before overwriting, it saves a
backup next to the file (`settings.json.bak-limitguard`). If the status line is already wired, it
reports that and changes nothing. Other settings keys are preserved.

Report the command output to the user in plain Czech. Tell them the status line will appear after the
next Claude Code restart (or new session), and that the previous settings were backed up so the change
is reversible.
