// src/pages/PlaylistDetail.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Share2 } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { usePlayerStore } from '../store/playerStore'
import SongList from '../components/SongList'
import { shareLink } from '../utils/share'
import type { Playlist, Song } from '../api/types'

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  const cover = (playlist.coverImgUrl || '').replace(/^http:/, 'https:')
  const hasCover = cover.startsWith('http')

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
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-lg overflow-hidden bg-neutral-800 shrink-0 mx-auto md:mx-0">
          {hasCover ? (
            <img src={`${cover}?param=400y400`} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
              无封面
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end min-w-0 text-center md:text-left">
          <div className="text-xs text-neutral-500 mb-2">歌单</div>
          <h1 className="text-xl md:text-3xl font-bold mb-3 line-clamp-2">{playlist.name}</h1>
          <div className="text-sm text-neutral-400 mb-4">
            {playlist.creator?.nickname} · {playlist.trackCount} 首
          </div>
          <div className="flex gap-3 flex-wrap justify-center md:justify-start">
            <button
              onClick={() => playAll(songs, 0, playlist.id)}
              className="flex items-center gap-2 px-5 md:px-6 py-2 bg-pink-600 hover:bg-pink-500 rounded-full text-sm font-medium transition-colors"
            >
              <Play size={16} fill="currentColor" />
              播放全部
            </button>
            <button
              onClick={() => shareLink(`/playlist/${playlist.id}`, '歌单链接')}
              className="flex items-center gap-2 px-5 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-sm transition-colors"
            >
              <Share2 size={16} />
              分享
            </button>
          </div>
        </div>
      </div>

      {/* 歌曲列表 */}
      <SongList songs={songs} sourceId={playlist.id} />
    </div>
  )
}