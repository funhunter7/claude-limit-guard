// Assembles the per-language message modules and exposes getMessages.
// Language = the part of the BCP-47 locale before '-', lowercased; falls back to English.
// A Proxy fills any key a partial translation is missing from the English base, so a locale
// file can never break a render by omitting a key (the structural test keeps them complete).
import en from './en.mjs';
import cs from './cs.mjs';
import de from './de.mjs';
import es from './es.mjs';
import fr from './fr.mjs';
import it from './it.mjs';
import pl from './pl.mjs';
import sk from './sk.mjs';
import uk from './uk.mjs';
import ru from './ru.mjs';
import ja from './ja.mjs';
import zh from './zh.mjs';
import ko from './ko.mjs';
import pt from './pt.mjs';
import nl from './nl.mjs';
import tr from './tr.mjs';

const MESSAGES = { en, cs, de, es, fr, it, pl, sk, uk, ru, ja, zh, ko, pt, nl, tr };

export function getMessages(locale) {
  const lang = String(locale || 'en').toLowerCase().split('-')[0];
  const base = MESSAGES.en;
  const picked = MESSAGES[lang] || base;
  if (picked === base) return base;
  return new Proxy(picked, { get: (t, k) => (k in t ? t[k] : base[k]) });
}
