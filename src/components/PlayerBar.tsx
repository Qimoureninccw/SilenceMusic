// src/components/PlayerBar.tsx
import { useNavigate } from 'react-router-dom'
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1,
  Shuffle, Volume2, ListMusic,
} from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import type { PlayMode } from '../store/playerStore'

function fmt(t: number) {
  if (!t || !isFinite(t)) return '00:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 播放模式图标
function ModeIcon({ mode }: { mode: PlayMode }) {
  if (mode === 'shuffle') return <Shuffle size={16} />
  if (mode === 'repeat') return <Repeat size={16} />
  if (mode === 'repeatOne') return <Repeat1 size={16} />
  return <ListMusic size={16} />   // order
}

export default function PlayerBar() {
  const navigate = useNavigate()
  const {
    queue, currentIndex, playing, currentTime, duration, mode, volume,
    toggle, next, prev, seek, setVolume, setMode,
  } = usePlayerStore()

  const song = currentIndex >= 0 ? queue[currentIndex] : null
  const disabled = !song

  const cycleMode = () => {
    const order: PlayMode[] = ['order', 'repeat', 'repeatOne', 'shuffle']
    const i = order.indexOf(mode)
    setMode(order[(i + 1) % order.length])
  }

  return (
    <div className="h-20 border-t border-neutral-800 bg-neutral-950 flex items-center px-4 gap-4">
      {/* 左：封面 + 歌名，点击进入全屏播放页 */}
      {song ? (
        <button
          onClick={() => navigate('/now-playing')}
          className="flex items-center gap-3 w-64 min-w-0 text-left hover:bg-neutral-800/50 rounded p-1 -m-1 transition-colors"
        >
          <img
            src={`${song.al?.picUrl ?? ''}?param=100y100`}
            alt=""
            className="w-12 h-12 rounded shrink-0"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{song.name}</div>
            <div className="truncate text-xs text-neutral-400">
              {song.ar?.map(a => a.name).join(' / ') ?? ''}
            </div>
          </div>
        </button>
      ) : (
        <div className="w-64 text-neutral-500 text-sm">未播放</div>
      )}

      {/* 中：播放控制 + 进度条 */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-5">
          <button
            onClick={prev}
            disabled={disabled}
            className="text-neutral-300 hover:text-white disabled:opacity-30 transition-colors"
            title="上一首"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={toggle}
            disabled={disabled}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100"
            title={playing ? '暂停' : '播放'}
          >
            {playing
              ? <Pause size={18} fill="currentColor" />
              : <Play size={18} fill="currentColor" className="ml-0.5" />
            }
          </button>
          <button
            onClick={next}
            disabled={disabled}
            className="text-neutral-300 hover:text-white disabled:opacity-30 transition-colors"
            title="下一首"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="w-full max-w-xl flex items-center gap-2 text-xs text-neutral-400">
          <span className="w-10 text-right tabular-nums">{fmt(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={e => seek(+e.target.value)}
            className="flex-1 accent-pink-500 cursor-pointer"
            disabled={disabled}
          />
          <span className="w-10 tabular-nums">{fmt(duration)}</span>
        </div>
      </div>

      {/* 右：播放模式 + 音量 */}
      <div className="w-64 flex items-center justify-end gap-3 text-neutral-400">
        <button
          onClick={cycleMode}
          className="hover:text-white p-1.5 rounded hover:bg-neutral-800 transition-colors"
          title={`播放模式：${mode}`}
        >
          <ModeIcon mode={mode} />
        </button>
        <Volume2 size={16} />
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
  )
}