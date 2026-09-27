// src/pages/Settings.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Trash2, HardDrive, Database, AlertTriangle,
  Check, Palette, Pipette,
} from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import type { Quality } from '../api/types'
import { clearAllCache } from '../utils/cache'
import type { PlayMode } from '../store/playerStore'
import { useThemeStore, THEMES, isValidHex } from '../store/themeStore'

const QUALITY_OPTIONS: { value: Quality; label: string; desc: string }[] = [
  { value: 'standard', label: '标准', desc: '128 kbps' },
  { value: 'higher', label: '较高', desc: '192 kbps' },
  { value: 'exhigh', label: '极高', desc: '320 kbps（推荐）' },
  { value: 'lossless', label: '无损', desc: 'FLAC 约 30MB' },
  { value: 'hires', label: 'Hi-Res', desc: '更高采样率' },
  { value: 'jymaster', label: '超清母带', desc: '最高音质' },
]

const MODE_OPTIONS: { value: PlayMode; label: string }[] = [
  { value: 'order', label: '顺序播放' },
  { value: 'repeat', label: '列表循环' },
  { value: 'repeatOne', label: '单曲循环' },
  { value: 'shuffle', label: '随机播放' },
]

export default function Settings() {
  const navigate = useNavigate()
  const quality = usePlayerStore(s => s.quality)
  const setQuality = usePlayerStore(s => s.setQuality)
  const mode = usePlayerStore(s => s.mode)
  const setMode = usePlayerStore(s => s.setMode)
  const clear = usePlayerStore(s => s.clear)

  const themeId = useThemeStore(s => s.themeId)
  const setTheme = useThemeStore(s => s.setTheme)
  const customAccent = useThemeStore(s => s.customAccent)
  const setCustomTheme = useThemeStore(s => s.setCustomTheme)

  const [hexInput, setHexInput] = useState(customAccent ?? '#ec4899')

  // 切换主题时同步输入框
  useEffect(() => {
    if (customAccent) setHexInput(customAccent)
  }, [customAccent])

  const normalizedHex = hexInput.startsWith('#') ? hexInput : '#' + hexInput
  const hexValid = isValidHex(normalizedHex)

  const handleHexChange = (value: string) => {
    setHexInput(value)
    const normalized = value.startsWith('#') ? value : '#' + value
    if (isValidHex(normalized)) setCustomTheme(normalized)
  }

  const apiBase = import.meta.env.VITE_API_BASE ?? 'https://silence-music-api.de5.net'

  const handleClearCache = () => {
    if (!confirm('清空所有接口缓存？（不影响喜欢、歌单、历史）')) return
    clearAllCache()
    alert('缓存已清空')
  }

  const handleClearQueue = () => {
    if (!confirm('清空当前播放列表？')) return
    clear()
  }

  const handleResetAll = () => {
    if (!confirm('⚠️ 这将删除：我喜欢的音乐、所有自建歌单、播放历史、播放列表。确定继续？')) return
    if (!confirm('再次确认：此操作不可恢复！')) return
    localStorage.removeItem('sm_liked')
    localStorage.removeItem('sm_playlists')
    localStorage.removeItem('sm_history')
    localStorage.removeItem('playerState')
    localStorage.removeItem('ncm_cookie')
    localStorage.removeItem('ncm_guest_cookie')
    localStorage.removeItem('sm_theme')
    localStorage.removeItem('sm_theme_custom')
    // 清缓存
    Object.keys(localStorage)
      .filter(k => k.startsWith('sm_cache:'))
      .forEach(k => localStorage.removeItem(k))
    location.reload()
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* 顶部返回 */}
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors mb-4"
        title="返回"
      >
        <ArrowLeft size={20} />
      </button>

      <h1 className="text-2xl font-bold mb-6">设置</h1>

      {/* 主题色 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
          <Palette size={14} />
          主题色
        </h2>
        <div className="bg-neutral-900 rounded-xl p-4">
          {/* 预设颜色 */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {THEMES.map(t => {
              const active = themeId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="flex flex-col items-center gap-2 group"
                  title={t.name}
                >
                  <div
                    className={`w-10 h-10 rounded-full transition-all ${
                      active ? 'scale-110 ring-2 ring-offset-2 ring-offset-neutral-900' : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: t.accent,
                      // @ts-ignore
                      '--tw-ring-color': t.accent,
                    } as any}
                  />
                  <span className={`text-xs ${active ? 'text-white' : 'text-neutral-500'}`}>
                    {t.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 自定义颜色 */}
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-end gap-3">
              {/* 取色器 */}
              <label
                className="relative w-10 h-10 rounded-full cursor-pointer shrink-0"
                style={{
                  backgroundColor: hexValid ? normalizedHex : '#ec4899',
                  boxShadow: themeId === 'custom' ? `0 0 0 2px #171717, 0 0 0 4px ${normalizedHex}` : 'none',
                }}
                title="点击选择颜色"
              >
                <input
                  type="color"
                  value={hexValid ? normalizedHex : '#ec4899'}
                  onChange={(e) => {
                    setHexInput(e.target.value)
                    setCustomTheme(e.target.value)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Pipette size={16} className="text-white/80 drop-shadow" />
                </div>
              </label>

              {/* 十六进制输入框 */}
              <div className="flex-1">
                <label className="text-xs text-neutral-500 block mb-1">自定义颜色</label>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#ec4899"
                  maxLength={7}
                  className={`w-full bg-neutral-800 rounded px-3 py-1.5 text-sm outline-none font-mono transition-colors ${
                    hexValid
                      ? 'focus:ring-1 focus:ring-pink-500'
                      : 'ring-1 ring-red-500/50'
                  }`}
                />
              </div>

              {/* 应用按钮 */}
              <button
                onClick={() => hexValid && setCustomTheme(normalizedHex)}
                disabled={!hexValid}
                className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-sm transition-colors"
              >
                应用
              </button>
            </div>
          </div>

          {/* 跟随封面 */}
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <button
              onClick={() => setTheme('cover')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                themeId === 'cover'
                  ? 'bg-neutral-800 ring-1 ring-pink-500'
                  : 'hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #3b82f6, #06b6d4, #10b981, #f59e0b, #ec4899)',
                  }}
                />
                <div className="text-left">
                  <div className="text-sm">跟随当前播放封面</div>
                  <div className="text-xs text-neutral-500">从歌曲封面提取主色</div>
                </div>
              </div>
              {themeId === 'cover' && <Check size={18} className="text-pink-500" />}
            </button>
          </div>
        </div>
      </section>

      {/* 音质 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 mb-3">播放音质</h2>
        <div className="bg-neutral-900 rounded-xl divide-y divide-neutral-800 overflow-hidden">
          {QUALITY_OPTIONS.map(opt => {
            const active = quality === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setQuality(opt.value)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 transition-colors text-left"
              >
                <div>
                  <div className="text-sm">{opt.label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{opt.desc}</div>
                </div>
                {active && <Check size={18} className="text-accent" />}
              </button>
            )
          })}
        </div>
        <div className="text-xs text-neutral-500 mt-2">
          提示：无损及以上音质需要 VIP 账号才能获取。若获取失败会自动回退。
        </div>
      </section>

      {/* 默认播放模式 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 mb-3">默认播放模式</h2>
        <div className="bg-neutral-900 rounded-xl divide-y divide-neutral-800 overflow-hidden">
          {MODE_OPTIONS.map(opt => {
            const active = mode === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 transition-colors text-left"
              >
                <div className="text-sm">{opt.label}</div>
                {active && <Check size={18} className="text-accent" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* 数据管理 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-400 mb-3">数据管理</h2>
        <div className="bg-neutral-900 rounded-xl divide-y divide-neutral-800 overflow-hidden">
          <button
            onClick={handleClearCache}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Database size={18} className="text-neutral-500" />
              <div>
                <div className="text-sm">清空接口缓存</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  清空搜索结果、歌单、歌词等临时缓存
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleClearQueue}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <HardDrive size={18} className="text-neutral-500" />
              <div>
                <div className="text-sm">清空播放列表</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  当前队列会被清空，不影响喜欢和歌单
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 危险操作 */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} />
          危险操作
        </h2>
        <div className="bg-neutral-900 rounded-xl overflow-hidden border border-red-900/30">
          <button
            onClick={handleResetAll}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-950/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-500" />
              <div>
                <div className="text-sm text-red-400">重置所有本地数据</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  删除喜欢、歌单、历史、播放列表，恢复出厂设置
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 关于 */}
      <section>
        <h2 className="text-sm font-medium text-neutral-400 mb-3">关于</h2>
        <div className="bg-neutral-900 rounded-xl px-4 py-3 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-500">应用名</span>
            <span>Silence Music</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">版本</span>
            <span>0.1.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">API 地址</span>
            <span className="text-xs text-neutral-400 truncate ml-4 max-w-[60%]">
              {apiBase}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}