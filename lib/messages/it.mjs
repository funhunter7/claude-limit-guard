// Italian (it) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'accedi',
  relIn: 'tra',
  toThreshold: 'a',
  labels: { five_hour: 'Limite sessione:', seven_day: 'Limite settimanale:', seven_day_opus: 'Settimana Opus:', seven_day_sonnet: 'Settimana Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7g', seven_day_opus: '7gO', seven_day_sonnet: '7gS' },
  statusHeader: 'stato di claude-limit-guard',
  statusConfig: 'Configurazione',
  statusHealth: 'Salute',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: mancante',
  statusCacheFresh: (secs) => `cache: ${secs}s fa`,
  statusCacheNone: 'cache: nessuna cache',
  statusLineWired: 'barra di stato: collegata',
  statusLineNotWired: 'barra di stato: non collegata',
  statusHistoryReadings: (n) => `cronologia: ${n} letture`,
  statusHistoryNone: 'cronologia: nessun dato',
  statusGuardActionDefault: 'predefinito',
  contextLabel: (line, threshold) =>
    `Limite abbonamento (claude-limit-guard): ${line}. Soglia ${threshold}%.`,
  breach: (breached, action) => `SOGLIA SUPERATA (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Esegui la routine di guardia: completa il passo atomico corrente, salva un passaggio di consegne in ` +
    `${handoff} (cosa è fatto, cosa resta, il branch git corrente, i file modificati finora, il prossimo ` +
    `passo concreto per riprendere, orario di reset), di' all’utente che può spegnere il PC e smetti di ` +
    `accettare nuovi compiti. Se esiste .claude/limit-guard.md, seguilo.`,
  stopAction: (handoff) =>
    `Non fermarti ancora — esegui la routine di guardia: completa il passo atomico corrente, poi salva un ` +
    `passaggio di consegne in ${handoff} che registri il branch git corrente, i file modificati finora e ` +
    `il prossimo passo concreto per riprendere. Di' all’utente che può spegnere il PC. Segui ` +
    `.claude/limit-guard.md se esiste.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limite oltre la soglia ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Trovato il file di consegne ${handoff} da un lavoro precedente interrotto da un limite d’uso. ` +
    `Offri di riprendere e leggilo come contesto iniziale.`,
  warnAction: 'Completa il passo corrente in modo pulito — un limite d’uso si avvicina.',
  warn: (warned, action) => `LIMITE VICINO (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Limite ${window} in avvicinamento.`,
  notifyBreach: (window) => `Soglia superata su ${window} — è ora di concludere.`,
  notifyReset: (window) => `Il limite ${window} è stato azzerato — puoi ripartire.`,
  snoozeSet: (u) => `Guardia sospesa fino a ${u}.`,
  snoozeCleared: 'Sospensione annullata.',
  snoozeNone: 'Nessuna sospensione attiva.',
  doctorHeader: 'autodiagnosi di claude-limit-guard',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'token OAuth',
  doctor_statusline: 'barra di stato collegata',
  doctor_cache: 'cache d’uso recente',
  doctor_version: 'versione del plugin',
  doctorHint_node: 'Aggiorna Node alla v18 o successiva.',
  doctorHint_token: 'Accedi a Claude Code.',
  doctorHint_statusline: 'Esegui /limit-guard-setup per collegare la barra di stato.',
  doctorHint_cache: 'Apri una sessione di Claude Code affinché la barra di stato aggiorni la cache.',
  doctorHint_version: 'Aggiorna il plugin: /plugin update.',
  doctorVersionUnknown: 'ultima sconosciuta',
  statsHeader: 'statistiche d’uso di claude-limit-guard',
  statsNoData: 'ancora nessun dato d’uso',
  statsReadings: (n) => `letture: ${n}`,
  statsPeakFiveHour: (v) => `picco 5h: ${v}`,
  statsPeakSevenDay: (v) => `picco 7g: ${v}`,
  statsResets: (n) => `reset: ${n}`,
};
