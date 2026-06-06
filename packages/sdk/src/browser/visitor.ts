const VISITOR_KEY = 'sonar_visitor_id'
const SESSION_KEY = 'sonar_session_id'
const SESSION_ACTIVITY_KEY = 'sonar_session_activity'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

function uuid(): string {
  const hex = '0123456789abcdef'
  const chars = new Array(36)
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      chars[i] = '-'
    } else if (i === 14) {
      chars[i] = '4'
    } else if (i === 19) {
      chars[i] = hex[(Math.random() * 4) | 8]
    } else {
      chars[i] = hex[(Math.random() * 16) | 0]
    }
  }
  return chars.join('')
}

function getStorageItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function setStorageItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
}

export class VisitorManager {
  private _visitorId: string
  private _sessionId: string

  constructor() {
    let vid = getStorageItem(VISITOR_KEY)
    if (!vid) {
      vid = uuid()
      setStorageItem(VISITOR_KEY, vid)
    }
    this._visitorId = vid

    let sid = getStorageItem(SESSION_KEY)
    const lastActivity = getStorageItem(SESSION_ACTIVITY_KEY)
    const now = Date.now()
    if (!sid || !lastActivity || (now - Number(lastActivity)) > SESSION_TIMEOUT_MS) {
      sid = uuid()
      setStorageItem(SESSION_KEY, sid)
    }
    this._sessionId = sid
    setStorageItem(SESSION_ACTIVITY_KEY, String(now))
  }

  get visitorId() { return this._visitorId }
  get sessionId() { return this._sessionId }

  touch() {
    try { localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now())) } catch { /* noop */ }
  }
}
