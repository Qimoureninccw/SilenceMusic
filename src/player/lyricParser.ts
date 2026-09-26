// src/player/lyricParser.ts

export interface LyricWord {
  time: number      // 秒
  duration: number  // 秒
  text: string
}

export interface LyricLine {
  time: number
  text: string
  trans?: string
  roma?: string
  words?: LyricWord[]
}

// 匹配 [mm:ss.xxx] 或 [mm:ss.xx] 或 [mm:ss]
const TIME_RE = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

function parseTimestamp(m: RegExpMatchArray): number {
  const min = +m[1]
  const sec = +m[2]
  const ms = m[3] ? +m[3].padEnd(3, '0') : 0
  return min * 60 + sec + ms / 1000
}

/** 解析普通 LRC，返回 time -> text 映射 */
function parseLrcMap(lrc: string): Map<number, string> {
  const map = new Map<number, string>()
  if (!lrc) return map

  for (const rawLine of lrc.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    TIME_RE.lastIndex = 0
    const times: number[] = []
    let lastEnd = 0
    let m: RegExpExecArray | null

    while ((m = TIME_RE.exec(line))) {
      times.push(parseTimestamp(m as any))
      lastEnd = m.index + m[0].length
    }
    if (!times.length) continue

    const text = line.slice(lastEnd).trim()
    for (const t of times) map.set(t, text)
  }
  return map
}

/** 普通 LRC 解析（原文 + 翻译 + 音译） */
export function parseLyric(
  lrc: string,
  tlyric?: string,
  romalrc?: string,
): LyricLine[] {
  const lrcMap = parseLrcMap(lrc)
  if (lrcMap.size === 0) return []

  const transMap = tlyric ? parseLrcMap(tlyric) : new Map()
  const romaMap = romalrc ? parseLrcMap(romalrc) : new Map()

  const lines: LyricLine[] = []
  const sorted = [...lrcMap.entries()].sort((a, b) => a[0] - b[0])

  for (const [time, text] of sorted) {
    lines.push({
      time,
      text,
      trans: transMap.get(time),
      roma: romaMap.get(time),
    })
  }
  return lines
}

/** 解析 YRC 逐字歌词 */
export function parseYrc(yrc: string): LyricLine[] {
  if (!yrc) return []
  const lines: LyricLine[] = []

  for (const rawLine of yrc.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const headMatch = line.match(/^\[(\d+),(\d+)\]/)
    if (!headMatch) continue

    const lineStart = +headMatch[1] / 1000
    const body = line.slice(headMatch[0].length)

    const words: LyricWord[] = []
    const wordRe = /\((\d+),(\d+),\d+\)([^(]*)/g
    let m: RegExpExecArray | null
    let fullText = ''

    while ((m = wordRe.exec(body))) {
      const start = +m[1] / 1000
      const dur = +m[2] / 1000
      const text = m[3]
      if (text) {
        words.push({ time: start, duration: dur, text })
        fullText += text
      }
    }

    if (words.length === 0) continue

    lines.push({
      time: lineStart,
      text: fullText.trim() || '♪',
      words,
    })
  }

  return lines
}

/** 合并逐字歌词 + 翻译 + 音译 */
export function parseLyricFull(
  lrc: string,
  yrc?: string,
  tlyric?: string,
  romalrc?: string,
): LyricLine[] {
  const yrcLines = yrc ? parseYrc(yrc) : []
  const transMap = tlyric ? parseLrcMap(tlyric) : new Map()
  const romaMap = romalrc ? parseLrcMap(romalrc) : new Map()

  // 把 Map 转成排序数组，方便找最近
  const transArr = [...transMap.entries()].sort((a, b) => a[0] - b[0])
  const romaArr = [...romaMap.entries()].sort((a, b) => a[0] - b[0])

  /** 二分查找最接近的时间戳，容差 maxDiff 秒 */
  function findNearest(arr: [number, string][], t: number, maxDiff = 1.0): string | undefined {
    if (!arr.length) return undefined
    let lo = 0, hi = arr.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid][0] < t) lo = mid + 1
      else hi = mid
    }
    // 比较 lo 和 lo-1 哪个更近
    const candidates = [arr[lo], arr[lo - 1]].filter(Boolean)
    let best: [number, string] | null = null
    for (const c of candidates) {
      if (!best || Math.abs(c[0] - t) < Math.abs(best[0] - t)) best = c
    }
    if (best && Math.abs(best[0] - t) <= maxDiff) return best[1]
    return undefined
  }

  if (yrcLines.length > 0) {
    return yrcLines.map(line => ({
      ...line,
      trans: findNearest(transArr, line.time),
      roma: findNearest(romaArr, line.time),
    }))
  }

  return parseLyric(lrc, tlyric, romalrc)
}

/** 找出当前高亮行 */
export function findCurrentLine(lines: LyricLine[], currentTime: number): number {
  if (!lines.length) return -1
  let lo = 0, hi = lines.length - 1, ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].time <= currentTime + 0.05) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

/** 计算每个字的进度（0~1） */
export function getWordProgress(
  words: LyricWord[],
  currentTime: number,
): number[] {
  return words.map(w => {
    if (currentTime <= w.time) return 0
    if (currentTime >= w.time + w.duration) return 1
    return (currentTime - w.time) / w.duration
  })
}