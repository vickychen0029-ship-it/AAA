import { apiRequest } from './api.js'

export async function interpretTarot(payload) {
  try {
    return await apiRequest('/tarot/interpret', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err || '')
    if (!/404|not found/i.test(message)) throw err
    return apiRequest('/ai-interview/tarot/interpret', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}
