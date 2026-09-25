// src/player/mediaSession.ts
import type { Song } from '../api/types'
import { usePlayerStore } from '../store/playerStore'

let bound = false

export function bindMediaSession() {
  if (bound) return
  if (!('mediaSession' in navigator)) return
  bound = true

  const store = usePlayerStore.getState()
  navigator.mediaSession.setActionHandler('play', () => store.toggle())
  navigator.mediaSession.setActionHandler('pause', () => store.toggle())
  navigator.mediaSession.setActionHandler('previoustrack', () => store.prev())
  navigator.mediaSession.setActionHandler('nexttrack', () => store.next())
  navigator.mediaSession.setActionHandler('seekto', (d) => {
    if (d.seekTime != null) store.seek(d.seekTime)
  })
}

export function updateMediaSession(song: Song | null, playing: boolean) {
  if (!('mediaSession' in navigator)) return
  if (!song) {
    navigator.mediaSession.metadata = null
    return
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.name,
    artist: song.ar.map(a => a.name).join(' / '),
    album: song.al.name,
    artwork: [
      { src: `${song.al.picUrl}?param=96y96`, sizes: '96x96', type: 'image/jpeg' },
      { src: `${song.al.picUrl}?param=256y256`, sizes: '256x256', type: 'image/jpeg' },
      { src: `${song.al.picUrl}?param=512y512`, sizes: '512x512', type: 'image/jpeg' },
    ],
  })
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
}