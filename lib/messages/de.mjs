// German (de) — best-effort translation, reviewed 2026-06; placeholders identical to en.mjs.
export default {
  signIn: 'anmelden',
  relIn: 'in',
  toThreshold: 'bis',
  labels: { five_hour: 'Sitzungslimit:', seven_day: 'Wochenlimit:', seven_day_opus: 'Woche Opus:', seven_day_sonnet: 'Woche Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7T', seven_day_opus: '7TO', seven_day_sonnet: '7TS' },
  statusHeader: 'claude-limit-guard Status',
  statusConfig: 'Konfiguration',
  statusHealth: 'Zustand',
  statusTokenOk: 'Token: ok',
  statusTokenMissing: 'Token: fehlt',
  statusCacheFresh: (secs) => `Cache: vor ${secs}s`,
  statusCacheNone: 'Cache: kein Cache',
  statusLineWired: 'Statusleiste: eingerichtet',
  statusLineNotWired: 'Statusleiste: nicht eingerichtet',
  statusHistoryReadings: (n) => `Verlauf: ${n} Messungen`,
  statusHistoryNone: 'Verlauf: keine Daten',
  statusGuardActionDefault: 'Standard',
  contextLabel: (line, threshold) =>
    `Abonnementlimit (claude-limit-guard): ${line}. Schwelle ${threshold}%.`,
  breach: (breached, action) => `SCHWELLE ÜBERSCHRITTEN (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Führe die Guard-Routine aus: beende den aktuellen atomaren Schritt, speichere eine Übergabe ` +
    `nach ${handoff} (was erledigt ist, was bleibt, der aktuelle git-Branch, die bisher geänderten ` +
    `Dateien, der konkrete nächste Schritt zum Fortsetzen, Reset-Zeit), sage dem Nutzer, dass er den ` +
    `PC herunterfahren kann, und nimm keine neuen Aufgaben an. Wenn .claude/limit-guard.md existiert, folge ihr.`,
  stopAction: (handoff) =>
    `Noch nicht aufhören — führe die Guard-Routine aus: beende den aktuellen atomaren Schritt, speichere ` +
    `dann eine Übergabe nach ${handoff}, die den aktuellen git-Branch, die bisher geänderten Dateien und ` +
    `den konkreten nächsten Schritt zum Fortsetzen festhält. Sage dem Nutzer, dass er den PC herunterfahren ` +
    `kann. Folge .claude/limit-guard.md, falls vorhanden.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: Limit über Schwelle ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Übergabedatei ${handoff} aus früherer, durch ein Nutzungslimit unterbrochener Arbeit gefunden. ` +
    `Biete an fortzusetzen und lies sie als Ausgangskontext.`,
  warnAction: 'Beende deinen aktuellen Schritt sauber — ein Nutzungslimit naht.',
  warn: (warned, action) => `LIMIT NÄHERT SICH (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Limit ${window} naht.`,
  notifyBreach: (window) => `Schwelle bei ${window} überschritten — Zeit zum Abschließen.`,
  notifyReset: (window) => `Limit ${window} wurde zurückgesetzt — du kannst wieder loslegen.`,
  snoozeSet: (u) => `Wächter pausiert bis ${u}.`,
  snoozeCleared: 'Pause aufgehoben.',
  snoozeNone: 'Keine aktive Pause.',
  doctorHeader: 'claude-limit-guard Selbsttest',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'OAuth-Token',
  doctor_statusline: 'Statusleiste eingerichtet',
  doctor_cache: 'Nutzungs-Cache aktuell',
  doctor_version: 'Plugin-Version',
  doctorHint_node: 'Aktualisiere Node auf v18 oder neuer.',
  doctorHint_token: 'Melde dich in Claude Code an.',
  doctorHint_statusline: 'Führe /limit-guard-setup aus, um die Statusleiste einzurichten.',
  doctorHint_cache: 'Öffne eine Claude-Code-Sitzung, damit die Statusleiste den Cache aktualisiert.',
  doctorHint_version: 'Aktualisiere das Plugin: /plugin update.',
  doctorVersionUnknown: 'neueste unbekannt',
  setupWired: 'Statusleiste in settings.json eingerichtet.',
  setupAlreadyWired: 'Statusleiste bereits eingerichtet — nichts zu tun.',
  setupBackedUp: (p) => `Vorherige Einstellungen gesichert nach ${p}.`,
  statsHeader: 'claude-limit-guard Nutzungsstatistik',
  statsNoData: 'noch keine Nutzungsdaten erfasst',
  statsReadings: (n) => `Messungen: ${n}`,
  statsPeakFiveHour: (v) => `Spitze 5h: ${v}`,
  statsPeakSevenDay: (v) => `Spitze 7T: ${v}`,
  statsResets: (n) => `Resets: ${n}`,
};
