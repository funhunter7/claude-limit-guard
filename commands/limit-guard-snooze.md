---
description: Temporarily snooze the claude-limit-guard guard until the next reset (or clear the snooze)
allowed-tools: Bash
argument-hint: "[clear]"
---

Communicate with the user exclusively in Czech.

The user wants to temporarily silence the guard (the Stop/UserPromptSubmit directives) — useful
when they knowingly want to keep working close to the limit without the guard nudging them.

- If `$ARGUMENTS` is empty or `set`, snooze until the next reset:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/snooze.mjs" --action set
```

- If `$ARGUMENTS` is `clear`, cancel an active snooze:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/snooze.mjs" --action clear
```

Report the command output to the user. Explain in plain Czech that while snoozed, the status line and
notifications still work normally — only the guard's "stop and save a handoff" directives are paused,
and they resume automatically after the limit resets (or when they run this command with `clear`).
