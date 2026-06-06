// User-facing strings, keyed by language. Language = the part of the BCP-47 locale
// before '-', lowercased; falls back to English. Czech strings are the verbatim
// legacy wording so cs-CZ behavior is unchanged from earlier versions.
const MESSAGES = {
  en: {
    signIn: 'sign in',
    relIn: 'in',
    // Status-line labels per limit window (keyed by the rate_limits window name).
    labels: { five_hour: 'Limit session:', seven_day: 'Week Limit:' },
    labelsShort: { five_hour: '5h', seven_day: '7d' },
    // /limit-guard-status diagnostic output strings.
    statusHeader: 'claude-limit-guard status',
    statusConfig: 'Config',
    statusHealth: 'Health',
    statusTokenOk: 'token: ok',
    statusTokenMissing: 'token: missing',
    statusCacheFresh: (secs) => `cache: ${secs}s ago`,
    statusCacheNone: 'cache: no cache',
    statusLineWired: 'status-line: wired',
    statusLineNotWired: 'status-line: not wired',
    statusGuardActionDefault: 'default',
    contextLabel: (line, threshold) =>
      `Subscription limit (claude-limit-guard): ${line}. Threshold ${threshold}%.`,
    breach: (breached, action) => `THRESHOLD EXCEEDED (${breached}). ${action}`,
    contextAction: (handoff) =>
      `Run the guard routine: finish the current atomic step, save a handoff to ${handoff} ` +
      `(what's done, what's left, affected files, next steps, reset time), tell the user ` +
      `they can shut down the PC, and stop taking new tasks. If .claude/limit-guard.md exists, follow it.`,
    stopAction: (handoff) =>
      `Don't stop yet — run the guard routine: finish the current atomic step, save a handoff ` +
      `to ${handoff}, and tell the user they can shut down the PC. Follow .claude/limit-guard.md if it exists.`,
    stopReason: (threshold, breached, action) =>
      `claude-limit-guard: limit over threshold ${threshold}% (${breached}). ${action}`,
    resume: (handoff) =>
      `Found handoff file ${handoff} from earlier work interrupted by a usage limit. ` +
      `Offer to resume and read it as initial context.`,
    // Default warn action used when the user has not configured warn_action.
    warnAction: 'Finish your current step cleanly — a usage limit is approaching.',
    warn: (warned, action) =>
      `APPROACHING LIMIT (${warned}). ${action}`,
  },
  cs: {
    signIn: 'přihlas se',
    relIn: 'za',
    labels: { five_hour: 'Limit relace:', seven_day: 'Týdenní limit:' },
    labelsShort: { five_hour: '5h', seven_day: '7d' },
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
    statusGuardActionDefault: 'výchozí',
    contextLabel: (line, threshold) =>
      `Limit předplatného (claude-limit-guard): ${line}. Práh ${threshold}%.`,
    breach: (breached, action) => `PŘEKROČEN PRÁH (${breached}). ${action}`,
    contextAction: (handoff) =>
      `Spusť guard rutinu: dokonči atomický krok, ulož handoff do ${handoff} ` +
      `(co hotovo, co zbývá, dotčené soubory, další kroky, čas resetu), ` +
      `oznam uživateli že může vypnout PC, přestaň brát nové úkoly. ` +
      `Pokud existuje .claude/limit-guard.md, řiď se jím.`,
    stopAction: (handoff) =>
      `Nepřestávej — spusť guard rutinu: dokonči atomický krok, ulož handoff do ${handoff}, ` +
      `oznam uživateli že může vypnout PC. Řiď se .claude/limit-guard.md pokud existuje.`,
    stopReason: (threshold, breached, action) =>
      `claude-limit-guard: limit přes práh ${threshold}% (${breached}). ${action}`,
    resume: (handoff) =>
      `Nalezen handoff soubor ${handoff} z dřívější práce přerušené limitem. ` +
      `Nabídni uživateli navázat a přečti jej jako výchozí kontext.`,
    // Default warn action used when the user has not configured warn_action.
    warnAction: 'Dokonči aktuální krok čistě — limit se blíží.',
    warn: (warned, action) =>
      `BLÍŽÍ SE LIMIT (${warned}). ${action}`,
  },
};

// Select the message set for a locale (e.g. 'cs-CZ' -> cs). Falls back to English.
export function getMessages(locale) {
  const lang = String(locale || 'en').toLowerCase().split('-')[0];
  return MESSAGES[lang] || MESSAGES.en;
}
