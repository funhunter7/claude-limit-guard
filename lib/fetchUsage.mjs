const ENDPOINT = 'https://api.anthropic.com/api/oauth/usage';
const DEFAULT_CC_VERSION = '2.1.158';

// The usage endpoint expects a claude-code User-Agent. The pinned version ages and may
// one day be validated server-side; CLAUDE_LIMIT_GUARD_CC_VERSION lets users bump it
// without a code change.
export function resolveCcVersion(env = process.env) {
  const v = env.CLAUDE_LIMIT_GUARD_CC_VERSION;
  return v && String(v).trim() ? String(v).trim() : DEFAULT_CC_VERSION;
}

export function usageHeaders(token, ccVersion = resolveCcVersion()) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'anthropic-beta': 'oauth-2025-04-20',
    'User-Agent': `claude-code/${ccVersion}`,
  };
}

export async function fetchUsage(token, { timeoutMs = 3000, fetchImpl = fetch } = {}) {
  if (!token) return { ok: false, reason: 'no-token' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetchImpl(ENDPOINT, {
      method: 'GET',
      headers: usageHeaders(token),
      signal: ctrl.signal,
    });
    if (resp.status === 401) return { ok: false, reason: 'expired' };
    if (!resp.ok) return { ok: false, reason: `http-${resp.status}` };
    return { ok: true, data: await resp.json() };
  } catch (e) {
    return { ok: false, reason: e.name === 'AbortError' ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timer);
  }
}
