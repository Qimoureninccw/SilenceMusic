// src/pages/Toplist.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/NeteaseAdapter'

interface TopItem {
  id: number
  name: string
  coverImgUrl: string
  updateFrequency: string
  description?: string
  trackNumberUpdateTime?: number
}

export default function Toplist() {
  const [lists, setLists] = useState<TopItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.toplist()
      .then(data => {
        // 官方榜单一般前 4 个是"飙升榜/新歌榜/原创榜/热歌榜"，可单独强调
        setLists(data ?? [])
      })
      .catch(err => console.error('[Toplist]', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-neutral-500">加载中...</div>

  // 前 4 个作为"官方榜"，其余作为"更多榜单"
  const official = lists.slice(0, 4)
  const others = lists.slice(4)

  return (
    <div className="p-6 space-y-10">
      {/* 官方榜 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">官方榜</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {official.map(item => (
            <Link
              key={item.id}
              to={`/playlist/${item.id}`}
              className="group flex gap-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-lg p-3 transition-colors"
            >
              <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-700">
                <img
                  src={`${item.coverImgUrl}?param=200y200`}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="font-semibold truncate mb-1">{item.name}</div>
                <div className="text-xs text-neutral-500 truncate mb-2">
                  {item.updateFrequency}
                </div>
                <div className="text-xs text-neutral-400 line-clamp-2">
                  {item.description ?? ''}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 更多榜单 */}
      {others.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">更多榜单</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {others.map(item => (
              <Link key={item.id} to={`/playlist/${item.id}`} className="group">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800">
                  <img
                    src={`${item.coverImgUrl}?param=300y300`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
                <div className="mt-2 text-sm line-clamp-2 text-neutral-200 group-hover:text-white">
                  {item.name}
                </div>
                <div className="text-xs text-neutral-500 line-clamp-1">
                  {item.updateFrequency}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}