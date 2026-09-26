// src/pages/NowPlaying.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Repeat, Repeat1, Shuffle, Volume2, ListMusic,
} from 'lucide-react'
import { usePlayerStore, type PlayMode } from '../store/playerStore'
import { player } from '../player/engine'
import { api } from '../api/NeteaseAdapter'
import { ensureGuestCookie } from '../api/client'
import {
  parseLyricFull,
  findCurrentLine,
  type LyricLine,
  type LyricWord,
} from '../player/lyricParser'
import type { Song } from '../api/types'

function fmt(t: number) {
  if (!t || !isFinite(t)) return '00:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ModeIcon({ mode }: { mode: PlayMode }) {
  if (mode === 'shuffle') return <Shuffle size={18} />
  if (mode === 'repeat') return <Repeat size={18} />
  if (mode === 'repeatOne') return <Repeat1 size={18} />
  return <ListMusic size={18} />
}

/** 逐字染色组件 —— 单层渐变 + 当前行已唱部分发光 */
function WordByWord({
  words,
  currentTime,
  glow = true,
}: {
  words: LyricWord[]
  currentTime: number
  glow?: boolean
}) {
  return (
    <>
      {words.map((w, i) => {
        let p = 0
        if (currentTime >= w.time + w.duration) p = 1
        else if (currentTime > w.time) p = (currentTime - w.time) / w.duration

        const percent = (p * 100).toFixed(2)

        const glowStrength = glow && p > 0.15
          ? Math.min((p - 0.15) / 0.85, 1) * 0.8
          : 0

        return (
          <span
            key={i}
            style={{
              backgroundImage: `linear-gradient(to right, var(--accent) ${percent}%, #d4d4d4 ${percent}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              filter: glowStrength > 0
                ? `drop-shadow(0 0 ${4 * glowStrength}px rgba(var(--accent-rgb), ${glowStrength}))`
                : 'none',
            }}
          >
            {w.text}
          </span>
        )
      })}
    </>
  )
}

export default function NowPlaying() {
  const navigate = useNavigate()
  const {
    queue, currentIndex, playing, currentTime, duration, mode, volume,
    toggle, next, prev, seek, setVolume, setMode,
  } = usePlayerStore()

  const song: Song | undefined = currentIndex >= 0 ? queue[currentIndex] : undefined

  const [lines, setLines] = useState<LyricLine[]>([])
  const [dynamicCover, setDynamicCover] = useState<string | null>(null)
  const lyricBoxRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // 每帧刷新的平滑时间
  const [smoothTime, setSmoothTime] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setSmoothTime(player.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 加载歌词
  useEffect(() => {
    if (!song) { setLines([]); return }
    let canceled = false
    api.lyric(song.id).then(l => {
      if (canceled) return
      setLines(parseLyricFull(l.lrc, l.yrc, l.tlyric, l.romalrc))
    }).catch(() => setLines([]))
    return () => { canceled = true }
  }, [song?.id])

  // 加载动态封面
  useEffect(() => {
    if (!song) { setDynamicCover(null); return }
    let canceled = false
    ensureGuestCookie()
      .then(() => api.dynamicCover(song.id))
      .then(r => {
        if (canceled) return
        setDynamicCover(r.videoUrl ?? null)
      })
      .catch(() => { if (!canceled) setDynamicCover(null) })
    return () => { canceled = true }
  }, [song?.id])

  // 当前高亮行
  const currentLine = useMemo(
    () => findCurrentLine(lines, currentTime),
    [lines, currentTime],
  )

  // 自定义缓动滚动
  useEffect(() => {
    if (currentLine < 0) return
    const el = lineRefs.current[currentLine]
    const box = lyricBoxRef.current
    if (!el || !box) return

    const target = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
    const start = box.scrollTop
    const distance = target - start
    const duration = 700
    const startTime = performance.now()

    let raf = 0
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      box.scrollTop = start + distance * ease(progress)
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [currentLine])

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); toggle() }
      else if (e.code === 'ArrowRight') seek(Math.min(currentTime + 5, duration))
      else if (e.code === 'ArrowLeft') seek(Math.max(currentTime - 5, 0))
      else if (e.code === 'Escape') navigate(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, seek, currentTime, duration, navigate])

  const cycleMode = () => {
    const order: PlayMode[] = ['order', 'repeat', 'repeatOne', 'shuffle']
    const i = order.indexOf(mode)
    setMode(order[(i + 1) % order.length])
  }

  if (!song) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-neutral-500 gap-4 bg-neutral-900">
        <div>暂无播放</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-neutral-800 rounded-full text-sm hover:bg-neutral-700"
        >
          返回
        </button>
      </div>
    )
  }

  const cover = song.al?.picUrl ? `${song.al.picUrl}?param=800y800` : ''

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-900">
      {/* 模糊背景 */}
      {cover && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30"
          style={{ backgroundImage: `url(${cover})` }}
        />
      )}
      <div className="absolute inset-0 bg-neutral-900/70" />

      {/* 顶部返回 */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
        title="返回 (Esc)"
      >
        <ChevronDown size={24} />
      </button>

      {/* 主体 */}
      <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-center gap-12 px-8 pt-16 pb-40">
        {/* 左：封面 + 信息 */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <div
            className={`relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 ${
              playing ? '' : 'scale-95'
            }`}
          >
            {dynamicCover ? (
              <video
                src={dynamicCover}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                poster={cover || undefined}
              />
            ) : cover ? (
              <img src={cover} alt={song.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                无封面
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-white line-clamp-2 mb-2">
              {song.name}
            </div>

            {/* 歌手可点击 */}
            <div className="text-neutral-400 text-sm">
              {song.ar?.map((a, idx) => (
                <span key={a.id}>
                  <Link
  to={`/artist/${a.id}`}
  replace
  className="hover:text-white hover:underline transition-colors"
>
  {a.name}
</Link>
                  {idx < song.ar.length - 1 && ' / '}
                </span>
              )) ?? ''}
            </div>

            {/* 专辑可点击 */}
            {song.al?.id && (
              <div className="text-neutral-500 text-xs mt-1">
                专辑：
                <Link
  to={`/album/${song.al.id}`}
  replace
  className="hover:text-white hover:underline transition-colors"
>
  {song.al.name}
</Link>
              </div>
            )}
          </div>
        </div>

        {/* 右：歌词 */}
        <div className="w-full max-w-xl h-80 md:h-[28rem] relative">
          <div
            ref={lyricBoxRef}
            className="h-full overflow-y-auto no-scrollbar text-center md:text-left px-6"
          >
            {lines.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                暂无歌词
              </div>
            ) : (
              <div className="py-[45%]">
                {lines.map((line, i) => {
                  const active = i === currentLine
                  const distance = i - currentLine
                  const absDist = Math.abs(distance)

                  const opacity = active ? 1 : Math.max(0.25, 1 - absDist * 0.18)
                  const blurPx = active ? 0 : Math.min(absDist * 0.35, 1.6)
                  const scale = active ? 1.06 : Math.max(0.94, 1 - absDist * 0.02)
                  const fontSize = active ? 21 : Math.max(16, 21 - absDist * 1)
                  const fontWeight = active ? 700 : 400
                  const letterSpacing = active ? '0.025em' : '0'
                  const translateY = active ? -2 : 0
                  const lineHeight = active ? 1.55 : 1.4

                  const transition = `
                    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    filter 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    font-size 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    font-weight 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    letter-spacing 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                    color 0.7s cubic-bezier(0.22, 1, 0.36, 1)
                  `

                  return (
                    <div
                      key={i}
                      ref={el => { lineRefs.current[i] = el }}
                      onClick={() => seek(line.time)}
                      className="py-3 cursor-pointer origin-center md:origin-left"
                      style={{
                        opacity,
                        filter: `blur(${blurPx}px)`,
                        transform: `translateY(${translateY}px) scale(${scale})`,
                        fontSize: `${fontSize}px`,
                        fontWeight,
                        letterSpacing,
                        lineHeight,
                        transition,
                        willChange: 'transform, opacity, filter',
                      }}
                    >
                      <div>
                        {line.words && active ? (
                          <WordByWord
                            words={line.words}
                            currentTime={smoothTime}
                            glow
                          />
                        ) : (
                          <span
                            style={{
                              color: active ? 'var(--accent)' : '#e5e5e5',
                              transition,
                            }}
                          >
                            {line.text || '♪'}
                          </span>
                        )}
                      </div>

                      {line.trans && (
                        <div
                          style={{
                            fontSize: '14px',
                            marginTop: '4px',
                            color: active ? 'var(--accent)' : '#737373',
                            opacity: active ? 0.9 : 0.7,
                            transition,
                          }}
                        >
                          {line.trans}
                        </div>
                      )}

                      {line.roma && !line.trans && (
                        <div
                          style={{
                            fontSize: '14px',
                            marginTop: '4px',
                            color: '#737373',
                          }}
                        >
                          {line.roma}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-8 py-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="w-10 text-right tabular-nums">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={e => seek(+e.target.value)}
              className="flex-1 accent-pink-500 cursor-pointer"
            />
            <span className="w-10 tabular-nums">{fmt(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={cycleMode}
              className="text-neutral-400 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
              title={`播放模式：${mode}`}
            >
              <ModeIcon mode={mode} />
            </button>

            <div className="flex items-center gap-8">
              <button
                onClick={prev}
                className="text-neutral-300 hover:text-white transition-colors"
                title="上一首"
              >
                <SkipBack size={28} />
              </button>
              <button
                onClick={toggle}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                title={playing ? '暂停' : '播放'}
              >
                {playing
                  ? <Pause size={24} fill="currentColor" />
                  : <Play size={24} fill="currentColor" className="ml-1" />
                }
              </button>
              <button
                onClick={next}
                className="text-neutral-300 hover:text-white transition-colors"
                title="下一首"
              >
                <SkipForward size={28} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-neutral-400">
              <Volume2 size={18} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={e => setVolume(+e.target.value)}
                className="w-24 accent-pink-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}