import { getApiBaseUrl } from './api.js'

export async function interpretTarot(payload) {
  const token = localStorage.getItem('smweb_access_token') || ''
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const base = getApiBaseUrl().replace(/\/+$/, '')
  const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : ''
  const candidates = [
    `${base}/tarot/interpret`,
    `${base}/ai-interview/tarot/interpret`,
    `${origin}/_/backend/tarot/interpret`,
    `${origin}/_/backend/ai-interview/tarot/interpret`,
  ]

  const tried = []
  for (const url of candidates) {
    if (!url || tried.includes(url)) continue
    tried.push(url)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const text = await response.text()
      let data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { raw: text }
        }
      }
      if (response.ok && data) return data
      const detail =
        data?.detail ||
        data?.error?.message ||
        data?.raw ||
        `HTTP ${response.status}`
      if (![404, 405, 422].includes(response.status)) {
        throw new Error(String(detail))
      }
    } catch (err) {
      const msg = String(err?.message || err || '')
      if (/abort|timeout|超时/i.test(msg)) {
        throw new Error('请求超时，请稍后重试')
      }
    } finally {
      clearTimeout(timer)
    }
  }

  throw new Error('深度解析服务暂不可用，请稍后重试')
}
