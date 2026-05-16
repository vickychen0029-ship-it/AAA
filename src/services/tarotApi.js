import { apiRequest } from './api.js'

export async function interpretTarot(payload) {
  return apiRequest('/tarot/interpret', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
