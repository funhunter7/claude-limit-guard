// English strings. This is the structural template: every other locale module must
// export the exact same key set (enforced by test/messages.test.mjs).
export default {
  signIn: 'sign in',
  relIn: 'in',
  // Connector in the burn-rate projection segment: "📈 ~1h40m to 90%".
  toThreshold: 'to',
  // Status-line labels per limit window (keyed by the rate_limits window name).
  labels: { five_hour: 'Limit session:', seven_day: 'Week Limit:', seven_day_opus: 'Week Opus:', seven_day_sonnet: 'Week Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
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
  statusHistoryReadings: (n) => `history: ${n} readings`,
  statusHistoryNone: 'history: no data',
  statusGuardActionDefault: 'default',
  contextLabel: (line, threshold) =>
    `Subscription limit (claude-limit-guard): ${line}. Threshold ${threshold}%.`,
  breach: (breached, action) => `THRESHOLD EXCEEDED (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Run the guard routine: finish the current atomic step, save a handoff to ${handoff} ` +
    `(what's done, what's left, the current git branch, the files changed so far, the ` +
    `concrete next step to resume, reset time), tell the user they can shut down the PC, ` +
    `and stop taking new tasks. If .claude/limit-guard.md exists, follow it.`,
  stopAction: (handoff) =>
    `Don't stop yet — run the guard routine: finish the current atomic step, then save a handoff ` +
    `to ${handoff} that records the current git branch, the files changed so far, and the concrete ` +
    `next step to resume. Tell the user they can shut down the PC. Follow .claude/limit-guard.md if it exists.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limit over threshold ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Found handoff file ${handoff} from earlier work interrupted by a usage limit. ` +
    `Offer to resume and read it as initial context.`,
  // Default warn action used when the user has not configured warn_action.
  warnAction: 'Finish your current step cleanly — a usage limit is approaching.',
  warn: (warned, action) =>
    `APPROACHING LIMIT (${warned}). ${action}`,
  // OS notification strings (Phase C).
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Approaching the ${window} limit.`,
  notifyBreach: (window) => `Over the threshold on ${window} — time to wrap up.`,
  // /limit-guard-stats summary strings (Phase C).
  statsHeader: 'claude-limit-guard usage stats',
  statsNoData: 'no usage data recorded yet',
  statsReadings: (n) => `readings: ${n}`,
  statsPeakFiveHour: (v) => `peak 5h: ${v}`,
  statsPeakSevenDay: (v) => `peak 7d: ${v}`,
  statsResets: (n) => `resets: ${n}`,
};
