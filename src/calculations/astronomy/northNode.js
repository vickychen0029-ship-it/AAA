import { normalizeDeg } from '../utils/angles.js'
import { julianCenturies } from '../utils/julianDay.js'

/**
 * Mean longitude of the Moon's ascending node (North Node / Rahu).
 * Meeus Ch.22.
 * Returns degrees.
 */
export function northNodeLongitude(jd) {
  const T = julianCenturies(jd)
  const Omega = 125.044555 - 1934.1361849 * T + 0.002076 * T * T
  return normalizeDeg(Omega)
}

/**
 * South Node (Ketu) is 180° opposite the North Node.
 */
export function southNodeLongitude(jd) {
  return normalizeDeg(northNodeLongitude(jd) + 180)
}
