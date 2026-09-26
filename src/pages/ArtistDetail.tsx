// src/pages/ArtistDetail.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { usePlayerStore } from '../store/playerStore'
import SongList from '../components/SongList'
import type { Album, Song } from '../api/types'

type Tab = 'hot' | 'albums' | 'desc'

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playAll = usePlayerStore(s => s.playAll)

  const [tab, setTab] = useState<Tab>('hot')
  const [detail, setDetail] = useState<any>(null)
  const [hotSongs, setHotSongs] = useState<Song[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.artistDetail(+id),
      api.artistTopSong(+id),
      api.artistAlbum(+id, 50),
    ]).then(([d, s, a]) => {
      setDetail(d)
      setHotSongs(s ?? [])
      setAlbums(a.hotAlbums ?? [])
    }).catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-neutral-500">加载中...</div>
  if (!detail) return <div className="p-6 text-neutral-500">歌手不存在</div>

  const artist = detail.artist ?? {}
  const cover = artist.cover || artist.picUrl || ''

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
      <div className="flex gap-6 mb-6">
        <div className="w-40 h-40 rounded-full overflow-hidden bg-neutral-800 shrink-0">
          {cover ? (
            <img src={`${cover}?param=400y400`} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">
              无头像
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end min-w-0">
          <div className="text-xs text-neutral-500 mb-2">歌手</div>
          <h1 className="text-3xl font-bold mb-3 line-clamp-2">{artist.name}</h1>
          {artist.alias?.length > 0 && (
            <div className="text-sm text-neutral-400 mb-2">
              {artist.alias.join(' / ')}
            </div>
          )}
          <div className="text-sm text-neutral-400 mb-4">
            {artist.musicSize ?? 0} 首歌 · {artist.albumSize ?? 0} 张专辑
          </div>
          <div>
            <button
              disabled={!hotSongs.length}
              onClick={() => playAll(hotSongs, 0)}
              className="flex items-center gap-2 px-6 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 rounded-full text-sm font-medium transition-colors"
            >
              <Play size={16} fill="currentColor" />
              播放热门 50
            </button>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-6 border-b border-neutral-800 mb-6">
        {[
          { key: 'hot', label: '热门歌曲' },
          { key: 'albums', label: '专辑' },
          { key: 'desc', label: '歌手简介' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-white border-pink-500'
                : 'text-neutral-400 border-transparent hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容 */}
      {tab === 'hot' && <SongList songs={hotSongs} />}

      {tab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {albums.map(a => (
            <Link key={a.id} to={`/album/${a.id}`} className="group">
              <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
                <img
                  src={`${a.picUrl}?param=300y300`}
                  alt={a.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <div className="mt-2 text-sm line-clamp-2 text-neutral-200 group-hover:text-white">
                {a.name}
              </div>
              {a.publishTime && (
                <div className="text-xs text-neutral-500">
                  {new Date(a.publishTime).getFullYear()}
                </div>
              )}
            </Link>
          ))}
          {albums.length === 0 && (
            <div className="col-span-full text-neutral-500 text-sm py-8 text-center">
              暂无专辑
            </div>
          )}
        </div>
      )}

      {tab === 'desc' && (
        <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap max-w-3xl">
          {detail.introduction?.map((block: any, i: number) => (
            <div key={i} className="mb-4">
              {block.ti && <div className="font-semibold mb-2">{block.ti}</div>}
              {block.txt && <p className="text-neutral-400">{block.txt}</p>}
            </div>
          )) || <div className="text-neutral-500">暂无简介</div>}
        </div>
      )}
    </div>
  )
}