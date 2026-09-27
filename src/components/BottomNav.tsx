// src/components/BottomNav.tsx
import { NavLink } from 'react-router-dom'
import { Compass, Search, BarChart3, Heart, Settings } from 'lucide-react'

const links = [
  { to: '/', label: '发现', Icon: Compass },
  { to: '/search', label: '搜索', Icon: Search },
  { to: '/toplist', label: '排行', Icon: BarChart3 },
  { to: '/my', label: '我的', Icon: Heart },
  { to: '/settings', label: '设置', Icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden flex items-center justify-around h-14 bg-neutral-950 border-t border-neutral-800 shrink-0">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] transition-colors ${
              isActive ? 'text-pink-500' : 'text-neutral-500'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}