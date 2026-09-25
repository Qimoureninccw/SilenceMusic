// src/pages/History.tsx
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Trash2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { usePlayerStore } from '../store/playerStore'
import SongList from '../components/SongList'

export default function History() {
  const navigate = useNavigate()
  const history = useUserStore(s => s.history)
  const clearHistory = useUserStore(s => s.clearHistory)
  const playAll = usePlayerStore(s => s.playAll)

  const songs = history.map(h => h.song)

  return (
    <div className="p-6">
      {/* 顶部返回 */}
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors mb-4"
        title="返回"
      >
        <ArrowLeft size={20} />
      </button>

      {!songs.length ? (
        <div className="text-neutral-500">还没有播放记录</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">最近播放</h1>
              <div className="text-sm text-neutral-500">{songs.length} 首</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => playAll(songs, 0)}
                className="flex items-center gap-2 px-5 py-2 bg-pink-600 hover:bg-pink-500 rounded-full text-sm transition-colors"
              >
                <Play size={16} fill="currentColor" />
                播放全部
              </button>
              <button
                onClick={() => { if (confirm('清空播放记录？')) clearHistory() }}
                className="flex items-center gap-2 px-5 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-sm transition-colors"
              >
                <Trash2 size={16} />
                清空
              </button>
            </div>
          </div>
          <SongList songs={songs} />
        </>
      )}
    </div>
  )
}