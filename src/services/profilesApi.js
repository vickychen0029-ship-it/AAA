import { apiRequest } from './api.js'

function normalizeGenderIn(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return ''
  if (text === 'male' || text === '男' || text === 'm') return 'male'
  if (text === 'female' || text === '女' || text === 'f') return 'female'
  return ''
}

function normalizeGenderOut(value) {
  const normalized = normalizeGenderIn(value)
  return normalized || null
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function toBirthLocalDateTime(profile) {
  if (!profile.birthDate) return null
  const hour = Number.parseInt(profile.birthHour ?? '12', 10)
  const minute = Number.parseInt(profile.birthMinute ?? '0', 10)
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 12
  const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0
  return `${profile.birthDate}T${pad2(safeHour)}:${pad2(safeMinute)}:00`
}

function fromBirthLocalDateTime(value) {
  if (!value) {
    return { birthDate: '', birthHour: '12', birthMinute: '0' }
  }
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) {
    return { birthDate: '', birthHour: '12', birthMinute: '0' }
  }

  return {
    birthDate: `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`,
    birthHour: String(dt.getHours()),
    birthMinute: String(dt.getMinutes()),
  }
}

export function mapBackendProfileToUi(item) {
  const local = fromBirthLocalDateTime(item.birth_local_dt)
  const isManual = item.dst_auto === false
  return {
    id: item.id,
    nickname: item.name || item.nickname || '',
    gender: normalizeGenderIn(item.gender),
    birthDate: local.birthDate,
    birthHour: local.birthHour,
    birthMinute: local.birthMinute,
    birthPlace: item.location_query || '',
    currentPlace: item.current_place || '',
    dstMode: isManual ? 'manual' : 'auto',
    isDST: Boolean(item.dst_applied),
    geo: {
      name: item.location_query || '',
      lat: item.lat,
      lng: item.lng,
      timezone: item.iana_tz || '',
      birthUtc: item.birth_utc_dt || null,
    },
  }
}

export function mapUiProfileToCreatePayload(profile) {
  const birthLocalDt = toBirthLocalDateTime(profile)
  if (!birthLocalDt) {
    throw new Error('请先填写出生日期和时间')
  }

  return {
    name: (profile.nickname || profile.name || '').trim(),
    gender: normalizeGenderOut(profile.gender),
    location_query: (profile.birthPlace || '').trim(),
    current_place: (profile.currentPlace || '').trim() || null,
    birth_local_dt: birthLocalDt,
    dst_auto: profile.dstMode !== 'manual',
    dst_applied: profile.dstMode === 'manual' ? Boolean(profile.isDST) : null,
    iana_tz: profile.geo?.timezone || null,
    lat: Number.isFinite(profile.geo?.lat) ? profile.geo.lat : null,
    lng: Number.isFinite(profile.geo?.lng) ? profile.geo.lng : null,
  }
}

export function mapUiProfileToUpdatePayload(profile) {
  return mapUiProfileToCreatePayload(profile)
}

export async function listProfiles(limit = 10) {
  return apiRequest(`/profiles?limit=${limit}`)
}

export async function createProfile(payload) {
  return apiRequest('/profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProfile(id, payload) {
  return apiRequest(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteProfile(id) {
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  const token = localStorage.getItem('smweb_access_token') || ''
  const response = await fetch(`${base}/profiles/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.ok) {
    let detail = `删除失败：${response.status}`
    try {
      const data = await response.json()
      detail = data?.detail || detail
    } catch {
      // ignore parse error
    }
    throw new Error(detail)
  }
}
