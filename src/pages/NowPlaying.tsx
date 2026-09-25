// src/pages/NowPlaying.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Repeat, Repeat1, Shuffle, Volume2, ListMusic,
} from 'lucide-react'
import { usePlayerStore, type PlayMode } from '../store/playerStore'
import { api } from '../api/NeteaseAdapter'
import { parseLyric, findCurrentLine, type LyricLine } from '../player/lyricParser'
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

export default function NowPlaying() {
  const navigate = useNavigate()
  const {
    queue, currentIndex, playing, currentTime, duration, mode, volume,
    toggle, next, prev, seek, setVolume, setMode,
  } = usePlayerStore()

  const song: Song | undefined = currentIndex >= 0 ? queue[currentIndex] : undefined

  const [lines, setLines] = useState<LyricLine[]>([])
  const lyricBoxRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // 加载歌词
  useEffect(() => {
    if (!song) { setLines([]); return }
    let canceled = false
    api.lyric(song.id).then(l => {
      if (canceled) return
      setLines(parseLyric(l.lrc, l.tlyric, l.romalrc))
    }).catch(() => setLines([]))
    return () => { canceled = true }
  }, [song?.id])

  // 当前高亮行
  const currentLine = useMemo(
    () => findCurrentLine(lines, currentTime),
    [lines, currentTime],
  )

  // 自动滚动到当前行
  useEffect(() => {
    if (currentLine < 0) return
    const el = lineRefs.current[currentLine]
    const box = lyricBoxRef.current
    if (!el || !box) return
    const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
    box.scrollTo({ top, behavior: 'smooth' })
  }, [currentLine])

  // 键盘快捷键：空格播放/暂停，左右箭头快进快退
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

      {/* 主体：封面 + 歌词 */}
      <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-center gap-12 px-8 pt-16 pb-40">
        {/* 左：封面 + 信息 */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <div
            className={`relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 ${
              playing ? '' : 'scale-95'
            }`}
          >
            {cover ? (
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
            <div className="text-neutral-400 text-sm">
              {song.ar?.map(a => a.name).join(' / ') ?? ''}
            </div>
            {song.al?.name && (
              <div className="text-neutral-500 text-xs mt-1">
                专辑：{song.al.name}
              </div>
            )}
          </div>
        </div>

        {/* 右：歌词 */}
        <div className="w-full max-w-xl h-72 md:h-[24rem]">
          <div
            ref={lyricBoxRef}
            className="h-full overflow-y-auto no-scrollbar text-center md:text-left px-4"
            style={{ scrollBehavior: 'smooth' }}
          >
            {lines.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                暂无歌词
              </div>
            ) : (
              <div className="py-[40%]">
                {lines.map((line, i) => {
                  const active = i === currentLine
                  const passed = i < currentLine
                  return (
                    <div
                      key={i}
                      ref={el => { lineRefs.current[i] = el }}
                      onClick={() => seek(line.time)}
                      className={`py-2 cursor-pointer transition-all duration-300 ${
                        active
                          ? 'text-pink-400 text-xl font-semibold scale-105'
                          : passed
                          ? 'text-neutral-500 text-base'
                          : 'text-neutral-300 text-base'
                      }`}
                    >
                      <div>{line.text || '♪'}</div>
                      {line.trans && (
                        <div className={`text-sm mt-1 ${
                          active ? 'text-pink-300/80' : 'text-neutral-500'
                        }`}>
                          {line.trans}
                        </div>
                      )}
                      {line.roma && !line.trans && (
                        <div className="text-sm mt-1 text-neutral-500">{line.roma}</div>
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
          {/* 进度条 */}
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

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            {/* 左：模式 */}
            <button
              onClick={cycleMode}
              className="text-neutral-400 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
              title={`播放模式：${mode}`}
            >
              <ModeIcon mode={mode} />
            </button>

            {/* 中：上一首 / 播放 / 下一首 */}
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

            {/* 右：音量 */}
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