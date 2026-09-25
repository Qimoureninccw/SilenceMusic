// src/pages/MyMusic.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ListMusic, History, Plus } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { useUserStore } from '../store/userStore'
import type { Song } from '../api/types'

export default function MyMusic() {
  const { likedIds, playlists, history, createPlaylist } = useUserStore()
  const [likedSongs, setLikedSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!likedIds.length) { setLikedSongs([]); return }
    setLoading(true)
    api.songDetail(likedIds.slice(0, 200))
      .then(setLikedSongs)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(likedIds)])

  return (
    <div className="p-6 space-y-10">
      <section>
        <h2 className="text-xl font-semibold mb-4">我的音乐</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* 我喜欢的音乐 */}
          <Link
            to="/liked"
            className="flex flex-col items-center gap-3 p-6 bg-neutral-800/40 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <Heart className="text-pink-500" size={32} fill="currentColor" />
            <div className="text-sm font-medium">我喜欢的音乐</div>
            <div className="text-xs text-neutral-500">{likedIds.length} 首</div>
          </Link>

          {/* 最近播放 */}
          <Link
            to="/history"
            className="flex flex-col items-center gap-3 p-6 bg-neutral-800/40 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <History className="text-blue-400" size={32} />
            <div className="text-sm font-medium">最近播放</div>
            <div className="text-xs text-neutral-500">{history.length} 首</div>
          </Link>
        </div>
      </section>

      {/* 我的歌单 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">我的歌单</h2>
          <button
            onClick={() => {
              const name = prompt('歌单名称')
              if (name) createPlaylist(name)
            }}
            className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
          >
            <Plus size={16} /> 新建歌单
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="text-neutral-500 text-sm py-8 text-center bg-neutral-900 rounded-lg">
            还没有歌单，点上方「新建歌单」创建一个
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlists.map(p => (
              <Link
                key={p.id}
                to={`/local-playlist/${p.id}`}
                className="group cursor-pointer"
              >
                <div className="aspect-square bg-neutral-800 rounded-lg flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                  <ListMusic size={40} className="text-neutral-600" />
                </div>
                <div className="mt-2 text-sm line-clamp-2">{p.name}</div>
                <div className="text-xs text-neutral-500">{p.songIds.length} 首</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {likedSongs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">喜欢的最新 10 首</h2>
            <Link to="/liked" className="text-sm text-neutral-400 hover:text-white">
              查看全部 →
            </Link>
          </div>
          <div className="text-sm text-neutral-500">
            {loading ? '加载中...' : `共 ${likedIds.length} 首`}
          </div>
        </section>
      )}
    </div>
  )
}