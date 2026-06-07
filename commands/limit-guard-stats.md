---
description: Show a summary of recent claude-limit-guard usage (peaks, resets) from the rolling 7-day log
allowed-tools: Bash
---

Communicate with the user exclusively in Czech.

Run the stats command and show its output to the user:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/stats.mjs"
```

The command summarizes the rolling ~7-day usage log: how many readings were recorded, the peak
five-hour and seven-day utilization, and how many times a window reset.

Report the output verbatim. If it says there is no data yet, explain that the log fills in over
time as the status line records usage (about one entry per minute while Claude Code is open).
