// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PlayerBar from '../components/PlayerBar'
import BottomNav from '../components/BottomNav'

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-neutral-900 text-white">
      <div className="flex-1 flex overflow-hidden">
        {/* 桌面端侧边栏 */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">
          <Outlet />
        </main>
      </div>
      <PlayerBar />
      {/* 手机底部导航 */}
      <BottomNav />
    </div>
  )
}