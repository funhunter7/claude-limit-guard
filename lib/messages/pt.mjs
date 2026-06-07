// Portuguese (pt) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'entrar',
  relIn: 'em',
  toThreshold: 'até',
  labels: { five_hour: 'Limite de sessão:', seven_day: 'Limite semanal:', seven_day_opus: 'Semana Opus:', seven_day_sonnet: 'Semana Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'estado do claude-limit-guard',
  statusConfig: 'Configuração',
  statusHealth: 'Saúde',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: ausente',
  statusCacheFresh: (secs) => `cache: há ${secs}s`,
  statusCacheNone: 'cache: sem cache',
  statusLineWired: 'barra de status: conectada',
  statusLineNotWired: 'barra de status: não conectada',
  statusHistoryReadings: (n) => `histórico: ${n} leituras`,
  statusHistoryNone: 'histórico: sem dados',
  statusGuardActionDefault: 'padrão',
  contextLabel: (line, threshold) =>
    `Limite da assinatura (claude-limit-guard): ${line}. Limiar ${threshold}%.`,
  breach: (breached, action) => `LIMIAR EXCEDIDO (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Execute a rotina de guarda: termine o passo atômico atual, salve uma passagem em ${handoff} (o que ` +
    `está feito, o que falta, o branch git atual, os arquivos alterados até agora, o próximo passo ` +
    `concreto para retomar, hora do reset), diga ao usuário que ele pode desligar o PC e pare de aceitar ` +
    `novas tarefas. Se .claude/limit-guard.md existir, siga-o.`,
  stopAction: (handoff) =>
    `Ainda não pare — execute a rotina de guarda: termine o passo atômico atual, depois salve uma passagem ` +
    `em ${handoff} que registre o branch git atual, os arquivos alterados até agora e o próximo passo ` +
    `concreto para retomar. Diga ao usuário que ele pode desligar o PC. Siga .claude/limit-guard.md se existir.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limite acima do limiar ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Arquivo de passagem ${handoff} encontrado de um trabalho anterior interrompido por um limite de uso. ` +
    `Ofereça retomar e leia-o como contexto inicial.`,
  warnAction: 'Termine seu passo atual de forma limpa — um limite de uso se aproxima.',
  warn: (warned, action) => `LIMITE PRÓXIMO (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Aproximando-se do limite ${window}.`,
  notifyBreach: (window) => `Limiar excedido em ${window} — hora de concluir.`,
  statsHeader: 'estatísticas de uso do claude-limit-guard',
  statsNoData: 'ainda sem dados de uso',
  statsReadings: (n) => `leituras: ${n}`,
  statsPeakFiveHour: (v) => `pico 5h: ${v}`,
  statsPeakSevenDay: (v) => `pico 7d: ${v}`,
  statsResets: (n) => `resets: ${n}`,
};
