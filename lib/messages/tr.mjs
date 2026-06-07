// Turkish (tr) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'oturum aç',
  relIn: 'sonra',
  toThreshold: 'kadar',
  labels: { five_hour: 'Oturum limiti:', seven_day: 'Haftalık limit:', seven_day_opus: 'Hafta Opus:', seven_day_sonnet: 'Hafta Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7g', seven_day_opus: '7gO', seven_day_sonnet: '7gS' },
  statusHeader: 'claude-limit-guard durumu',
  statusConfig: 'Yapılandırma',
  statusHealth: 'Sağlık',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: yok',
  statusCacheFresh: (secs) => `önbellek: ${secs}sn önce`,
  statusCacheNone: 'önbellek: önbellek yok',
  statusLineWired: 'durum çubuğu: bağlı',
  statusLineNotWired: 'durum çubuğu: bağlı değil',
  statusHistoryReadings: (n) => `geçmiş: ${n} ölçüm`,
  statusHistoryNone: 'geçmiş: veri yok',
  statusGuardActionDefault: 'varsayılan',
  contextLabel: (line, threshold) =>
    `Abonelik limiti (claude-limit-guard): ${line}. Eşik ${threshold}%.`,
  breach: (breached, action) => `EŞİK AŞILDI (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Guard rutinini çalıştır: mevcut atomik adımı bitir, ${handoff} dosyasına bir devir kaydet (yapılanlar, ` +
    `kalanlar, mevcut git dalı, şimdiye dek değişen dosyalar, devam için somut sonraki adım, sıfırlama ` +
    `zamanı), kullanıcıya PC'yi kapatabileceğini söyle ve yeni görev almayı bırak. .claude/limit-guard.md ` +
    `varsa ona uy.`,
  stopAction: (handoff) =>
    `Henüz durma — guard rutinini çalıştır: mevcut atomik adımı bitir, sonra ${handoff} dosyasına mevcut ` +
    `git dalını, şimdiye dek değişen dosyaları ve devam için somut sonraki adımı kaydeden bir devir yaz. ` +
    `Kullanıcıya PC'yi kapatabileceğini söyle. .claude/limit-guard.md varsa ona uy.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limit eşiğin üzerinde ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Kullanım limiti nedeniyle kesilen önceki çalışmadan ${handoff} devir dosyası bulundu. ` +
    `Devam etmeyi öner ve onu başlangıç bağlamı olarak oku.`,
  warnAction: 'Mevcut adımını temizce bitir — bir kullanım limiti yaklaşıyor.',
  warn: (warned, action) => `LİMİT YAKLAŞIYOR (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `${window} limiti yaklaşıyor.`,
  notifyBreach: (window) => `${window} eşiği aşıldı — toparlanma zamanı.`,
  notifyReset: (window) => `${window} limitin sıfırlandı — devam edebilirsin.`,
  snoozeSet: (u) => `Koruma ${u}'e kadar ertelendi.`,
  snoozeCleared: 'Erteleme kaldırıldı.',
  snoozeNone: 'Etkin erteleme yok.',
  doctorHeader: 'claude-limit-guard otokontrol',
  doctor_node: 'Node ≥ 18',
  doctor_token: 'OAuth belirteci',
  doctor_statusline: 'durum çubuğu bağlı',
  doctor_cache: 'kullanım önbelleği taze',
  doctor_version: 'eklenti sürümü',
  doctorHint_node: 'Node’u v18 veya üzerine güncelle.',
  doctorHint_token: 'Claude Code’a giriş yap.',
  doctorHint_statusline: 'Durum çubuğunu bağlamak için /limit-guard-setup çalıştır.',
  doctorHint_cache: 'Durum çubuğunun önbelleği yenilemesi için bir Claude Code oturumu aç.',
  doctorHint_version: 'Eklentiyi güncelle: /plugin update.',
  doctorVersionUnknown: 'en yeni bilinmiyor',
  setupWired: 'Durum çubuğu settings.json içine bağlandı.',
  setupAlreadyWired: 'Durum çubuğu zaten bağlı — yapılacak bir şey yok.',
  setupBackedUp: (p) => `Önceki ayarlar ${p} konumuna yedeklendi.`,
  statsHeader: 'claude-limit-guard kullanım istatistikleri',
  statsNoData: 'henüz kullanım verisi yok',
  statsReadings: (n) => `ölçümler: ${n}`,
  statsPeakFiveHour: (v) => `zirve 5h: ${v}`,
  statsPeakSevenDay: (v) => `zirve 7g: ${v}`,
  statsResets: (n) => `sıfırlamalar: ${n}`,
};
