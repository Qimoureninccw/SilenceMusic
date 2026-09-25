// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { Compass, Search, BarChart3, Heart, Settings as SettingsIcon } from 'lucide-react'

const links = [
  { to: '/', label: '发现音乐', Icon: Compass },
  { to: '/search', label: '搜索', Icon: Search },
  { to: '/toplist', label: '排行榜', Icon: BarChart3 },
  { to: '/my', label: '我的音乐', Icon: Heart },
  { to: '/settings', label: '设置', Icon: SettingsIcon },
]

export default function Sidebar() {
  return (
    <aside className="w-52 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col">
      <div className="h-14 flex items-center px-5 text-lg font-bold text-pink-500">
        Silence Music
      </div>
      <nav className="flex-1 py-2">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-white bg-neutral-800/60 border-l-2 border-pink-500'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}