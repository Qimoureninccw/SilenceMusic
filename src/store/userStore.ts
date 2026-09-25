// src/store/userStore.ts
import { create } from 'zustand'
import type { Song } from '../api/types'

const LIKED_KEY = 'sm_liked'
const PLAYLISTS_KEY = 'sm_playlists'
const HISTORY_KEY = 'sm_history'

export interface LocalPlaylist {
  id: string           // 本地 id，用 `local_${Date.now()}` 生成
  name: string
  cover?: string       // 自定义封面 url，没传则用第一首歌的封面
  songIds: number[]    // 存 id，用的时候去 songDetail 批量拿
  createdAt: number
}

interface UserState {
  likedIds: number[]
  playlists: LocalPlaylist[]
  history: { song: Song; playedAt: number }[]

  // 喜欢
  isLiked: (id: number) => boolean
  toggleLike: (id: number) => void

  // 歌单
  createPlaylist: (name: string) => LocalPlaylist
  deletePlaylist: (id: string) => void
  renamePlaylist: (id: string, name: string) => void
  addToPlaylist: (playlistId: string, songId: number) => void
  removeFromPlaylist: (playlistId: string, songId: number) => void

  // 历史
  addHistory: (song: Song) => void
  clearHistory: () => void
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key: string, v: any) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
}

export const useUserStore = create<UserState>((set, get) => ({
  likedIds: load<number[]>(LIKED_KEY, []),
  playlists: load<LocalPlaylist[]>(PLAYLISTS_KEY, []),
  history: load<{ song: Song; playedAt: number }[]>(HISTORY_KEY, []),

  isLiked: (id) => get().likedIds.includes(id),

  toggleLike: (id) => {
    const { likedIds } = get()
    const next = likedIds.includes(id)
      ? likedIds.filter(x => x !== id)
      : [...likedIds, id]
    set({ likedIds: next })
    save(LIKED_KEY, next)
  },

  createPlaylist: (name) => {
    const pl: LocalPlaylist = {
      id: 'local_' + Date.now(),
      name: name.trim() || '新建歌单',
      songIds: [],
      createdAt: Date.now(),
    }
    const next = [...get().playlists, pl]
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
    return pl
  },

  deletePlaylist: (id) => {
    const next = get().playlists.filter(p => p.id !== id)
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  renamePlaylist: (id, name) => {
    const next = get().playlists.map(p => p.id === id ? { ...p, name } : p)
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  addToPlaylist: (playlistId, songId) => {
    const next = get().playlists.map(p => {
      if (p.id !== playlistId) return p
      if (p.songIds.includes(songId)) return p
      return { ...p, songIds: [...p.songIds, songId] }
    })
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  removeFromPlaylist: (playlistId, songId) => {
    const next = get().playlists.map(p =>
      p.id === playlistId
        ? { ...p, songIds: p.songIds.filter(id => id !== songId) }
        : p
    )
    set({ playlists: next })
    save(PLAYLISTS_KEY, next)
  },

  addHistory: (song) => {
    const { history } = get()
    // 去重：同一首只保留最新的
    const filtered = history.filter(h => h.song.id !== song.id)
    const next = [{ song, playedAt: Date.now() }, ...filtered].slice(0, 200)
    set({ history: next })
    save(HISTORY_KEY, next)
  },

  clearHistory: () => {
    set({ history: [] })
    save(HISTORY_KEY, [])
  },
}))