// src/pages/Discover.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/NeteaseAdapter'
import type { Playlist, Song } from '../api/types'

export default function Discover() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newsongs, setNewsongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

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
      <section>
        <h2 className="text-xl font-semibold mb-4">推荐歌单</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {playlists.map(p => {
            // 兼容 coverImgUrl 和 picUrl 两种字段名
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

      <section>
        <h2 className="text-xl font-semibold mb-4">新歌速递</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {newsongs.map(s => {
            // 兼容 al 和 album 两种字段名
            const al: any = s.al ?? (s as any).album ?? {}
            const ar: any[] = s.ar ?? (s as any).artists ?? []
            const cover = al.picUrl || ''
            return (
              <div key={s.id} className="group">
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