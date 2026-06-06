---
description: Set or clear the claude-limit-guard guard action or warn action (globally or for this project)
allowed-tools: AskUserQuestion, Bash
---

You are configuring **guard actions** for the `claude-limit-guard` plugin.

Communicate with the user exclusively in Czech.

There are two action types:
- **guard action** (`guard_action`) — instruction the assistant follows when the threshold is reached (blocks).
- **warn action** (`warn_action`) — gentle notice appended to context when utilization is in the warn band
  (below threshold, non-blocking).

Steps:

1. Use **AskUserQuestion** to ask what the user wants to configure. Offer these options:
   - **Guard action — globální** — set the guard action for all projects.
   - **Guard action — projektový** — set it only for the current project.
   - **Warn action — globální** — set the warn action for all projects.
   - **Warn action — projektový** — set it only for the current project.
   - **Vymazat** — remove an action (back to the built-in behaviour).

2. If the user chose **Vymazat**, use AskUserQuestion to ask:
   - Which type to clear: **guard** or **warn**.
   - Which scope: **globální** or **projektový**.

   Then run one of:
   - `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope global  --action clear --kind guard`
   - `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope project --action clear --kind guard`
   - `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope global  --action clear --kind warn`
   - `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope project --action clear --kind warn`

3. For set operations, ask the user for the action text, then run:
   `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope <scope> --action set --value "<text>" --kind <kind>`
   where `<scope>` is `global|project` and `<kind>` is `guard|warn`.

   The command runs in the current project directory, so project scope writes to the
   right `.claude/limit-guard.json`.

4. Report the helper's output to the user and remind them of the precedence:
   **per-project file > /config option (global) > built-in default**.

Never edit the JSON files by hand — always go through `bin/guard.mjs` so writes are
validated and other keys are preserved.
