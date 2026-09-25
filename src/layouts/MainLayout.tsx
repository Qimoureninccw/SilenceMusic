// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PlayerBar from '../components/PlayerBar'

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-neutral-900 text-white">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}