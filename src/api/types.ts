// src/api/types.ts
export interface Artist {
  id: number
  name: string
  picUrl?: string
}

export interface Album {
  id: number
  name: string
  picUrl: string
  publishTime?: number
  artists?: Artist[]
}

export interface Song {
  id: number
  name: string
  ar: Artist[]
  al: Album
  dt: number               // 时长（毫秒）
  fee: number              // 0 免费 / 1 VIP / 8 低质免费
  mv?: number
  alia?: string[]
  privilege?: {
    st: number
    plLevel: string
    maxBrLevel: string
  }
}

export type Quality =
  | 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires'
  | 'jyeffect' | 'dolby' | 'vivid' | 'jymaster' | 'sky'

export interface SongUrl {
  id: number
  url: string | null
  br: number
  size: number
  level: string
  expi: number
  fee: number
  fetchedAt: number
}

export interface Song {
  id: number
  name: string
  ar: Artist[]           // 保留（这个一般都有）
  al: Album              // 保留，但渲染时要判断
  dt: number
  fee: number
  mv?: number
  alia?: string[]
  privilege?: {
    st: number
    plLevel: string
    maxBrLevel: string
  }
}

export interface Playlist {
  id: number
  name: string
  coverImgUrl: string
  trackCount: number
  playCount?: number
  description?: string
  creator?: { nickname: string; userId: number; avatarUrl?: string }
}

export interface LyricData {
  lrc: string
  tlyric?: string
  yrc?: string
  romalrc?: string
}