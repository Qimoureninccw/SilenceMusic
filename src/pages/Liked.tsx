// src/pages/Liked.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { useUserStore } from '../store/userStore'
import { usePlayerStore } from '../store/playerStore'
import SongList from '../components/SongList'
import type { Song } from '../api/types'

export default function Liked() {
  const navigate = useNavigate()
  const likedIds = useUserStore(s => s.likedIds)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const playAll = usePlayerStore(s => s.playAll)

  useEffect(() => {
    if (!likedIds.length) { setSongs([]); setLoading(false); return }
    setLoading(true)
    api.songDetail(likedIds.slice(0, 200))
      .then(setSongs)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(likedIds)])

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors mb-4"
          title="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-neutral-500">加载中...</div>
      </div>
    )
  }

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

      {songs.length === 0 ? (
        <div className="text-neutral-500">还没有喜欢的歌曲，去歌曲列表点击 ❤️ 添加吧</div>
      ) : (
        <>
          {/* 头部 */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center text-6xl shadow-lg shrink-0">
              ❤️
            </div>
            <div className="min-w-0">
              <div className="text-xs text-neutral-500 mb-2">歌单</div>
              <h1 className="text-3xl font-bold mb-3">我喜欢的音乐</h1>
              <div className="text-sm text-neutral-400 mb-4">{songs.length} 首</div>
              <button
                onClick={() => playAll(songs, 0)}
                className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-500 rounded-full text-sm font-medium transition-colors"
              >
                <Play size={16} fill="currentColor" />
                播放全部
              </button>
            </div>
          </div>

          {/* 歌曲列表 */}
          <SongList songs={songs} />
        </>
      )}
    </div>
  )
}