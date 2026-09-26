// src/pages/Discover.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { api } from '../api/NeteaseAdapter'
import { usePlayerStore } from '../store/playerStore'
import type { Playlist, Song } from '../api/types'

export default function Discover() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newsongs, setNewsongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const playAll = usePlayerStore(s => s.playAll)

  useEffect(() => {
    Promise.all([
      api.personalized(18),
      api.topSong(0),
    ]).then(([pl, ns]) => {
      console.log('推荐歌单第一项：', pl?.[0])
      console.log('新歌第一首：', ns?.[0])
      setPlaylists((pl ?? []).filter(p => p && (p.coverImgUrl || (p as any).picUrl)))
      const valid = (ns ?? []).filter(s => s && (s.al || (s as any).album))
      setNewsongs(valid.slice(0, 12))
    }).catch(err => console.error('[Discover]', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-neutral-500">加载中...</div>

  return (
    <div className="p-6 space-y-10">
      {/* 推荐歌单 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">推荐歌单</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {playlists.map(p => {
            const cover = p.coverImgUrl || (p as any).picUrl || ''
            return (
              <Link key={p.id} to={`/playlist/${p.id}`} className="group">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800">
                  {cover ? (
                    <img
                      src={`${cover}?param=300y300`}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                      无封面
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm line-clamp-2 text-neutral-200 group-hover:text-white">
                  {p.name}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 新歌速递 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">新歌速递</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {newsongs.map((s, index) => {
            const al: any = s.al ?? (s as any).album ?? {}
            const ar: any[] = s.ar ?? (s as any).artists ?? []
            const cover = al.picUrl || ''
            return (
              <div
                key={s.id}
                onClick={() => playAll(newsongs, index)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800">
                  {cover ? (
                    <img
                      src={`${cover}?param=300y300`}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                      无封面
                    </div>
                  )}

                  {/* 悬停播放按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      playAll(newsongs, index)
                    }}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg hover:bg-pink-500"
                    title="播放"
                  >
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
                <div className="mt-2 text-sm line-clamp-2">{s.name}</div>
                <div className="text-xs text-neutral-500 line-clamp-1">
                  {ar.map((a: any) => a.name).join(' / ')}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}