// src/pages/Search.tsx
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/NeteaseAdapter'
import SongList from '../components/SongList'
import type { Song } from '../api/types'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const initialKw = params.get('kw') ?? ''
  const [kw, setKw] = useState(initialKw)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [hot, setHot] = useState<{ searchWord: string }[]>([])
  const timer = useRef<number | null>(null)

  // 加载热搜
  useEffect(() => {
    api.hotSearch().then(setHot).catch(() => {})
  }, [])

  // 防抖搜索
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    if (!kw.trim()) { setSongs([]); return }

    timer.current = window.setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.search(kw.trim(), { limit: 30 })
        setSongs(r.songs)
        setParams({ kw: kw.trim() }, { replace: true })
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [kw])

  return (
    <div className="p-6">
      <div className="max-w-2xl mb-6">
        <input
          autoFocus
          value={kw}
          onChange={e => setKw(e.target.value)}
          placeholder="搜索歌曲、歌手、专辑..."
          className="w-full bg-neutral-800 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-neutral-500"
        />
      </div>

      {/* 热搜（没输入时显示） */}
      {!kw.trim() && hot.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm text-neutral-400 mb-3">🔥 热门搜索</h3>
          <div className="flex flex-wrap gap-2">
            {hot.map((h, i) => (
              <button
                key={i}
                onClick={() => setKw(h.searchWord)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-full text-sm"
              >
                {h.searchWord}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {loading && <div className="text-neutral-500 text-sm">搜索中...</div>}
      {!loading && songs.length > 0 && (
        <div>
          <div className="text-sm text-neutral-400 mb-3">找到 {songs.length} 首歌曲</div>
          <SongList songs={songs} />
        </div>
      )}
      {!loading && kw.trim() && songs.length === 0 && (
        <div className="text-neutral-500">没有找到相关歌曲</div>
      )}
    </div>
  )
}