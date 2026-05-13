import { rad, deg, normalizeDeg } from '../utils/angles.js'
import { localSiderealTime } from '../astronomy/siderealTime.js'
import { meanObliquity } from '../astronomy/obliquity.js'

/**
 * Calculate the Ascendant (rising sign) ecliptic longitude.
 *
 * @param {number} jd - Julian Day
 * @param {number} latitude - observer latitude in degrees (north positive)
 * @param {number} longitude - observer longitude in degrees (east positive)
 * @returns {number} ASC ecliptic longitude in degrees (0-360)
 */
export function ascendant(jd, latitude, longitude) {
  const lst = rad(localSiderealTime(jd, longitude))
  const lat = rad(latitude)
  const eps = rad(meanObliquity(jd))

  // Meeus-based ASC form:
  // tan(lambda) = (-cos(theta)) / (sin(theta)*cos(eps) + tan(phi)*sin(eps))
  // The raw atan2 branch can land on DESC; rotate by 180° to get eastern horizon ASC.
  const x = Math.sin(lst) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)
  const y = -Math.cos(lst)
  const raw = normalizeDeg(deg(Math.atan2(y, x)))

  return raw < 180 ? raw + 180 : raw - 180
}

/**
 * Calculate the Midheaven (MC) ecliptic longitude.
 */
export function midheaven(jd, longitude) {
  const lst = rad(localSiderealTime(jd, longitude))
  const eps = rad(meanObliquity(jd))
  return normalizeDeg(deg(Math.atan2(Math.tan(lst), Math.cos(eps))))
}

/**
 * Whole Sign Houses: each house equals one 30° sign starting from the ASC sign.
 * Returns array of 12 house cusps (ecliptic longitude of each house start).
 */
export function wholeSignHouses(ascLongitude) {
  const ascSign = Math.floor(ascLongitude / 30)
  return Array.from({ length: 12 }, (_, i) => (ascSign + i) % 12)
}
