// src/api/NeteaseAdapter.ts
import { request } from './client'
import { cached } from '../utils/cache'
import type {
  Song, SongUrl, Playlist, LyricData, Quality, Album,
} from './types'

// 缓存时长（毫秒）
const TTL = {
  search: 5 * 60_000,
  songDetail: 30 * 60_000,
  lyric: 60 * 60_000,
  playlist: 10 * 60_000,
  recommend: 30 * 60_000,
  album: 30 * 60_000,
  toplist: 30 * 60_000,
  hotSearch: 60 * 60_000,
}

export const api = {
  // ============ 搜索 ============
  async search(kw: string, opts: { limit?: number; offset?: number } = {}) {
    const limit = opts.limit ?? 30
    const offset = opts.offset ?? 0
    return cached(`search:${kw}:${limit}:${offset}`, TTL.search, async () => {
      const r = await request<any>('/cloudsearch', {
        keywords: kw, limit, offset, type: 1,
      })
      return {
        songs: (r.result?.songs ?? []) as Song[],
        total: r.result?.songCount ?? 0,
        hasMore: (r.result?.songCount ?? 0) > (offset + limit),
      }
    })
  },

  async searchSuggest(kw: string) {
    return request<any>('/search/suggest', { keywords: kw })
  },

  async hotSearch(): Promise<{ searchWord: string }[]> {
    return cached('hot_search', TTL.hotSearch, async () => {
      const r = await request<any>('/search/hot/detail')
      return (r.data ?? []) as { searchWord: string }[]
    })
  },

  // ============ 歌曲 ============
  async songDetail(ids: number[]): Promise<Song[]> {
    if (!ids.length) return []
    const key = 'songs:' + ids.slice().sort().join(',')
    return cached(key, TTL.songDetail, async () => {
      const r = await request<any>('/song/detail', { ids: ids.join(',') })
      return (r.songs ?? []) as Song[]
    })
  },

  async songUrl(id: number, level: Quality = 'exhigh'): Promise<SongUrl> {
    const r = await request<any>('/song/url/v1', { id, level })
    const item = r.data?.[0]
    return {
      id,
      url: item?.url ?? null,
      br: item?.br ?? 0,
      size: item?.size ?? 0,
      level: item?.level ?? level,
      expi: item?.expi ?? 1200,
      fee: item?.fee ?? 0,
      fetchedAt: Date.now(),
    }
  },

  async lyric(id: number): Promise<LyricData> {
    return cached(`lyric:${id}`, TTL.lyric, async () => {
      const r = await request<any>('/lyric/new', { id })
      return {
        lrc: r.lrc?.lyric ?? '',
        tlyric: r.tlyric?.lyric ?? '',
        yrc: r.yrc?.lyric ?? '',
        romalrc: r.romalrc?.lyric ?? '',
      }
    })
  },

  async checkMusic(id: number) {
    return request<{ success: boolean; message: string }>('/check/music', { id })
  },

  async scrobble(id: number, sourceid: number, time: number) {
    return request<any>('/scrobble', { id, sourceid, time }, { needLogin: true })
  },

  // ============ 歌单 ============
  async playlistDetail(id: number) {
    return cached(`playlist:${id}`, TTL.playlist, async () => {
      const r = await request<any>('/playlist/detail', { id })
      return {
        ...(r.playlist as Playlist),
        trackIds: (r.playlist?.trackIds ?? []) as { id: number }[],
        tracks: (r.playlist?.tracks ?? []) as Song[],
      }
    })
  },

  async playlistTrackAll(id: number): Promise<Song[]> {
    return cached(`playlist_tracks:${id}`, TTL.playlist, async () => {
      const r = await request<any>('/playlist/track/all', { id })
      return (r.songs ?? []) as Song[]
    })
  },

  async topPlaylist(opts: { cat?: string; order?: 'hot' | 'new'; limit?: number; offset?: number } = {}) {
    const cat = opts.cat ?? '全部'
    const order = opts.order ?? 'hot'
    const limit = opts.limit ?? 30
    const offset = opts.offset ?? 0
    return cached(`top_playlist:${cat}:${order}:${limit}:${offset}`, TTL.recommend, async () => {
      const r = await request<any>('/top/playlist', { cat, order, limit, offset })
      return {
        playlists: (r.playlists ?? []) as Playlist[],
        more: !!r.more,
      }
    })
  },

  async personalized(limit = 30): Promise<Playlist[]> {
    return cached(`personalized:${limit}`, TTL.recommend, async () => {
      const r = await request<any>('/personalized', { limit })
      return (r.result ?? []) as Playlist[]
    })
  },

  // ============ 用户 ============
  async userPlaylist(uid: number): Promise<Playlist[]> {
    const r = await request<any>('/user/playlist', { uid }, { needLogin: true })
    return (r.playlist ?? []) as Playlist[]
  },

  async likelist(uid: number): Promise<number[]> {
    const r = await request<any>('/likelist', { uid }, { needLogin: true })
    return (r.ids ?? []) as number[]
  },

  async like(id: number, like = true) {
    return request<any>('/like', { id, like }, { needLogin: true })
  },

  async userAccount() {
    return request<any>('/user/account', {}, { needLogin: true })
  },

  // ============ 推荐 ============
  async recommendSongs(): Promise<Song[]> {
    const r = await request<any>('/recommend/songs', {}, { needLogin: true })
    return (r.data?.dailySongs ?? []) as Song[]
  },

  async recommendResource(): Promise<Playlist[]> {
    const r = await request<any>('/recommend/resource', {}, { needLogin: true })
    return (r.recommend ?? []) as Playlist[]
  },

  async personalFM(): Promise<Song[]> {
    const r = await request<any>('/personal_fm', {}, { needLogin: true })
    return (r.data ?? []) as Song[]
  },

  // ============ 榜单 / 新歌 ============
  async toplist() {
    return cached('toplist', TTL.toplist, async () => {
      const r = await request<any>('/toplist')
      return (r.list ?? []) as any[]
    })
  },

  async topSong(type = 0): Promise<Song[]> {
    return cached(`top_song:${type}`, TTL.recommend, async () => {
      const r = await request<any>('/top/song', { type })
      return (r.data ?? []) as Song[]
    })
  },

  // ============ 歌手 / 专辑 ============
  async artistTopSong(id: number): Promise<Song[]> {
    return cached(`artist_top:${id}`, TTL.album, async () => {
      const r = await request<any>('/artist/top/song', { id })
      return (r.songs ?? []) as Song[]
    })
  },

  async artistDetail(id: number) {
    return cached(`artist_detail:${id}`, TTL.album, async () => {
      const r = await request<any>('/artist/detail', { id })
      return r.data
    })
  },

  async artistAlbum(id: number, limit = 30, offset = 0) {
    return cached(`artist_album:${id}:${limit}:${offset}`, TTL.album, async () => {
      const r = await request<any>('/artist/album', { id, limit, offset })
      return {
        hotAlbums: (r.hotAlbums ?? []) as Album[],
        more: !!r.more,
      }
    })
  },

  async album(id: number): Promise<{ album: Album; songs: Song[] }> {
    return cached(`album:${id}`, TTL.album, async () => {
      const r = await request<any>('/album', { id })
      return {
        album: r.album as Album,
        songs: (r.songs ?? []) as Song[],
      }
    })
  },

  // ============ 登录 ============
  async loginByPhone(phone: string, password: string) {
    const r = await request<any>('/login/cellphone', { phone, password })
    return { cookie: r.cookie as string, profile: r.profile }
  },

  async loginQrKey(): Promise<string> {
    const r = await request<any>('/login/qr/key', { timestamp: Date.now() })
    return r.data?.unikey
  },

  async loginQrCreate(key: string) {
    const r = await request<any>('/login/qr/create', { key, qrimg: true, timestamp: Date.now() })
    return { qrimg: r.data?.qrimg as string, qrurl: r.data?.qrurl as string }
  },

  async loginQrCheck(key: string) {
    const r = await request<any>('/login/qr/check', { key, timestamp: Date.now() })
    return { code: r.code as 800 | 801 | 802 | 803, cookie: r.cookie as string | undefined }
  },

  async loginStatus() {
    return request<any>('/login/status', {}, { needLogin: true })
  },

  async logout() {
    return request<any>('/logout', { timestamp: Date.now() })
  },
}