// src/store/themeStore.ts
import { create } from 'zustand'
import { type ExtractedColor } from '../utils/colorExtract'

export interface ThemeColor {
  id: string
  name: string
  accent: string
  hover: string
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
  themeId: string                  // 预设 id 或 'cover'
  accentOverride: ExtractedColor | null   // 跟随封面时的动态色
  setTheme: (id: string) => void
  setCoverColor: (color: ExtractedColor | null) => void
  initTheme: () => void
}

const KEY = 'sm_theme'

function applyColor(accent: string, hover: string, rgb?: string) {
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-hover', hover)
  if (rgb) {
    root.style.setProperty('--accent-rgb', rgb)
  } else {
    const r = parseInt(accent.slice(1, 3), 16)
    const g = parseInt(accent.slice(3, 5), 16)
    const b = parseInt(accent.slice(5, 7), 16)
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeId: localStorage.getItem(KEY) ?? 'pink',
  accentOverride: null,

  setTheme: (id) => {
    localStorage.setItem(KEY, id)
    set({ themeId: id, accentOverride: null })

    if (id === 'cover') return   // 跟随封面：不主动应用，等 setCoverColor 来设

    const theme = THEMES.find(t => t.id === id)
    if (!theme) return
    applyColor(theme.accent, theme.hover)
  },

  setCoverColor: (color) => {
    set({ accentOverride: color })
    // 只有当前主题是"跟随封面"时才真正应用
    if (get().themeId === 'cover' && color) {
      applyColor(color.accent, color.accentHover, color.accentRgb)
    }
  },

  initTheme: () => {
    const id = localStorage.getItem(KEY) ?? 'pink'
    set({ themeId: id })
    if (id === 'cover') return
    const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
    applyColor(theme.accent, theme.hover)
  },
}))
