# RESUME — claude-limit-guard

> Práce přerušena kvůli dosažení stropu (5h okno na 98 %, práh 95 %) dne 2026-05-31.
> **Reset 5h okna: dnes ~15:00 (CEST).** Týdenní limit: 51 % (reset st 3. 6. 10:00) — v pohodě.

## Stav: vše commitnuto, strom čistý, 53/53 testů zelených

HEAD `218ae67`. Plugin je funkční a nainstalovaný (status line + marketplace registrace v `~/.claude/settings.json`). Hooky se aktivují po restartu Claude Code.

## Co je hotové z poslední session

- ✅ Celý plugin (lib/ moduly, CLI, hooky, manifest, marketplace, templates, README) — taženo TDD, viz git log.
- ✅ Status line zapsán do `~/.claude/settings.json` (`statusLine`, refreshInterval 30).
- ✅ Plugin zaregistrován: `extraKnownMarketplaces.claude-limit-guard` (directory) + `enabledPlugins["claude-limit-guard@claude-limit-guard"]`.
- ✅ **Konfigurovatelnost přímo v Claude Code** (`/config`) přes `userConfig` v `plugin.json`:
  - `threshold` (číslo, default 95)
  - `locale` (BCP-47, default en-US; názvy dnů přes `Intl` → libovolný jazyk)
  - `guard_action` (text; co má AI udělat při dosažení stropu; prázdné = vestavěná rutina)
  - Čteno jako `CLAUDE_PLUGIN_OPTION_<KEY>`. Priorita: per-projekt `.claude/limit-guard.json` > `/config` volba > default.
- ✅ Ověřeno živě: `CLAUDE_PLUGIN_OPTION_LOCALE=cs-CZ` přepne `→Wed` na `→st`; context hook při 96–98 % hlásí PŘEKROČEN PRÁH.

## Další krok (po resetu) — JEDINÉ co zbývá

⬜ **Doplnit do `README.md`** dokumentaci tří nových `/config` voleb (threshold / locale / guard_action),
   jak se nastavují přes `/config` nebo `settings.json` `pluginConfigs`, a tabulku priorit
   (per-projekt soubor > /config volba > default). Kód i testy hotové, chybí jen docs.

## Pozn.
- Mechanismus env proměnných ověřen přes claude-code-guide proti docs:
  `CLAUDE_PLUGIN_OPTION_<KEY>` (plugins-reference.md). Kód čte i lower/upper variantu pro jistotu.
- Status-line stdin JSON neobsahuje `language` ani locale — proto volba přes userConfig, ne ze stdin.
- Drobnost: testy `formatReset` pinují locale explicitně; systémový default tohoto stroje je `cs-CZ`.
