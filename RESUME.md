# RESUME — claude-limit-guard

> Práce přerušena kvůli limitu (5h okno na 90 %, práh 85 %) dne 2026-05-31.
> Reset 5h okna: **dnes ~06:00**. Týdenní limit: 40 % (reset 3. 6. 10:00) — v pohodě.

## Kde to je

Hotová a **commitnutá** fáze brainstorming → spec → plán. **Implementace ještě nezačala.**

- ✅ Proveditelnost ověřena: `GET https://api.anthropic.com/api/oauth/usage` funguje.
- ✅ Spec: `docs/superpowers/specs/2026-05-31-claude-limit-guard-design.md`
- ✅ Plán: `docs/superpowers/plans/2026-05-31-claude-limit-guard.md` (14 TDD úkolů)
- ⬜ Kód pluginu (`lib/`, `bin/`, `hooks/`, `.claude-plugin/`, testy) — **nic z toho zatím není**.

Git: vše commitnuto (HEAD `8c9f296`), pracovní strom čistý.

## Schválená rozhodnutí

- Plný sdílitelný plugin, runtime **Node** (v24, vestavěný fetch, 0 závislostí).
- Práh default **95 %** (per-project přepisovatelný přes `.claude/limit-guard.json`).
- Status line = **emoji + procenta** (🟢<80 / 🟡80–94 / 🔴≥práh).
- Hooky: **UserPromptSubmit + Stop + SessionStart** (Stop zapnutý, loop-guard přes existenci handoffu).
- Per-project akce v `.claude/limit-guard.md`.
- Repo: `C:\Users\filka\claude-limit-guard\`.

## Další krok (po resetu)

1. Uživatel ještě **nevybral způsob exekuce**: (1) subagent-driven (doporučeno) nebo (2) inline executing-plans. → Zeptat se / potvrdit.
2. Pak začít **Task 1** z plánu (scaffolding: `package.json` + `test/fixtures/usage-sample.json`) a pokračovat TDD úkol po úkolu.

## Pozn.
- Reálná odpověď endpointu (fixture) je v plánu v Tasku 1 a 2 — použít jako `test/fixtures/usage-sample.json`.
- Tray app monitoru běží zvlášť (viz globální paměť), s tímhle pluginem nesouvisí.
