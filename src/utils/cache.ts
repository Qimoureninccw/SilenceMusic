// src/utils/cache.ts

interface CacheEntry<T> {
  v: T
  t: number        // 写入时间
  e: number        // 有效期（毫秒），0 = 永久
}

const PREFIX = 'sm_cache:'

/**
 * 带 TTL 的缓存。TTL 到了返回 null，由调用方重新请求。
 */
export async function cached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const fullKey = PREFIX + key

  // 1. 先看 localStorage
  try {
    const raw = localStorage.getItem(fullKey)
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw)
      if (entry.e === 0 || Date.now() - entry.t < entry.e) {
        return entry.v
      }
      localStorage.removeItem(fullKey)
    }
  } catch { /* ignore */ }

  // 2. 请求新数据
  const v = await fetcher()

  // 3. 写回
  try {
    localStorage.setItem(fullKey, JSON.stringify({ v, t: Date.now(), e: ttl }))
  } catch { /* quota 满时忽略 */ }

  return v
}

/** 清理所有本项目缓存 */
export function clearAllCache() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

/** 按前缀清理（比如清某个歌单的缓存） */
export function clearCacheByPrefix(prefix: string) {
  const full = PREFIX + prefix
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(full)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}