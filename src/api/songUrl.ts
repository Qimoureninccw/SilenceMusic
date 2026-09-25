// src/api/songUrl.ts
import type { Quality } from './types'
import { cached } from '../utils/cache'

const METING_BASE = 'https://api.qijieya.cn/meting/'

const BR_MAP: Record<Quality, number> = {
  standard: 128000,
  higher: 192000,
  exhigh: 320000,
  lossless: 999000,
  hires: 999000,
  jyeffect: 320000,
  dolby: 320000,
  vivid: 320000,
  jymaster: 999000,
  sky: 320000,
}

// URL 有效期较短（Meting 生成的链接一般几分钟到几小时），保守缓存 3 分钟
const URL_TTL = 3 * 60_000

export async function getPlayableUrl(id: number, level: Quality = 'exhigh'): Promise<string> {
  const url = new URL(METING_BASE)
  url.searchParams.set('server', 'netease')
  url.searchParams.set('type', 'url')
  url.searchParams.set('id', String(id))
  const br = BR_MAP[level]
  if (br) url.searchParams.set('br', String(br))

  // Meting URL 本身就是"懒加载"的，缓存这个 URL 字符串就够了
  return cached(`url:${id}:${level}`, URL_TTL, async () => url.toString())
}

export async function prefetchUrl(_id: number, _level: Quality = 'exhigh') {
  // Meting 无法预取，跳过
}