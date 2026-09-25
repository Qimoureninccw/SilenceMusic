// src/player/lyricParser.ts

export interface LyricLine {
  time: number        // 起始时间（秒）
  text: string        // 原文
  trans?: string      // 翻译
  roma?: string       // 音译
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

/** 合并原文、翻译、音译到统一结构 */
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

/** 根据当前播放时间，找出应该高亮的行号 */
export function findCurrentLine(lines: LyricLine[], currentTime: number): number {
  if (!lines.length) return -1
  // 二分查找
  let lo = 0, hi = lines.length - 1, ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid].time <= currentTime + 0.05) {   // 加一点小延迟补偿
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}