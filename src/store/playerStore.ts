// src/store/playerStore.ts
import { create } from 'zustand'
import { player } from '../player/engine'
import { prefetchUrl } from '../api/songUrl'
import type { Quality, Song } from '../api/types'
export type PlayMode = 'order' | 'repeat' | 'repeatOne' | 'shuffle'

interface PlayerState {
  queue: Song[]
  currentIndex: number
  playing: boolean
  currentTime: number
  duration: number
  loading: boolean
  volume: number
  mode: PlayMode
  quality: Quality
  sourceId: number | null      // 打卡用：歌单/专辑 id

  playAll: (songs: Song[], startIndex?: number, sourceId?: number | null) => void
  playSong: (song: Song, sourceId?: number | null) => void
  playNext: (song: Song) => void       // 下一首播放（插队）
  next: () => void
  prev: () => void
  toggle: () => void
  seek: (t: number) => void
  setVolume: (v: number) => void
  setMode: (m: PlayMode) => void
  setQuality: (q: Quality) => void
  clear: () => void
}

function loadPersist() {
  try {
    const raw = localStorage.getItem('playerState')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function savePersist(s: Partial<PlayerState>) {
  const keep = {
    queue: s.queue, currentIndex: s.currentIndex, mode: s.mode,
    quality: s.quality, volume: s.volume,
  }
  localStorage.setItem('playerState', JSON.stringify(keep))
}

const persisted = loadPersist()

export const usePlayerStore = create<PlayerState>((set, get) => {
  // 绑定引擎回调
  player.onEnded = () => get().next()
  player.onError = (msg) => {
    console.warn('[player]', msg)
    // 自动跳下一首（如果还有）
    setTimeout(() => get().next(), 800)
  }
  player.subscribe(snap => {
    set({
      playing: snap.playing,
      currentTime: snap.currentTime,
      duration: snap.duration,
      loading: snap.loading,
    })
  })

  // 恢复音量
  const initialVolume = persisted?.volume ?? player.getVolume()

  return {
    queue: persisted?.queue ?? [],
    currentIndex: persisted?.currentIndex ?? -1,
    playing: false,
    currentTime: 0,
    duration: 0,
    loading: false,
    volume: initialVolume,
    mode: persisted?.mode ?? 'order',
    quality: persisted?.quality ?? 'exhigh',
    sourceId: null,

    playAll(songs, startIndex = 0, sourceId = null) {
      if (!songs.length) return
      set({ queue: songs, currentIndex: startIndex, sourceId })
      savePersist({ ...get(), queue: songs, currentIndex: startIndex })
      const song = songs[startIndex]
      player.load(song, get().quality).then(() => {
        prefetchNext(get())
      }).catch(() => {})
    },

    playSong(song, sourceId = null) {
      const { queue } = get()
      const existIdx = queue.findIndex(s => s.id === song.id)
      if (existIdx >= 0) {
        set({ currentIndex: existIdx, sourceId })
        player.load(queue[existIdx], get().quality)
      } else {
        const newQueue = [...queue, song]
        set({ queue: newQueue, currentIndex: newQueue.length - 1, sourceId })
        player.load(song, get().quality)
      }
      savePersist(get())
    },

    playNext(song) {
      const { queue, currentIndex } = get()
      if (!queue.length) return get().playAll([song])
      const newQueue = [...queue]
      newQueue.splice(currentIndex + 1, 0, song)
      set({ queue: newQueue })
      savePersist(get())
    },

    next() {
      const { queue, currentIndex, mode } = get()
      if (!queue.length) return
      let nextIdx: number
      if (mode === 'repeatOne') nextIdx = currentIndex
      else if (mode === 'shuffle') {
        if (queue.length === 1) nextIdx = 0
        else {
          do { nextIdx = Math.floor(Math.random() * queue.length) }
          while (nextIdx === currentIndex)
        }
      } else {
        nextIdx = currentIndex + 1
        if (nextIdx >= queue.length) {
          if (mode === 'repeat') nextIdx = 0
          else { player.pause(); return }  // order 模式播完就停
        }
      }
      set({ currentIndex: nextIdx })
      player.load(queue[nextIdx], get().quality).then(() => prefetchNext(get()))
      savePersist(get())
    },

    prev() {
      const { queue, currentIndex } = get()
      if (!queue.length) return
      // 播放超过 3 秒 → 重播当前
      if (player.currentTime > 3) return player.seek(0)
      const prevIdx = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1
      set({ currentIndex: prevIdx })
      player.load(queue[prevIdx], get().quality)
      savePersist(get())
    },

    toggle() {
      const { queue, currentIndex } = get()
      if (!queue.length) return
      if (currentIndex < 0) return get().playAll(queue, 0)
      player.toggle()
    },

    seek(t) { player.seek(t) },

    setVolume(v) {
      player.setVolume(v)
      set({ volume: v })
      savePersist(get())
    },

    setMode(m) { set({ mode: m }); savePersist(get()) },
    setQuality(q) { set({ quality: q }); savePersist(get()) },

    clear() {
      player.pause()
      set({ queue: [], currentIndex: -1, playing: false })
      savePersist(get())
    },
  }
})

// 播放到 80% 预取下一首
function prefetchNext(state: { queue: Song[]; currentIndex: number; mode: PlayMode; quality: Quality }) {
  const { queue, currentIndex, mode, quality } = state
  if (mode === 'repeatOne') return
  const nextIdx = currentIndex + 1
  if (nextIdx < queue.length) prefetchUrl(queue[nextIdx].id, quality)
}