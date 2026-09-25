// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Discover from './pages/Discover'
import Search from './pages/Search'
import PlaylistDetail from './pages/PlaylistDetail'
import NowPlaying from './pages/NowPlaying'   // 新增
import { useEffect } from 'react'
import { bindMediaSession, updateMediaSession } from './player/mediaSession'
import { usePlayerStore } from './store/playerStore'
import Toplist from './pages/Toplist'
import { useHistoryTracker } from './hooks/useHistoryTracker'
import MyMusic from './pages/MyMusic'
import Liked from './pages/Liked'
import History from './pages/History'
import LocalPlaylistDetail from './pages/LocalPlaylistDetail'
import Settings from './pages/Settings'
import { useThemeStore } from './store/themeStore'


function MediaSessionSync() {
  useHistoryTracker()
  const initTheme = useThemeStore(s => s.initTheme)
  const { queue, currentIndex, playing } = usePlayerStore()
  const song = currentIndex >= 0 ? queue[currentIndex] : null

  useEffect(() => { initTheme() }, [initTheme])
  useEffect(() => { bindMediaSession() }, [])
  useEffect(() => { updateMediaSession(song, playing) }, [song, playing])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <MediaSessionSync />
      <Routes>
        {/* 全屏播放页，独立于 MainLayout */}
        <Route path="/now-playing" element={<NowPlaying />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Discover />} />
          <Route path="/search" element={<Search />} />
          <Route path="/playlist/:id" element={<PlaylistDetail />} />
          <Route path="/toplist" element={<Toplist />} />
          <Route path="/my-music" element={<MyMusic />} />
          <Route path="/my" element={<MyMusic />} />
          <Route path="/liked" element={<Liked />} />
          <Route path="/history" element={<History />} />
          <Route path="/local-playlist/:id" element={<LocalPlaylistDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}