const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

export function rad(deg) {
  return deg * DEG_TO_RAD
}

export function deg(rad) {
  return rad * RAD_TO_DEG
}

export function normalizeDeg(angle) {
  return ((angle % 360) + 360) % 360
}

export function normalizeRad(angle) {
  const twoPi = 2 * Math.PI
  return ((angle % twoPi) + twoPi) % twoPi
}
