// src/pages/AlbumDetail.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { usePlayerStore } from '../store/playerStore'
import SongList from '../components/SongList'
import type { Album, Song } from '../api/types'

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playAll = usePlayerStore(s => s.playAll)

  const [album, setAlbum] = useState<Album | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.album(+id)
      .then(r => {
        setAlbum(r.album)
        setSongs(r.songs ?? [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-neutral-500">加载中...</div>
  if (!album) return <div className="p-6 text-neutral-500">专辑不存在</div>

  const cover = album.picUrl ? `${album.picUrl}?param=400y400` : ''

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors mb-4"
        title="返回"
      >
        <ArrowLeft size={20} />
      </button>

      {/* 头部 */}
      <div className="flex gap-6 mb-8">
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
          {cover ? (
            <img src={cover} alt={album.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">
              无封面
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end min-w-0">
          <div className="text-xs text-neutral-500 mb-2">专辑</div>
          <h1 className="text-3xl font-bold mb-3 line-clamp-2">{album.name}</h1>
          <div className="text-sm text-neutral-400 mb-1">
            歌手：{album.artists?.map(a => a.name).join(' / ') ?? '未知'}
          </div>
          {album.publishTime && (
            <div className="text-sm text-neutral-400 mb-4">
              发行时间：{new Date(album.publishTime).toLocaleDateString()}
            </div>
          )}
          <div>
            <button
              disabled={!songs.length}
              onClick={() => playAll(songs, 0)}
              className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 rounded-full text-sm font-medium transition-colors"
            >
              <Play size={16} fill="currentColor" />
              播放全部
            </button>
          </div>
        </div>
      </div>

      <SongList songs={songs} showAlbum={false} />
    </div>
  )
}