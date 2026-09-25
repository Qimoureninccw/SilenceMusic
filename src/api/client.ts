// src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE || 'https://silence-music-api.de5.net'

function getCookie(): string | null {
  return localStorage.getItem('ncm_cookie')
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
    localStorage.removeItem('ncm_cookie')
    throw new Error('NEED_LOGIN')
  }

  return json as T
}