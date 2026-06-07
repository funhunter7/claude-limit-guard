// Polish (pl) — best-effort translation; placeholders identical to en.mjs.
export default {
  signIn: 'zaloguj się',
  relIn: 'za',
  toThreshold: 'do',
  labels: { five_hour: 'Limit sesji:', seven_day: 'Limit tygodniowy:', seven_day_opus: 'Tydzień Opus:', seven_day_sonnet: 'Tydzień Sonnet:' },
  labelsShort: { five_hour: '5h', seven_day: '7d', seven_day_opus: '7dO', seven_day_sonnet: '7dS' },
  statusHeader: 'stan claude-limit-guard',
  statusConfig: 'Konfiguracja',
  statusHealth: 'Zdrowie',
  statusTokenOk: 'token: ok',
  statusTokenMissing: 'token: brak',
  statusCacheFresh: (secs) => `cache: ${secs}s temu`,
  statusCacheNone: 'cache: brak cache',
  statusLineWired: 'pasek stanu: podłączony',
  statusLineNotWired: 'pasek stanu: niepodłączony',
  statusHistoryReadings: (n) => `historia: ${n} odczytów`,
  statusHistoryNone: 'historia: brak danych',
  statusGuardActionDefault: 'domyślne',
  contextLabel: (line, threshold) =>
    `Limit subskrypcji (claude-limit-guard): ${line}. Próg ${threshold}%.`,
  breach: (breached, action) => `PRÓG PRZEKROCZONY (${breached}). ${action}`,
  contextAction: (handoff) =>
    `Uruchom rutynę guard: dokończ bieżący atomowy krok, zapisz przekazanie do ${handoff} (co zrobione, ` +
    `co zostało, bieżąca gałąź git, dotychczas zmienione pliki, konkretny następny krok do wznowienia, ` +
    `czas resetu), powiedz użytkownikowi że może wyłączyć komputer i przestań przyjmować nowe zadania. ` +
    `Jeśli istnieje .claude/limit-guard.md, postępuj zgodnie z nim.`,
  stopAction: (handoff) =>
    `Jeszcze nie przerywaj — uruchom rutynę guard: dokończ bieżący atomowy krok, potem zapisz przekazanie ` +
    `do ${handoff}, które zapisze bieżącą gałąź git, dotychczas zmienione pliki i konkretny następny krok ` +
    `do wznowienia. Powiedz użytkownikowi że może wyłączyć komputer. Postępuj zgodnie z ` +
    `.claude/limit-guard.md jeśli istnieje.`,
  stopReason: (threshold, breached, action) =>
    `claude-limit-guard: limit powyżej progu ${threshold}% (${breached}). ${action}`,
  resume: (handoff) =>
    `Znaleziono plik przekazania ${handoff} z wcześniejszej pracy przerwanej limitem użycia. ` +
    `Zaproponuj wznowienie i przeczytaj go jako kontekst początkowy.`,
  warnAction: 'Dokończ bieżący krok czysto — zbliża się limit użycia.',
  warn: (warned, action) => `ZBLIŻA SIĘ LIMIT (${warned}). ${action}`,
  notifyTitle: 'claude-limit-guard',
  notifyWarn: (window) => `Zbliża się limit ${window}.`,
  notifyBreach: (window) => `Próg przekroczony na ${window} — czas kończyć.`,
  statsHeader: 'statystyki użycia claude-limit-guard',
  statsNoData: 'brak danych o użyciu',
  statsReadings: (n) => `odczyty: ${n}`,
  statsPeakFiveHour: (v) => `szczyt 5h: ${v}`,
  statsPeakSevenDay: (v) => `szczyt 7d: ${v}`,
  statsResets: (n) => `resety: ${n}`,
};
