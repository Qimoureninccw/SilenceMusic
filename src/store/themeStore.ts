// src/store/themeStore.ts
import { create } from 'zustand'

export interface ThemeColor {
  id: string
  name: string
  accent: string      // 主色
  hover: string       // hover 色（深一点）
}

export const THEMES: ThemeColor[] = [
  { id: 'pink',   name: '粉红',  accent: '#ec4899', hover: '#db2777' },
  { id: 'purple', name: '紫罗兰', accent: '#8b5cf6', hover: '#7c3aed' },
  { id: 'blue',   name: '天空蓝', accent: '#3b82f6', hover: '#2563eb' },
  { id: 'cyan',   name: '青碧',  accent: '#06b6d4', hover: '#0891b2' },
  { id: 'green',  name: '翠绿',  accent: '#10b981', hover: '#059669' },
  { id: 'amber',  name: '琥珀',  accent: '#f59e0b', hover: '#d97706' },
  { id: 'red',    name: '珊瑚红', accent: '#ef4444', hover: '#dc2626' },
  { id: 'rose',   name: '玫红',  accent: '#f43f5e', hover: '#e11d48' },
]

interface ThemeState {
  themeId: string
  setTheme: (id: string) => void
  initTheme: () => void
}

const KEY = 'sm_theme'

function applyTheme(theme: ThemeColor) {
  const root = document.documentElement
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-hover', theme.hover)
  // 解析 hex 到 rgb，方便以后用 rgba()
  const r = parseInt(theme.accent.slice(1, 3), 16)
  const g = parseInt(theme.accent.slice(3, 5), 16)
  const b = parseInt(theme.accent.slice(5, 7), 16)
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: localStorage.getItem(KEY) ?? 'pink',

  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id)
    if (!theme) return
    applyTheme(theme)
    localStorage.setItem(KEY, id)
    set({ themeId: id })
  },

  initTheme: () => {
    const id = localStorage.getItem(KEY) ?? 'pink'
    const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
    applyTheme(theme)
    set({ themeId: theme.id })
  },
}))