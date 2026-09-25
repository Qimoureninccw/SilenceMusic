// src/pages/PlaylistDetail.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/NeteaseAdapter'
import SongList from '../components/SongList'
import { usePlayerStore } from '../store/playerStore'
import type { Playlist, Song } from '../api/types'

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const playAll = usePlayerStore(s => s.playAll)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.playlistDetail(+id),
      api.playlistTrackAll(+id),
    ]).then(([detail, tracks]) => {
      setPlaylist(detail)
      setSongs(tracks)
    }).catch(err => {
      console.error(err)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-neutral-500">加载中...</div>
  if (!playlist) return <div className="p-6 text-neutral-500">歌单不存在</div>

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex gap-6 mb-8">
        <img
          src={`${playlist.coverImgUrl}?param=400y400`}
          alt={playlist.name}
          className="w-48 h-48 rounded-lg shrink-0"
        />
        <div className="flex flex-col justify-end min-w-0">
          <div className="text-xs text-neutral-500 mb-2">歌单</div>
          <h1 className="text-3xl font-bold mb-3 line-clamp-2">{playlist.name}</h1>
          <div className="text-sm text-neutral-400 mb-4">
            {playlist.creator?.nickname} · {playlist.trackCount} 首
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => playAll(songs, 0, playlist.id)}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-500 rounded-full text-sm font-medium"
            >
              ▶ 播放全部
            </button>
          </div>
        </div>
      </div>

      {/* 歌曲列表 */}
      <SongList songs={songs} sourceId={playlist.id} />
    </div>
  )
}