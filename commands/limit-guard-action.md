---
description: Set or clear the claude-limit-guard guard action (globally or for this project)
allowed-tools: AskUserQuestion, Bash
---

You are configuring the **guard action** for the `claude-limit-guard` plugin — the
instruction the assistant follows when a usage limit crosses the threshold.

Communicate with the user exclusively in Czech.

Steps:

1. Use **AskUserQuestion** to ask what the user wants to do. Offer these options:
   - **Globální** — set the guard action for all projects (writes `~/.claude/settings.json`).
   - **Projektový** — set it only for the current project (writes `.claude/limit-guard.json`).
   - **Vymazat** — remove a guard action (back to the built-in routine).

2. If the user chose **Vymazat**, use AskUserQuestion again to ask which level to clear:
   **globální** or **projektový**. Then run:
   - global: `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope global --action clear`
   - project: `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope project --action clear`

3. If the user chose **Globální** or **Projektový**, ask them (plain prompt) for the guard
   action text. Then run, substituting `<scope>` (global|project) and the text:
   `node "${CLAUDE_PLUGIN_ROOT}/bin/guard.mjs" --scope <scope> --action set --value "<text>"`

   The command runs in the current project directory, so project scope writes to the
   right `.claude/limit-guard.json`.

4. Report the helper's output to the user and remind them of the precedence:
   **per-project file > /config option (global) > built-in default**.

Never edit the JSON files by hand — always go through `bin/guard.mjs` so writes are
validated and other keys are preserved.
