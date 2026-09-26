// src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE || 'https://silence-music-api.de5.net'

const COOKIE_KEY = 'ncm_cookie'
const GUEST_COOKIE_KEY = 'ncm_guest_cookie'

function getCookie(): string | null {
  return localStorage.getItem(COOKIE_KEY) ?? localStorage.getItem(GUEST_COOKIE_KEY)
}

let guestCookiePromise: Promise<string> | null = null

/** 获取游客 cookie（带缓存，只请求一次） */
export async function ensureGuestCookie(): Promise<string> {
  const cached = localStorage.getItem(GUEST_COOKIE_KEY)
  if (cached) return cached
  if (guestCookiePromise) return guestCookiePromise

  guestCookiePromise = (async () => {
    try {
      const res = await fetch(`${BASE}/register/anonimous`, { method: 'GET' })
      const json = await res.json()
      // API 返回的 cookie 字段
      const cookie = json.cookie ?? ''
      if (cookie) {
        localStorage.setItem(GUEST_COOKIE_KEY, cookie)
        return cookie
      }
    } catch (e) {
      console.warn('[guest cookie] failed', e)
    }
    guestCookiePromise = null
    return ''
  })()

  return guestCookiePromise
}

export async function request<T>(
  path: string,
  params: Record<string, any> = {},
  opts: { needLogin?: boolean; noCache?: boolean; method?: 'GET' | 'POST' } = {},
): Promise<T> {
  const url = new URL(BASE + path)
  const cookie = getCookie()
  if (cookie) url.searchParams.set('cookie', cookie)

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }

  if (opts.needLogin || opts.noCache) {
    url.searchParams.set('timestamp', String(Date.now()))
  }

  const res = await fetch(url.toString(), { method: opts.method ?? 'GET' })
  const json = await res.json()

  if (json.code === 301) {
    localStorage.removeItem(COOKIE_KEY)
    throw new Error('NEED_LOGIN')
  }

  return json as T
}