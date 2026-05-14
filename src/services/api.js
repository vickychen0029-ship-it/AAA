const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/_/backend')
).replace(/\/+$/, '')
const TOKEN_KEY = 'smweb_access_token'

function extractErrorMessage(data, status) {
  if (!data) return `请求失败：${status}`
  if (typeof data === 'string') return data
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) return data.error.message
  if (Array.isArray(data?.error?.details) && data.error.details.length > 0) {
    const first = data.error.details[0]
    if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg
  }
  return `请求失败：${status}`
}

async function parseResponse(response) {
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!response.ok) {
        throw new Error(text.trim() || `请求失败：${response.status}`)
      }
      throw new Error('服务返回了非 JSON 响应')
    }
  }
  if (!response.ok) {
    if (response.status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch {
        // ignore storage failure
      }
      throw new Error('登录已失效，请重新登录后再试')
    }
    throw new Error(extractErrorMessage(data, response.status))
  }
  return data
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  return parseResponse(response)
}

export function getApiBaseUrl() {
  return API_BASE
}
