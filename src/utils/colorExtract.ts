// src/utils/colorExtract.ts

/** 把 rgb 转 hsl */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

/** hsl 转 rgb hex */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export interface ExtractedColor {
  accent: string        // 主色 hex
  accentHover: string   // hover 色 hex
  accentRgb: string     // "r, g, b"
}

/**
 * 从图片 url 提取主题色
 * @param imageUrl 图片地址
 * @param opts.saturationCap 饱和度上限（默认 55，防止过艳）
 * @param opts.lightness 目标亮度（默认 55，太暗会难看）
 */
export async function extractThemeColor(
  imageUrl: string,
  opts: { saturationCap?: number; lightness?: number } = {},
): Promise<ExtractedColor | null> {
  const { saturationCap = 55, lightness = 55 } = opts

  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'

    img.onload = () => {
      try {
        // 缩小到 32x32 采样，性能好
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)

        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        // 收集所有像素的 hsl
        const pixels: { h: number; s: number; l: number }[] = []
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < 128) continue       // 忽略透明
          const [h, s, l] = rgbToHsl(r, g, b)
          // 忽略极暗、极亮、灰度像素
          if (l < 15 || l > 90) continue
          if (s < 10) continue
          pixels.push({ h, s, l })
        }

        if (pixels.length === 0) {
          // 全是灰度/黑白封面 → 回退到中性主题
          return resolve({
            accent: '#8b5cf6',
            accentHover: '#7c3aed',
            accentRgb: '139, 92, 246',
          })
        }

        // 按色相分桶（12 个桶，每 30 度），找最大的桶
        const buckets: { h: number; s: number; l: number; count: number }[] = []
        for (const p of pixels) {
          const bucket = Math.floor(p.h / 30)
          if (!buckets[bucket]) buckets[bucket] = { h: 0, s: 0, l: 0, count: 0 }
          buckets[bucket].h += p.h
          buckets[bucket].s += p.s
          buckets[bucket].l += p.l
          buckets[bucket].count++
        }

        // 找像素数最多的桶
        const dominant = buckets
          .filter(Boolean)
          .reduce((a, b) => (a.count >= b.count ? a : b))

        // 桶内平均
        const avgH = dominant.h / dominant.count
        let avgS = dominant.s / dominant.count
        const avgL = dominant.l / dominant.count

        // 压制过高的饱和度
        if (avgS > saturationCap) avgS = saturationCap
        // 太暗或太亮都往中间拉
        const targetL = Math.max(35, Math.min(65, (avgL + lightness) / 2))

        const accent = hslToHex(avgH, avgS, targetL)
        const accentHover = hslToHex(avgH, Math.min(avgS + 10, saturationCap + 10), Math.max(targetL - 10, 30))

        // 转 rgb
        const rgb = hexToRgb(accent)
        const accentRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`

        resolve({ accent, accentHover, accentRgb })
      } catch (e) {
        console.warn('[extractThemeColor] failed', e)
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = `${imageUrl}?param=100y100`
  })
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}