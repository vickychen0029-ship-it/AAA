import { getApiBaseUrl } from './api.js'

function buildGetUrl(url, payload) {
  const query = new URLSearchParams()
  query.set('question', String(payload?.question || ''))
  query.set('cards', JSON.stringify(Array.isArray(payload?.cards) ? payload.cards : []))
  return `${url}?${query.toString()}`
}

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
  const failures = []
  for (const url of candidates) {
    if (!url || tried.includes(url)) continue
    tried.push(url)
    const attempts = [
      { method: 'POST', url, body: JSON.stringify(payload) },
      { method: 'GET', url: buildGetUrl(url, payload), body: undefined },
    ]
    for (const attempt of attempts) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 25000)
      try {
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers,
          body: attempt.body,
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
        if (response.ok && !data) return { provider: 'local', overall: '', cards: [] }

        if (response.status === 401) {
          try {
            localStorage.removeItem('smweb_access_token')
          } catch {
            // ignore storage failures
          }
          throw new Error('登录已失效，请重新登录后再试')
        }

        const detail =
          data?.detail ||
          data?.error?.message ||
          data?.raw ||
          `HTTP ${response.status}`
        const normalized = `(${attempt.method}) ${attempt.url} -> HTTP ${response.status}: ${String(detail)}`
        failures.push(normalized)

        if ([404, 405, 422].includes(response.status)) {
          continue
        }
        throw new Error(normalized)
      } catch (err) {
        const msg = String(err?.message || err || '')
        if (/abort|timeout|超时/i.test(msg)) {
          throw new Error('请求超时，请稍后重试')
        }
        failures.push(`(${attempt.method}) ${attempt.url} -> ${msg || 'request failed'}`)
      } finally {
        clearTimeout(timer)
      }
    }
  }

  const detail = failures[failures.length - 1]
  if (detail) {
    throw new Error(`深度解析服务暂不可用：${detail}`)
  }
  throw new Error('深度解析服务暂不可用，请稍后重试')
}
