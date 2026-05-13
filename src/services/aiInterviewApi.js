import { apiRequest, getApiBaseUrl } from './api.js'

const LEGACY_SYSTEM = 'bazi'

function shouldFallbackLegacy(systemType, err) {
  if (systemType === LEGACY_SYSTEM) return false
  const message = err instanceof Error ? err.message : String(err || '')
  return /404|not found|unsupported system_type/i.test(message)
}

export async function startSystemInterview(systemType, payload) {
  try {
    return await apiRequest(`/ai-interview/${encodeURIComponent(systemType)}/start`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    if (!shouldFallbackLegacy(systemType, err)) throw err
    const legacyPayload = {
      profile_id: payload?.profile_id,
      bazi_payload: payload?.system_payload || payload?.bazi_payload || {},
      target_section: payload?.target_section || null,
    }
    return apiRequest('/ai-interview/bazi/start', {
      method: 'POST',
      body: JSON.stringify(legacyPayload),
    })
  }
}

export async function getLatestSystemInterview(systemType, profileId, targetSection) {
  const sectionQuery = targetSection ? `?target_section=${encodeURIComponent(targetSection)}` : ''
  try {
    return await apiRequest(`/ai-interview/${encodeURIComponent(systemType)}/latest/${profileId}${sectionQuery}`)
  } catch (err) {
    if (!shouldFallbackLegacy(systemType, err)) throw err
    return apiRequest(`/ai-interview/bazi/latest/${profileId}${sectionQuery}`)
  }
}

export async function submitSystemInterviewAnswer(systemType, sessionId, answer) {
  try {
    return await apiRequest(`/ai-interview/${encodeURIComponent(systemType)}/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(answer),
    })
  } catch (err) {
    if (!shouldFallbackLegacy(systemType, err)) throw err
    return apiRequest(`/ai-interview/bazi/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(answer),
    })
  }
}

export async function exportSystemInterview(systemType, sessionId) {
  try {
    return await apiRequest(`/ai-interview/${encodeURIComponent(systemType)}/${sessionId}/export`)
  } catch (err) {
    if (!shouldFallbackLegacy(systemType, err)) throw err
    return apiRequest(`/ai-interview/bazi/${sessionId}/export`)
  }
}

export async function deleteSystemInterview(systemType, sessionId) {
  const token = localStorage.getItem('smweb_access_token') || ''
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
  const target = `${getApiBaseUrl()}/ai-interview/${encodeURIComponent(systemType)}/${sessionId}`
  let response = await fetch(target, { method: 'DELETE', headers: authHeaders })
  if (!response.ok && shouldFallbackLegacy(systemType, new Error(`请求失败：${response.status}`))) {
    response = await fetch(`${getApiBaseUrl()}/ai-interview/bazi/${sessionId}`, { method: 'DELETE', headers: authHeaders })
  }
  if (!response.ok) {
    throw new Error(`删除会话失败：${response.status}`)
  }
}

export async function startBaziInterview(payload) {
  return startSystemInterview('bazi', payload)
}

export async function getLatestBaziInterview(profileId, targetSection) {
  return getLatestSystemInterview('bazi', profileId, targetSection)
}

export async function submitBaziInterviewAnswer(sessionId, answer) {
  return submitSystemInterviewAnswer('bazi', sessionId, answer)
}

export async function exportBaziInterview(sessionId) {
  return exportSystemInterview('bazi', sessionId)
}

export async function deleteBaziInterview(sessionId) {
  return deleteSystemInterview('bazi', sessionId)
}
