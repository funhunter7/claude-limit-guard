// Russian (ru) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'войти',
  relIn: 'через',
  toThreshold: 'до',
  labels: { five_hour: 'Лимит сессии:', seven_day: 'Недельный лимит:', seven_day_opus: 'Неделя Opus:', seven_day_sonnet: 'Неделя Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'статус claude-limit-guard',
  statusConfig: 'Конфигурация',
  statusHealth: 'Здоровье',
  statusTokenOk: 'токен: ок',
  statusTokenMissing: 'токен: отсутствует',
  statusCacheFresh: (secs) => `кэш: ${secs}с назад`,
  statusCacheNone: 'кэш: нет кэша',
  statusLineWired: 'строка состояния: подключена',
  statusLineNotWired: 'строка состояния: не подключена',
  statusHistoryReadings: (n) => `история: ${n} замеров`,
  statusHistoryNone: 'история: нет данных',
  statusGuardActionDefault: 'по умолчанию',
  contextLabel: (line, threshold) =>
    `Лимит подписки (claude-limit-guard): ${line}. Порог ${threshold}%.`,
  breach: (breached, action) => `ПОРОГ ПРЕВЫШЕН (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Запусти рутину guard: заверши текущий атомарный шаг, сохрани передачу в ${handoff} (что сделано, что ` +
    `осталось, текущая git-ветка, изменённые до сих пор файлы, конкретный следующий шаг для возобновления, ` +
    `время сброса), скажи пользователю что он может выключить ПК и перестань брать новые задачи. Если ` +
    `существует .claude/limit-guard.md, следуй ему.`,
  stopAction: (handoff) =>
    `Ещё не останавливайся — запусти рутину guard: заверши текущий атомарный шаг, затем сохрани передачу в ` +
    `${handoff}, фиксирующую текущую git-ветку, изменённые до сих пор файлы и конкретный следующий шаг для ` +
    `возобновления. Скажи пользователю что он может выключить ПК. Следуй .claude/limit-guard.md если существует.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: лимит выше порога ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Найден файл передачи ${handoff} от прежней работы, прерванной лимитом использования. ` +
    `Предложи возобновить и прочитай его как начальный контекст.`,
  warnAction: 'Заверши текущий шаг аккуратно — приближается лимит использования.',
  warn: (warned, action) => `ПРИБЛИЖАЕТСЯ ЛИМИТ (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Приближается лимит ${window}.`,
  notifyBreach: (window) => `Порог превышен на ${window} — пора завершать.`,
  notifyReset: (window) => `Лимит ${window} сброшен — можно продолжать.`,
  statsHeader: 'статистика использования claude-limit-guard',
  statsNoData: 'данных об использовании пока нет',
  statsReadings: (n) => `замеры: ${n}`,
  statsPeakFiveHour: (v) => `пик 5h: ${v}`,
  statsPeakSevenDay: (v) => `пик 7d: ${v}`,
  statsResets: (n) => `сбросы: ${n}`,
};
