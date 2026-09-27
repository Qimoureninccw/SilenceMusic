// src/pages/SongRedirect.tsx
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/NeteaseAdapter'
import { usePlayerStore } from '../store/playerStore'

export default function SongRedirect() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playAll = usePlayerStore(s => s.playAll)

  useEffect(() => {
    if (!id) return
    api.songDetail([+id])
      .then(songs => {
        if (songs.length > 0) {
          playAll(songs, 0)
          navigate('/now-playing', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch(() => navigate('/', { replace: true }))
  }, [id])

  return <div className="p-6 text-neutral-500">加载中...</div>
}