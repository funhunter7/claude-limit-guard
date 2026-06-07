// Japanese (ja) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'サインイン',
  relIn: 'あと',
  toThreshold: 'まで',
  labels: { five_hour: 'セッション上限:', seven_day: '週間上限:', seven_day_opus: '週 Opus:', seven_day_sonnet: '週 Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'claude-limit-guard ステータス',
  statusConfig: '設定',
  statusHealth: '状態',
  statusTokenOk: 'トークン: ok',
  statusTokenMissing: 'トークン: なし',
  statusCacheFresh: (secs) => `キャッシュ: ${secs}秒前`,
  statusCacheNone: 'キャッシュ: なし',
  statusLineWired: 'ステータスライン: 接続済み',
  statusLineNotWired: 'ステータスライン: 未接続',
  statusHistoryReadings: (n) => `履歴: ${n} 件`,
  statusHistoryNone: '履歴: データなし',
  statusGuardActionDefault: 'デフォルト',
  contextLabel: (line, threshold) =>
    `サブスク上限 (claude-limit-guard): ${line}. しきい値 ${threshold}%.`,
  breach: (breached, action) => `しきい値超過 (${breached})。 ${action}`,
  contextAction: (handoff) =>
    `ガードルーチンを実行: 現在のアトミックなステップを完了し、引き継ぎを ${handoff} に保存` +
    `(完了したこと、残り、現在のgitブランチ、これまでに変更したファイル、再開のための具体的な次のステップ、` +
    `リセット時刻)、ユーザーにPCを切ってよいと伝え、新しいタスクの受付を停止。` +
    `.claude/limit-guard.md があればそれに従う。`,
  stopAction: (handoff) =>
    `まだ止まらないで — ガードルーチンを実行: 現在のアトミックなステップを完了し、次に引き継ぎを ` +
    `${handoff} に保存して、現在のgitブランチ、これまでに変更したファイル、再開のための具体的な次のステップを記録。` +
    `ユーザーにPCを切ってよいと伝える。.claude/limit-guard.md があれば従う。`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: しきい値 ${threshold}% 超過 (${breached})。 ${action}`,
  resume: (handoff) =>
    `利用上限で中断された以前の作業の引き継ぎファイル ${handoff} を発見。` +
    `再開を提案し、初期コンテキストとして読み込む。`,
  warnAction: '現在のステップをきれいに終わらせてください — 利用上限が近づいています。',
  warn: (warned, action) => `上限が近い (${warned})。 ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `${window} の上限が近づいています。`,
  notifyBreach: (window) => `${window} がしきい値超過 — まとめる時間です。`,
  notifyReset: (window) => `${window} の上限がリセットされました — 再開できます。`,
  snoozeSet: (u) => `ガードを ${u} まで一時停止しました。`,
  snoozeCleared: '一時停止を解除しました。',
  snoozeNone: '有効な一時停止はありません。',
  statsHeader: 'claude-limit-guard 利用統計',
  statsNoData: 'まだ利用データがありません',
  statsReadings: (n) => `記録: ${n}`,
  statsPeakFiveHour: (v) => `ピーク 5h: ${v}`,
  statsPeakSevenDay: (v) => `ピーク 7d: ${v}`,
  statsResets: (n) => `リセット: ${n}`,
};
