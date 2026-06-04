// Lightweight stderr debug logger gated on the CLAUDE_LIMIT_GUARD_DEBUG env var.
// Status-line/hook subprocesses swallow their own errors to stay silent in the UI;
// enabling debug surfaces fetch/cache/auth decisions on stderr for diagnosis.

const OFF = new Set(['', '0', 'false', 'no']);

// True when CLAUDE_LIMIT_GUARD_DEBUG is set to anything other than an "off" value.
export function isDebugEnabled(env = process.env) {
  const v = env.CLAUDE_LIMIT_GUARD_DEBUG;
  if (v == null) return false;
  return !OFF.has(String(v).trim().toLowerCase());
}

// Returns a logging function. When debug is disabled it is a no-op so callers can
// sprinkle debug(...) calls unconditionally. String args pass through; others are
// JSON-stringified. `write` is injectable for tests.
export function makeDebug(env = process.env, write = (s) => process.stderr.write(s)) {
  if (!isDebugEnabled(env)) return () => {};
  return (...args) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    write(`[limit-guard] ${msg}\n`);
  };
}
