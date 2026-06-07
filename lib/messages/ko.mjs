// Korean (ko) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: '로그인',
  relIn: '후',
  toThreshold: '까지',
  labels: { five_hour: '세션 한도:', seven_day: '주간 한도:', seven_day_opus: '주간 Opus:', seven_day_sonnet: '주간 Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'claude-limit-guard 상태',
  statusConfig: '설정',
  statusHealth: '상태',
  statusTokenOk: '토큰: ok',
  statusTokenMissing: '토큰: 없음',
  statusCacheFresh: (secs) => `캐시: ${secs}초 전`,
  statusCacheNone: '캐시: 없음',
  statusLineWired: '상태줄: 연결됨',
  statusLineNotWired: '상태줄: 연결 안 됨',
  statusHistoryReadings: (n) => `기록: ${n}개`,
  statusHistoryNone: '기록: 데이터 없음',
  statusGuardActionDefault: '기본값',
  contextLabel: (line, threshold) =>
    `구독 한도 (claude-limit-guard): ${line}. 임계값 ${threshold}%.`,
  breach: (breached, action) => `임계값 초과 (${breached}). ${action}`,
  contextAction: (handoff) =>
    `가드 루틴 실행: 현재 원자적 단계를 완료하고, 인계 내용을 ${handoff}에 저장` +
    `(완료된 것, 남은 것, 현재 git 브랜치, 지금까지 변경된 파일, 재개를 위한 구체적 다음 단계, 리셋 시각), ` +
    `사용자에게 PC를 꺼도 된다고 알리고, 새 작업 수락을 중단. .claude/limit-guard.md가 있으면 따른다.`,
  stopAction: (handoff) =>
    `아직 멈추지 마 — 가드 루틴 실행: 현재 원자적 단계를 완료한 뒤, 인계 내용을 ${handoff}에 저장하여 ` +
    `현재 git 브랜치, 지금까지 변경된 파일, 재개를 위한 구체적 다음 단계를 기록. ` +
    `사용자에게 PC를 꺼도 된다고 알린다. .claude/limit-guard.md가 있으면 따른다.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: 한도가 임계값 ${threshold}% 초과 (${breached}). ${action}`,
  resume: (handoff) =>
    `사용 한도로 중단된 이전 작업의 인계 파일 ${handoff}을(를) 발견. ` +
    `재개를 제안하고 초기 컨텍스트로 읽는다.`,
  warnAction: '현재 단계를 깔끔하게 마무리하세요 — 사용 한도가 다가옵니다.',
  warn: (warned, action) => `한도 임박 (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `${window} 한도에 다가가고 있습니다.`,
  notifyBreach: (window) => `${window} 임계값 초과 — 마무리할 시간입니다.`,
  notifyReset: (window) => `${window} 한도가 초기화되었습니다 — 다시 시작할 수 있습니다.`,
  snoozeSet: (u) => `가드를 ${u}까지 일시 중지했습니다.`,
  snoozeCleared: '일시 중지를 해제했습니다.',
  snoozeNone: '활성화된 일시 중지가 없습니다.',
  doctorHeader: 'claude-limit-guard 자가 점검',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'OAuth 토큰',
  doctor_statusline: '상태줄 연결됨',
  doctor_cache: '사용 캐시 최신',
  doctor_version: '플러그인 버전',
  doctorHint_node: 'Node를 v18 이상으로 업데이트하세요.',
  doctorHint_token: 'Claude Code에 로그인하세요.',
  doctorHint_statusline: '/limit-guard-setup을 실행해 상태줄을 연결하세요.',
  doctorHint_cache: 'Claude Code 세션을 열어 상태줄이 캐시를 새로 고치게 하세요.',
  doctorHint_version: '플러그인을 업데이트하세요: /plugin update.',
  doctorVersionUnknown: '최신 버전 알 수 없음',
  setupWired: '상태줄을 settings.json에 연결했습니다.',
  setupAlreadyWired: '상태줄이 이미 연결되어 있습니다 — 할 일이 없습니다.',
  setupBackedUp: (p) => `이전 설정을 ${p}에 백업했습니다.`,
  statsHeader: 'claude-limit-guard 사용 통계',
  statsNoData: '아직 사용 데이터가 없습니다',
  statsReadings: (n) => `기록: ${n}`,
  statsPeakFiveHour: (v) => `최고 5h: ${v}`,
  statsPeakSevenDay: (v) => `최고 7d: ${v}`,
  statsResets: (n) => `리셋: ${n}`,
};
