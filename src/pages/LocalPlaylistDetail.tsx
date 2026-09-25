// src/pages/LocalPlaylistDetail.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Pencil, Trash2, ListMusic } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { useUserStore } from '../store/userStore'
import { usePlayerStore } from '../store/playerStore'
import SongList from '../components/SongList'
import type { Song } from '../api/types'

export default function LocalPlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playlists = useUserStore(s => s.playlists)
  const deletePlaylist = useUserStore(s => s.deletePlaylist)
  const renamePlaylist = useUserStore(s => s.renamePlaylist)
  const removeFromPlaylist = useUserStore(s => s.removeFromPlaylist)
  const playAll = usePlayerStore(s => s.playAll)

  const playlist = playlists.find(p => p.id === id)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  // 加载歌单里的歌曲详情
  useEffect(() => {
    if (!playlist || playlist.songIds.length === 0) {
      setSongs([])
      setLoading(false)
      return
    }
    setLoading(true)
    api.songDetail(playlist.songIds)
      .then(list => {
        // 按 songIds 顺序重排（songDetail 返回顺序可能不同）
        const map = new Map(list.map(s => [s.id, s]))
        const ordered = playlist.songIds
          .map(sid => map.get(sid))
          .filter((s): s is Song => !!s)
        setSongs(ordered)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [JSON.stringify(playlist?.songIds)])

  if (!playlist) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white mb-4"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-neutral-500">歌单不存在</div>
      </div>
    )
  }

  const cover = songs[0]?.al?.picUrl
    ? `${songs[0].al.picUrl}?param=400y400`
    : ''

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

      {/* 头部 */}
      <div className="flex gap-6 mb-8">
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0">
          {cover ? (
            <img src={cover} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <ListMusic size={64} className="text-neutral-600" />
          )}
        </div>

        <div className="flex flex-col justify-end min-w-0 flex-1">
          <div className="text-xs text-neutral-500 mb-2">本地歌单</div>
          <h1 className="text-3xl font-bold mb-2 line-clamp-2">{playlist.name}</h1>
          <div className="text-sm text-neutral-400 mb-4">
            {songs.length} 首 · 创建于 {new Date(playlist.createdAt).toLocaleDateString()}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              disabled={!songs.length}
              onClick={() => playAll(songs, 0)}
              className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 rounded-full text-sm font-medium transition-colors"
            >
              <Play size={16} fill="currentColor" />
              播放全部
            </button>

            <button
              onClick={() => {
                const name = prompt('重命名歌单', playlist.name)
                if (name && name.trim()) renamePlaylist(playlist.id, name.trim())
              }}
              className="flex items-center gap-2 px-5 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-sm transition-colors"
            >
              <Pencil size={16} />
              重命名
            </button>

            <button
              onClick={() => {
                if (confirm(`确定删除歌单「${playlist.name}」？此操作不可撤销。`)) {
                  deletePlaylist(playlist.id)
                  navigate('/my')
                }
              }}
              className="flex items-center gap-2 px-5 py-2 bg-neutral-800 hover:bg-red-600 rounded-full text-sm transition-colors"
            >
              <Trash2 size={16} />
              删除歌单
            </button>
          </div>
        </div>
      </div>

      {/* 歌曲列表 */}
      {loading ? (
        <div className="text-neutral-500">加载中...</div>
      ) : songs.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 text-sm bg-neutral-900 rounded-lg">
          歌单还没有歌曲，去歌曲列表 hover 歌曲点击 <span className="text-white">加入歌单</span> 图标添加
        </div>
      ) : (
        <div>
          {/* SongList 里想额外提供"从歌单删除"操作的化，可以用后文说的扩展方式 */}
          <SongList
            songs={songs}
            onRemove={(song) => removeFromPlaylist(playlist.id, song.id)}
          />
        </div>
      )}
    </div>
  )
}