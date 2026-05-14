import { getApiBaseUrl } from './api.js'

const TOKEN_KEY = 'smweb_access_token'

function parseMaybeJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractErrorMessage(data, text, status, fallback) {
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) return data.error.message
  if (Array.isArray(data?.error?.details) && data.error.details.length > 0) {
    const first = data.error.details[0]
    if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg
  }
  if (typeof text === 'string' && text.trim()) return text
  return `${fallback}：${status}`
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setStoredToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export async function loginWithPhone(phone, password) {
  const base = getApiBaseUrl()
  const body = new URLSearchParams()
  body.set('username', String(phone || '').trim())
  body.set('password', String(password || ''))

  const response = await fetch(`${base}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const text = await response.text()
  const data = parseMaybeJson(text)
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, text, response.status, '登录失败'))
  }

  if (!data?.access_token) {
    throw new Error('登录响应缺少 access_token')
  }

  setStoredToken(data.access_token)
  return data
}

export async function registerWithPhone(phone, password, username = null) {
  const base = getApiBaseUrl()
  const response = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: String(phone || '').trim(),
      username: username || null,
      password,
    }),
  })

  const text = await response.text()
  const data = parseMaybeJson(text)
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, text, response.status, '注册失败'))
  }

  return data
}

export async function fetchMe(token = getStoredToken()) {
  if (!token) throw new Error('未登录')
  const base = getApiBaseUrl()
  const response = await fetch(`${base}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const text = await response.text()
  const data = parseMaybeJson(text)
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, text, response.status, '获取用户信息失败'))
  }
  return data
}

export function logout() {
  setStoredToken('')
}
