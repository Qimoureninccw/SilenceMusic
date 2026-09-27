// src/utils/share.ts

/** 复制文本到剪贴板 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 生成当前站点的完整 URL */
export function siteUrl(path: string): string {
  return `${window.location.origin}${path}`
}

/** 显示一个短提示（原地弹，1.5 秒后消失） */
export function showToast(msg: string) {
  const tip = document.createElement('div')
  tip.textContent = msg
  tip.className =
    'fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-black/80 text-white text-sm rounded-lg pointer-events-none shadow-lg'
  document.body.appendChild(tip)
  setTimeout(() => tip.remove(), 1500)
}

/** 快捷分享：复制链接 + toast */
export async function shareLink(path: string, label = '链接') {
  const url = siteUrl(path)
  const ok = await copyToClipboard(url)
  showToast(ok ? `${label}已复制` : '复制失败')
}