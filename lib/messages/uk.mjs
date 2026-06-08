// Ukrainian (uk) — best-effort translation, reviewed 2026-06; placeholders identical to en.mjs.
export default {
  signIn: 'увійти',
  relIn: 'через',
  toThreshold: 'до',
  labels: { five_hour: 'Ліміт сесії:', seven_day: 'Тижневий ліміт:', seven_day_opus: 'Тиждень Opus:', seven_day_sonnet: 'Тиждень Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'стан claude-limit-guard',
  statusConfig: 'Конфігурація',
  statusHealth: 'Здоровʼя',
  statusTokenOk: 'токен: ок',
  statusTokenMissing: 'токен: відсутній',
  statusCacheFresh: (secs) => `кеш: ${secs}с тому`,
  statusCacheNone: 'кеш: немає кешу',
  statusLineWired: 'рядок стану: підключено',
  statusLineNotWired: 'рядок стану: не підключено',
  statusHistoryReadings: (n) => `історія: ${n} показників`,
  statusHistoryNone: 'історія: немає даних',
  statusGuardActionDefault: 'за замовчуванням',
  contextLabel: (line, threshold) =>
    `Ліміт підписки (claude-limit-guard): ${line}. Поріг ${threshold}%.`,
  breach: (breached, action) => `ПОРІГ ПЕРЕВИЩЕНО (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Запусти рутину guard: заверши поточний атомарний крок, збережи передачу до ${handoff} (що зроблено, ` +
    `що лишилось, поточна git-гілка, змінені досі файли, конкретний наступний крок для відновлення, час ` +
    `скидання), скажи користувачу що він може вимкнути ПК і припини брати нові завдання. Якщо існує ` +
    `.claude/limit-guard.md, дотримуйся його.`,
  stopAction: (handoff) =>
    `Ще не зупиняйся — запусти рутину guard: заверши поточний атомарний крок, потім збережи передачу до ` +
    `${handoff}, яка фіксує поточну git-гілку, змінені досі файли та конкретний наступний крок для ` +
    `відновлення. Скажи користувачу що він може вимкнути ПК. Дотримуйся .claude/limit-guard.md якщо існує.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: ліміт понад поріг ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Знайдено файл передачі ${handoff} з попередньої роботи, перерваної лімітом використання. ` +
    `Запропонуй відновити і прочитай його як початковий контекст.`,
  warnAction: 'Заверши поточний крок акуратно — наближається ліміт використання.',
  warn: (warned, action) => `НАБЛИЖАЄТЬСЯ ЛІМІТ (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Наближається ліміт ${window}.`,
  notifyBreach: (window) => `Поріг перевищено на ${window} — час завершувати.`,
  notifyReset: (window) => `Ліміт ${window} скинуто — можна працювати далі.`,
  snoozeSet: (u) => `Сторож стишено до ${u}.`,
  snoozeCleared: 'Стишення скасовано.',
  snoozeNone: 'Немає активного стишення.',
  doctorHeader: 'самоперевірка claude-limit-guard',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'OAuth-токен',
  doctor_statusline: 'рядок стану підключено',
  doctor_cache: 'кеш використання свіжий',
  doctor_version: 'версія плагіна',
  doctorHint_node: 'Онови Node до v18 або новішої.',
  doctorHint_token: 'Увійди в Claude Code.',
  doctorHint_statusline: 'Запусти /limit-guard-setup, щоб підключити рядок стану.',
  doctorHint_cache: 'Відкрий сесію Claude Code, щоб рядок стану оновив кеш.',
  doctorHint_version: 'Онови плагін: /plugin update.',
  doctorVersionUnknown: 'остання невідома',
  setupWired: 'Рядок стану підключено до settings.json.',
  setupAlreadyWired: 'Рядок стану вже підключено — нічого робити.',
  setupBackedUp: (p) => `Попередні налаштування збережено до ${p}.`,
  statsHeader: 'статистика використання claude-limit-guard',
  statsNoData: 'поки немає даних про використання',
  statsReadings: (n) => `показники: ${n}`,
  statsPeakFiveHour: (v) => `пік 5h: ${v}`,
  statsPeakSevenDay: (v) => `пік 7d: ${v}`,
  statsResets: (n) => `скидання: ${n}`,
};
