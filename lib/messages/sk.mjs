// Slovak (sk) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'prihlás sa',
  relIn: 'za',
  toThreshold: 'do',
  labels: { five_hour: 'Limit relácie:', seven_day: 'Týždenný limit:', seven_day_opus: 'Týždeň Opus:', seven_day_sonnet: 'Týždeň Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'stav claude-limit-guard',
  statusConfig: 'Konfigurácia',
  statusHealth: 'Zdravie',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: chýba',
  statusCacheFresh: (secs) => `cache: pred ${secs}s`,
  statusCacheNone: 'cache: žiadna cache',
  statusLineWired: 'stavový riadok: zapojený',
  statusLineNotWired: 'stavový riadok: nezapojený',
  statusHistoryReadings: (n) => `história: ${n} záznamov`,
  statusHistoryNone: 'história: žiadne dáta',
  statusGuardActionDefault: 'predvolené',
  contextLabel: (line, threshold) =>
    `Limit predplatného (claude-limit-guard): ${line}. Prah ${threshold}%.`,
  breach: (breached, action) => `PREKROČENÝ PRAH (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Spusti guard rutinu: dokonči aktuálny atomický krok, ulož odovzdanie do ${handoff} (čo je hotové, ` +
    `čo zostáva, aktuálna git vetva, doteraz zmenené súbory, konkrétny ďalší krok na pokračovanie, čas ` +
    `resetu), oznám používateľovi že môže vypnúť PC a prestaň prijímať nové úlohy. Ak existuje ` +
    `.claude/limit-guard.md, riaď sa ním.`,
  stopAction: (handoff) =>
    `Ešte neprestávaj — spusti guard rutinu: dokonči aktuálny atomický krok, potom ulož odovzdanie do ` +
    `${handoff}, ktoré zaznamená aktuálnu git vetvu, doteraz zmenené súbory a konkrétny ďalší krok na ` +
    `pokračovanie. Oznám používateľovi že môže vypnúť PC. Riaď sa .claude/limit-guard.md ak existuje.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limit nad prahom ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Nájdený súbor odovzdania ${handoff} z predchádzajúcej práce prerušenej limitom. ` +
    `Ponúkni pokračovanie a prečítaj ho ako východiskový kontext.`,
  warnAction: 'Dokonči aktuálny krok čisto — limit sa blíži.',
  warn: (warned, action) => `BLÍŽI SA LIMIT (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Blíži sa limit ${window}.`,
  notifyBreach: (window) => `Prekročený prah pri ${window} — čas to uložiť.`,
  notifyReset: (window) => `Limit ${window} bol obnovený — môžeš pokračovať naplno.`,
  snoozeSet: (u) => `Strážca stíšený do ${u}.`,
  snoozeCleared: 'Stíšenie zrušené.',
  snoozeNone: 'Žiadne aktívne stíšenie.',
  doctorHeader: 'kontrola claude-limit-guard',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'OAuth token',
  doctor_statusline: 'stavový riadok zapojený',
  doctor_cache: 'čerstvá cache využitia',
  doctor_version: 'verzia pluginu',
  doctorHint_node: 'Aktualizuj Node na verziu 18 alebo novšiu.',
  doctorHint_token: 'Prihlás sa do Claude Code.',
  doctorHint_statusline: 'Spusti /limit-guard-setup na zapojenie stavového riadka.',
  doctorHint_cache: 'Otvor reláciu Claude Code, aby stavový riadok obnovil cache.',
  doctorHint_version: 'Aktualizuj plugin: /plugin update.',
  doctorVersionUnknown: 'najnovšia neznáma',
  setupWired: 'Stavový riadok zapojený do settings.json.',
  setupAlreadyWired: 'Stavový riadok už je zapojený — niet čo robiť.',
  setupBackedUp: (p) => `Predchádzajúce nastavenia zálohované do ${p}.`,
  statsHeader: 'štatistiky využitia claude-limit-guard',
  statsNoData: 'zatiaľ žiadne dáta',
  statsReadings: (n) => `záznamy: ${n}`,
  statsPeakFiveHour: (v) => `vrchol 5h: ${v}`,
  statsPeakSevenDay: (v) => `vrchol 7d: ${v}`,
  statsResets: (n) => `resety: ${n}`,
};
