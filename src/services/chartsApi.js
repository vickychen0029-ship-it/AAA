import { apiRequest } from './api.js'

export async function createNatalChart(payload) {
  return apiRequest('/charts/natal', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
