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
  themeId: string
  customAccent: string | null   // 自定义十六进制色，比如 '#ff0000'
  accentOverride: ExtractedColor | null
  setTheme: (id: string) => void
  setCustomTheme: (hex: string) => void
  setCoverColor: (color: ExtractedColor | null) => void
  initTheme: () => void
}

const KEY = 'sm_theme'
const CUSTOM_KEY = 'sm_theme_custom'

/** 从 hex 生成 hover 色（亮度降 10%） */
function darkerHex(hex: string): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 25)
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 25)
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 25)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function applyColor(accent: string, hover?: string, rgb?: string) {
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-hover', hover ?? darkerHex(accent))
  if (rgb) {
    root.style.setProperty('--accent-rgb', rgb)
  } else {
    const r = parseInt(accent.slice(1, 3), 16)
    const g = parseInt(accent.slice(3, 5), 16)
    const b = parseInt(accent.slice(5, 7), 16)
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
  }
}

/** 校验是否是合法的 #RRGGBB */
export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeId: localStorage.getItem(KEY) ?? 'pink',
  customAccent: localStorage.getItem(CUSTOM_KEY),
  accentOverride: null,

  setTheme: (id) => {
    localStorage.setItem(KEY, id)
    set({ themeId: id, accentOverride: null })

    if (id === 'cover' || id === 'custom') return

    const theme = THEMES.find(t => t.id === id)
    if (!theme) return
    applyColor(theme.accent, theme.hover)
  },

  setCustomTheme: (hex) => {
    if (!isValidHex(hex)) return
    localStorage.setItem(KEY, 'custom')
    localStorage.setItem(CUSTOM_KEY, hex)
    set({ themeId: 'custom', customAccent: hex, accentOverride: null })
    applyColor(hex)
  },

  setCoverColor: (color) => {
    set({ accentOverride: color })
    if (get().themeId === 'cover' && color) {
      applyColor(color.accent, color.accentHover, color.accentRgb)
    }
  },

  initTheme: () => {
    const id = localStorage.getItem(KEY) ?? 'pink'
    set({ themeId: id })

    if (id === 'cover') return

    if (id === 'custom') {
      const hex = localStorage.getItem(CUSTOM_KEY) ?? '#ec4899'
      set({ customAccent: hex })
      applyColor(hex)
      return
    }

    const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
    applyColor(theme.accent, theme.hover)
  },
}))