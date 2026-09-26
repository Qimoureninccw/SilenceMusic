// src/components/SongList.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, Plus, Heart, ListPlus, Trash2 } from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import { useUserStore } from '../store/userStore'
import type { Song } from '../api/types'

function fmt(ms: number) {
  if (!ms) return '--:--'
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

interface Props {
  songs: Song[]
  sourceId?: number | null
  showAlbum?: boolean
  onRemove?: (song: Song) => void
}

export default function SongList({ songs, sourceId = null, showAlbum = true, onRemove }: Props) {
  const playAll = usePlayerStore(s => s.playAll)
  const playNext = usePlayerStore(s => s.playNext)
  const currentIndex = usePlayerStore(s => s.currentIndex)
  const queue = usePlayerStore(s => s.queue)
  const playing = usePlayerStore(s => s.playing)
  const toggle = usePlayerStore(s => s.toggle)

  const likedIds = useUserStore(s => s.likedIds)
  const toggleLike = useUserStore(s => s.toggleLike)
  const playlists = useUserStore(s => s.playlists)
  const addToPlaylist = useUserStore(s => s.addToPlaylist)

  const [menuSong, setMenuSong] = useState<Song | null>(null)

  const currentId = currentIndex >= 0 ? queue[currentIndex]?.id : null

  const handlePlay = (index: number) => {
    if (songs[index].id === currentId) {
      toggle()
      return
    }
    playAll(songs, index, sourceId)
  }

  return (
    <div className="text-sm">
      {/* 表头 */}
      <div className="grid grid-cols-[40px_1fr_1fr_140px] gap-3 px-3 py-2 text-xs text-neutral-500 border-b border-neutral-800">
        <div>#</div>
        <div>标题</div>
        {showAlbum && <div>专辑</div>}
        <div className="text-right pr-2">时长</div>
      </div>

      {/* 列表 */}
      {songs.map((song, i) => {
        const isCurrent = song.id === currentId
        const isLiked = likedIds.includes(song.id)
        return (
          <div
            key={`${song.id}-${i}`}
            onDoubleClick={() => handlePlay(i)}
            className={`group grid grid-cols-[40px_1fr_1fr_140px] gap-3 px-3 py-2 items-center rounded hover:bg-neutral-800/50 cursor-pointer ${
              isCurrent ? 'text-pink-400' : 'text-neutral-200'
            }`}
          >
            {/* 序号 / 播放按钮 */}
            <div className="text-neutral-500 text-center">
              {isCurrent && playing ? (
                <button onClick={() => toggle()} className="text-pink-400">
                  <Pause size={14} fill="currentColor" />
                </button>
              ) : (
                <>
                  <span className="group-hover:hidden">{i + 1}</span>
                  <button
                    onClick={() => handlePlay(i)}
                    className="hidden group-hover:inline-flex text-white"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                </>
              )}
            </div>

            {/* 歌曲信息 */}
            <div className="flex items-center gap-3 min-w-0">
              {song.al?.picUrl ? (
                <img
                  src={`${song.al.picUrl}?param=80y80`}
                  alt=""
                  className="w-10 h-10 rounded shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded shrink-0 bg-neutral-800" />
              )}
              <div className="min-w-0">
                <div className="truncate">{song.name}</div>
                <div className="truncate text-xs text-neutral-500">
                  {song.ar?.map((a, idx) => (
                    <span key={a.id}>
                      <Link
                        to={`/artist/${a.id}`}
                        onClick={e => e.stopPropagation()}
                        className="hover:text-white hover:underline"
                      >
                        {a.name}
                      </Link>
                      {idx < song.ar.length - 1 && ' / '}
                    </span>
                  )) ?? ''}
                </div>
              </div>
            </div>

            {/* 专辑 */}
            {showAlbum && (
              <div className="truncate text-neutral-400 text-xs">
                {song.al?.id ? (
                  <Link
                    to={`/album/${song.al.id}`}
                    onClick={e => e.stopPropagation()}
                    className="hover:text-white hover:underline"
                  >
                    {song.al.name}
                  </Link>
                ) : (
                  song.al?.name ?? ''
                )}
              </div>
            )}

            {/* 操作区 */}
            <div className="flex items-center justify-end gap-3 text-neutral-500 text-xs">
              {/* 喜欢 */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLike(song.id) }}
                className={`transition-colors ${
                  isLiked
                    ? 'text-pink-500'
                    : 'opacity-0 group-hover:opacity-100 hover:text-white'
                }`}
                title={isLiked ? '取消喜欢' : '喜欢'}
              >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              {/* 加入歌单 */}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuSong(song) }}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-colors"
                title="添加到歌单"
              >
                <ListPlus size={14} />
              </button>

              {/* 下一首播放 */}
              <button
                onClick={(e) => { e.stopPropagation(); playNext(song) }}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-colors"
                title="下一首播放"
              >
                <Plus size={14} />
              </button>

              {/* 从歌单移除 */}
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`从歌单移除「${song.name}」？`)) onRemove(song)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-colors"
                  title="从歌单移除"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <span className="w-10 text-right tabular-nums">{fmt(song.dt)}</span>
            </div>
          </div>
        )
      })}

      {songs.length === 0 && (
        <div className="text-center py-16 text-neutral-500">没有歌曲</div>
      )}

      {/* 加入歌单弹窗 */}
      {menuSong && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setMenuSong(null)}
        >
          <div
            className="bg-neutral-900 rounded-xl p-5 w-80 max-h-[70vh] overflow-y-auto border border-neutral-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-base font-semibold mb-1">添加到歌单</div>
            <div className="text-xs text-neutral-500 mb-4 truncate">
              {menuSong.name}
            </div>

            {playlists.length === 0 ? (
              <div className="text-sm text-neutral-500 py-6 text-center">
                还没有歌单，去「我的音乐」创建一个
              </div>
            ) : (
              <div className="space-y-1">
                {playlists.map(pl => {
                  const already = pl.songIds.includes(menuSong.id)
                  return (
                    <button
                      key={pl.id}
                      disabled={already}
                      onClick={() => {
                        addToPlaylist(pl.id, menuSong.id)
                        setMenuSong(null)
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${
                        already
                          ? 'text-neutral-600 cursor-not-allowed'
                          : 'hover:bg-neutral-800'
                      }`}
                    >
                      <span className="truncate">{pl.name}</span>
                      <span className="text-xs text-neutral-500 shrink-0 ml-2">
                        {already ? '已添加' : `${pl.songIds.length} 首`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setMenuSong(null)}
              className="w-full mt-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}