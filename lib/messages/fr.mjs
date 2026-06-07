// French (fr) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'se connecter',
  relIn: 'dans',
  toThreshold: "jusqu'à",
  labels: { five_hour: 'Limite de session :', seven_day: 'Limite hebdo :', seven_day_opus: 'Semaine Opus :', seven_day_sonnet: 'Semaine Sonnet :' },
  labelsShort: { five_hour: '5h', seven_day: '7j', seven_day_opus: '7jO', seven_day_sonnet: '7jS' },
  statusHeader: 'état de claude-limit-guard',
  statusConfig: 'Configuration',
  statusHealth: 'Santé',
  statusTokenOk: 'token : ok',
  statusTokenMissing: 'token : manquant',
  statusCacheFresh: (secs) => `cache : il y a ${secs}s`,
  statusCacheNone: 'cache : aucun cache',
  statusLineWired: 'barre d’état : connectée',
  statusLineNotWired: 'barre d’état : non connectée',
  statusHistoryReadings: (n) => `historique : ${n} relevés`,
  statusHistoryNone: 'historique : aucune donnée',
  statusGuardActionDefault: 'par défaut',
  contextLabel: (line, threshold) =>
    `Limite d’abonnement (claude-limit-guard) : ${line}. Seuil ${threshold}%.`,
  breach: (breached, action) => `SEUIL DÉPASSÉ (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Exécute la routine de garde : termine l’étape atomique en cours, enregistre une passation dans ` +
    `${handoff} (ce qui est fait, ce qui reste, la branche git actuelle, les fichiers modifiés jusqu’ici, ` +
    `la prochaine étape concrète pour reprendre, l’heure de réinitialisation), dis à l’utilisateur qu’il ` +
    `peut éteindre le PC et n’accepte plus de nouvelles tâches. Si .claude/limit-guard.md existe, suis-le.`,
  stopAction: (handoff) =>
    `Ne t’arrête pas encore — exécute la routine de garde : termine l’étape atomique en cours, puis ` +
    `enregistre une passation dans ${handoff} qui note la branche git actuelle, les fichiers modifiés ` +
    `jusqu’ici et la prochaine étape concrète pour reprendre. Dis à l’utilisateur qu’il peut éteindre le ` +
    `PC. Suis .claude/limit-guard.md s’il existe.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard : limite au-dessus du seuil ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Fichier de passation ${handoff} trouvé, issu d’un travail antérieur interrompu par une limite ` +
    `d’usage. Propose de reprendre et lis-le comme contexte initial.`,
  warnAction: 'Termine proprement ton étape en cours — une limite d’usage approche.',
  warn: (warned, action) => `LIMITE PROCHE (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `La limite ${window} approche.`,
  notifyBreach: (window) => `Seuil dépassé sur ${window} — il est temps de conclure.`,
  notifyReset: (window) => `Ta limite ${window} a été réinitialisée — tu peux repartir.`,
  snoozeSet: (u) => `Garde mise en pause jusqu’à ${u}.`,
  snoozeCleared: 'Pause annulée.',
  snoozeNone: 'Aucune pause active.',
  statsHeader: 'statistiques d’usage claude-limit-guard',
  statsNoData: 'aucune donnée d’usage pour l’instant',
  statsReadings: (n) => `relevés : ${n}`,
  statsPeakFiveHour: (v) => `pic 5h : ${v}`,
  statsPeakSevenDay: (v) => `pic 7j : ${v}`,
  statsResets: (n) => `réinitialisations : ${n}`,
};
