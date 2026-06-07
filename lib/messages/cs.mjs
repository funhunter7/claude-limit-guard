// Czech strings — verbatim legacy wording so cs-CZ behavior is unchanged from earlier versions.
export default {
  signIn: 'přihlas se',
  relIn: 'za',
  // Connector in the burn-rate projection segment: "📈 ~1h40m do 90%".
  toThreshold: 'do',
  labels: { five_hour: 'Limit relace:', seven_day: 'Týdenní limit:', seven_day_opus: 'Týden Opus:', seven_day_sonnet: 'Týden Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  // /limit-guard-status diagnostic output strings.
  statusHeader: 'stav claude-limit-guard',
  statusConfig: 'Konfigurace',
  statusHealth: 'Zdraví',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: chybí',
  statusCacheFresh: (secs) => `cache: před ${secs}s`,
  statusCacheNone: 'cache: žádná cache',
  statusLineWired: 'status-line: zapojena',
  statusLineNotWired: 'status-line: nezapojena',
  statusHistoryReadings: (n) => `history: ${n} záznamů`,
  statusHistoryNone: 'history: žádná data',
  statusGuardActionDefault: 'výchozí',
  contextLabel: (line, threshold) =>
    `Limit předplatného (claude-limit-guard): ${line}. Práh ${threshold}%.`,
  breach: (breached, action) => `PŘEKROČEN PRÁH (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Spusť guard rutinu: dokonči atomický krok, ulož handoff do ${handoff} ` +
    `(co hotovo, co zbývá, aktuální git větev, dosud změněné soubory, konkrétní další krok ` +
    `pro navázání, čas resetu), oznam uživateli že může vypnout PC, přestaň brát nové úkoly. ` +
    `Pokud existuje .claude/limit-guard.md, řiď se jím.`,
  stopAction: (handoff) =>
    `Nepřestávej — spusť guard rutinu: dokonči atomický krok, pak ulož handoff do ${handoff}, ` +
    `který zaznamená aktuální git větev, dosud změněné soubory a konkrétní další krok pro ` +
    `navázání. Oznam uživateli že může vypnout PC. Řiď se .claude/limit-guard.md pokud existuje.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limit přes práh ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Nalezen handoff soubor ${handoff} z dřívější práce přerušené limitem. ` +
    `Nabídni uživateli navázat a přečti jej jako výchozí kontext.`,
  // Default warn action used when the user has not configured warn_action.
  warnAction: 'Dokonči aktuální krok čistě — limit se blíží.',
  warn: (warned, action) =>
    `BLÍŽÍ SE LIMIT (${warned}). ${action}`,
  // OS notification strings (Phase C).
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Blíží se limit ${window}.`,
  notifyBreach: (window) => `Překročen práh u ${window} — čas to uložit.`,
  // /limit-guard-stats summary strings (Phase C).
  statsHeader: 'statistiky využití claude-limit-guard',
  statsNoData: 'zatím žádná data',
  statsReadings: (n) => `záznamů: ${n}`,
  statsPeakFiveHour: (v) => `vrchol 5h: ${v}`,
  statsPeakSevenDay: (v) => `vrchol 7d: ${v}`,
  statsResets: (n) => `resetů: ${n}`,
};
