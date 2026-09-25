// src/player/engine.ts
import { getPlayableUrl } from '../api/songUrl'
import type { Quality, Song } from '../api/types'

export interface EngineSnapshot {
  playing: boolean
  currentTime: number
  duration: number
  loading: boolean
}

type Listener = (s: EngineSnapshot) => void

class PlayerEngine {
  private audio: HTMLAudioElement
  private listeners = new Set<Listener>()
  private loading = false

  // 播放结束、出错时回调，由 store 接管
  onEnded: (() => void) | null = null
  onError: ((msg: string) => void) | null = null

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'

    const emit = () => this.emit()
    this.audio.addEventListener('timeupdate', emit)
    this.audio.addEventListener('durationchange', emit)
    this.audio.addEventListener('loadedmetadata', emit)
    this.audio.addEventListener('play', emit)
    this.audio.addEventListener('pause', emit)
    this.audio.addEventListener('waiting', () => { this.loading = true; emit() })
    this.audio.addEventListener('canplay', () => { this.loading = false; emit() })
    this.audio.addEventListener('ended', () => this.onEnded?.())
    this.audio.addEventListener('error', () => {
      this.loading = false
      this.onError?.('音频加载失败')
      emit()
    })
  }

  // 音量持久化
  setVolume(v: number) {
    this.audio.volume = Math.max(0, Math.min(1, v))
    localStorage.setItem('volume', String(this.audio.volume))
  }

  getVolume() {
    const v = parseFloat(localStorage.getItem('volume') ?? '1')
    this.audio.volume = isNaN(v) ? 1 : v
    return this.audio.volume
  }

  async load(song: Song, level: Quality, autoplay = true) {
    this.loading = true
    this.emit()
    try {
      const url = await getPlayableUrl(song.id, level)
      if (this.audio.src !== url) this.audio.src = url
      if (autoplay) await this.audio.play()
    } catch (e: any) {
      this.loading = false
      this.emit()
      if (e.message === 'NO_URL') this.onError?.('该歌曲无法播放（无版权或需要 VIP）')
      else this.onError?.(e.message ?? '加载失败')
      throw e
    } finally {
      this.loading = false
      this.emit()
    }
  }

  play() { return this.audio.play() }
  pause() { this.audio.pause() }
  toggle() { this.audio.paused ? this.play() : this.pause() }
  seek(t: number) { this.audio.currentTime = t }

  get currentTime() { return this.audio.currentTime }
  get duration() { return this.audio.duration || 0 }
  get paused() { return this.audio.paused }

  private emit() {
    const snap: EngineSnapshot = {
      playing: !this.audio.paused,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration || 0,
      loading: this.loading,
    }
    this.listeners.forEach(fn => fn(snap))
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

export const player = new PlayerEngine()