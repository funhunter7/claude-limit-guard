// Portuguese (pt) — best-effort translation, reviewed 2026-06; placeholders identical to en.mjs.
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
  notifyReset: (window) => `Seu limite ${window} foi reiniciado — pode continuar.`,
  snoozeSet: (u) => `Guarda pausada até ${u}.`,
  snoozeCleared: 'Pausa cancelada.',
  snoozeNone: 'Nenhuma pausa ativa.',
  doctorHeader: 'autodiagnóstico do claude-limit-guard',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'token OAuth',
  doctor_statusline: 'barra de status conectada',
  doctor_cache: 'cache de uso recente',
  doctor_version: 'versão do plugin',
  doctorHint_node: 'Atualize o Node para a v18 ou mais recente.',
  doctorHint_token: 'Entre no Claude Code.',
  doctorHint_statusline: 'Execute /limit-guard-setup para conectar a barra de status.',
  doctorHint_cache: 'Abra uma sessão do Claude Code para a barra de status atualizar o cache.',
  doctorHint_version: 'Atualize o plugin: /plugin update.',
  doctorVersionUnknown: 'última desconhecida',
  setupWired: 'Barra de status conectada em settings.json.',
  setupAlreadyWired: 'Barra de status já conectada — nada a fazer.',
  setupBackedUp: (p) => `Configurações anteriores salvas em ${p}.`,
  statsHeader: 'estatísticas de uso do claude-limit-guard',
  statsNoData: 'ainda sem dados de uso',
  statsReadings: (n) => `leituras: ${n}`,
  statsPeakFiveHour: (v) => `pico 5h: ${v}`,
  statsPeakSevenDay: (v) => `pico 7d: ${v}`,
  statsResets: (n) => `resets: ${n}`,
};
