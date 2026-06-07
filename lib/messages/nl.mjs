// Dutch (nl) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'aanmelden',
  relIn: 'over',
  toThreshold: 'tot',
  labels: { five_hour: 'Sessielimiet:', seven_day: 'Weeklimiet:', seven_day_opus: 'Week Opus:', seven_day_sonnet: 'Week Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'claude-limit-guard status',
  statusConfig: 'Configuratie',
  statusHealth: 'Gezondheid',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: ontbreekt',
  statusCacheFresh: (secs) => `cache: ${secs}s geleden`,
  statusCacheNone: 'cache: geen cache',
  statusLineWired: 'statusbalk: aangesloten',
  statusLineNotWired: 'statusbalk: niet aangesloten',
  statusHistoryReadings: (n) => `geschiedenis: ${n} metingen`,
  statusHistoryNone: 'geschiedenis: geen gegevens',
  statusGuardActionDefault: 'standaard',
  contextLabel: (line, threshold) =>
    `Abonnementslimiet (claude-limit-guard): ${line}. Drempel ${threshold}%.`,
  breach: (breached, action) => `DREMPEL OVERSCHREDEN (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Voer de guard-routine uit: rond de huidige atomaire stap af, sla een overdracht op in ${handoff} ` +
    `(wat klaar is, wat resteert, de huidige git-branch, de tot nu toe gewijzigde bestanden, de concrete ` +
    `volgende stap om te hervatten, resettijd), zeg de gebruiker dat hij de pc kan uitschakelen en neem ` +
    `geen nieuwe taken meer aan. Als .claude/limit-guard.md bestaat, volg die.`,
  stopAction: (handoff) =>
    `Stop nog niet — voer de guard-routine uit: rond de huidige atomaire stap af, sla daarna een overdracht ` +
    `op in ${handoff} die de huidige git-branch, de tot nu toe gewijzigde bestanden en de concrete volgende ` +
    `stap om te hervatten vastlegt. Zeg de gebruiker dat hij de pc kan uitschakelen. Volg ` +
    `.claude/limit-guard.md als die bestaat.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limiet boven drempel ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Overdrachtsbestand ${handoff} gevonden van eerder werk dat door een gebruikslimiet werd onderbroken. ` +
    `Bied aan te hervatten en lees het als begincontext.`,
  warnAction: 'Rond je huidige stap netjes af — een gebruikslimiet nadert.',
  warn: (warned, action) => `LIMIET NADERT (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Limiet ${window} nadert.`,
  notifyBreach: (window) => `Drempel overschreden bij ${window} — tijd om af te ronden.`,
  notifyReset: (window) => `Je ${window}-limiet is gereset — je kunt weer aan de slag.`,
  statsHeader: 'claude-limit-guard gebruiksstatistieken',
  statsNoData: 'nog geen gebruiksgegevens',
  statsReadings: (n) => `metingen: ${n}`,
  statsPeakFiveHour: (v) => `piek 5h: ${v}`,
  statsPeakSevenDay: (v) => `piek 7d: ${v}`,
  statsResets: (n) => `resets: ${n}`,
};
