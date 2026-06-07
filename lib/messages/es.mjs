// Spanish (es) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'inicia sesión',
  relIn: 'en',
  toThreshold: 'hasta',
  labels: { five_hour: 'Límite de sesión:', seven_day: 'Límite semanal:', seven_day_opus: 'Semana Opus:', seven_day_sonnet: 'Semana Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'estado de claude-limit-guard',
  statusConfig: 'Configuración',
  statusHealth: 'Salud',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: falta',
  statusCacheFresh: (secs) => `caché: hace ${secs}s`,
  statusCacheNone: 'caché: sin caché',
  statusLineWired: 'línea de estado: conectada',
  statusLineNotWired: 'línea de estado: no conectada',
  statusHistoryReadings: (n) => `historial: ${n} lecturas`,
  statusHistoryNone: 'historial: sin datos',
  statusGuardActionDefault: 'predeterminado',
  contextLabel: (line, threshold) =>
    `Límite de suscripción (claude-limit-guard): ${line}. Umbral ${threshold}%.`,
  breach: (breached, action) => `UMBRAL SUPERADO (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Ejecuta la rutina de guard: termina el paso atómico actual, guarda un traspaso en ${handoff} ` +
    `(qué está hecho, qué queda, la rama git actual, los archivos cambiados hasta ahora, el siguiente ` +
    `paso concreto para retomar, hora de reinicio), dile al usuario que puede apagar el PC y deja de ` +
    `aceptar tareas nuevas. Si existe .claude/limit-guard.md, síguelo.`,
  stopAction: (handoff) =>
    `No pares todavía — ejecuta la rutina de guard: termina el paso atómico actual, luego guarda un ` +
    `traspaso en ${handoff} que registre la rama git actual, los archivos cambiados hasta ahora y el ` +
    `siguiente paso concreto para retomar. Dile al usuario que puede apagar el PC. Sigue ` +
    `.claude/limit-guard.md si existe.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: límite sobre el umbral ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Se encontró el archivo de traspaso ${handoff} de un trabajo anterior interrumpido por un límite ` +
    `de uso. Ofrece retomar y léelo como contexto inicial.`,
  warnAction: 'Termina tu paso actual limpiamente — se acerca un límite de uso.',
  warn: (warned, action) => `LÍMITE CERCANO (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Se acerca el límite ${window}.`,
  notifyBreach: (window) => `Umbral superado en ${window} — hora de terminar.`,
  notifyReset: (window) => `Tu límite ${window} se ha reiniciado — puedes continuar.`,
  snoozeSet: (u) => `Guardia en pausa hasta ${u}.`,
  snoozeCleared: 'Pausa cancelada.',
  snoozeNone: 'No hay pausa activa.',
  statsHeader: 'estadísticas de uso de claude-limit-guard',
  statsNoData: 'aún no hay datos de uso',
  statsReadings: (n) => `lecturas: ${n}`,
  statsPeakFiveHour: (v) => `pico 5h: ${v}`,
  statsPeakSevenDay: (v) => `pico 7d: ${v}`,
  statsResets: (n) => `reinicios: ${n}`,
};
