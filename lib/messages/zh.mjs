// Chinese, Simplified (zh) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: '登录',
  relIn: '还有',
  toThreshold: '至',
  labels: { five_hour: '会话限额:', seven_day: '每周限额:', seven_day_opus: '本周 Opus:', seven_day_sonnet: '本周 Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'claude-limit-guard 状态',
  statusConfig: '配置',
  statusHealth: '健康',
  statusTokenOk: '令牌: ok',
  statusTokenMissing: '令牌: 缺失',
  statusCacheFresh: (secs) => `缓存: ${secs}秒前`,
  statusCacheNone: '缓存: 无缓存',
  statusLineWired: '状态栏: 已接入',
  statusLineNotWired: '状态栏: 未接入',
  statusHistoryReadings: (n) => `历史: ${n} 条`,
  statusHistoryNone: '历史: 无数据',
  statusGuardActionDefault: '默认',
  contextLabel: (line, threshold) =>
    `订阅限额 (claude-limit-guard): ${line}. 阈值 ${threshold}%.`,
  breach: (breached, action) => `超过阈值 (${breached})。 ${action}`,
  contextAction: (handoff) =>
    `运行 guard 例程: 完成当前原子步骤, 将交接保存到 ${handoff} ` +
    `(已完成、剩余、当前 git 分支、目前更改的文件、恢复的具体下一步、重置时间), ` +
    `告诉用户可以关机, 并停止接受新任务。如果存在 .claude/limit-guard.md, 请遵循它。`,
  stopAction: (handoff) =>
    `先别停 — 运行 guard 例程: 完成当前原子步骤, 然后将交接保存到 ${handoff}, ` +
    `记录当前 git 分支、目前更改的文件以及恢复的具体下一步。告诉用户可以关机。` +
    `如果存在 .claude/limit-guard.md 请遵循。`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: 限额超过阈值 ${threshold}% (${breached})。 ${action}`,
  resume: (handoff) =>
    `发现交接文件 ${handoff}, 来自此前因用量限额中断的工作。` +
    `请提议恢复并将其作为初始上下文读取。`,
  warnAction: '请干净地完成当前步骤 — 用量限额即将到来。',
  warn: (warned, action) => `接近限额 (${warned})。 ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `${window} 限额即将到达。`,
  notifyBreach: (window) => `${window} 已超过阈值 — 该收尾了。`,
  statsHeader: 'claude-limit-guard 用量统计',
  statsNoData: '暂无用量数据',
  statsReadings: (n) => `读数: ${n}`,
  statsPeakFiveHour: (v) => `峰值 5h: ${v}`,
  statsPeakSevenDay: (v) => `峰值 7d: ${v}`,
  statsResets: (n) => `重置: ${n}`,
};
