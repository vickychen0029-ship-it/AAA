import { normalizeDeg } from '../utils/angles.js'
import { julianCenturies } from '../utils/julianDay.js'

/**
 * Greenwich Mean Sidereal Time (GMST) in degrees.
 * Meeus Ch.12.
 */
export function greenwichSiderealTime(jd) {
  const T = julianCenturies(jd)

  // GMST at 0h UT (seconds of time)
  let gmst0 = 24110.54841
    + 8640184.812866 * T
    + 0.093104 * T * T
    - 6.2e-6 * T * T * T

  // Convert to degrees (86400 seconds = 360 degrees → 1 second = 1/240 degree)
  gmst0 = gmst0 / 240

  // Add fractional UT day, converted to sidereal time
  const dayFrac = (jd + 0.5) - Math.floor(jd + 0.5) // fractional day from 0h UT
  const gmst = gmst0 + dayFrac * 360.985647366

  return normalizeDeg(gmst)
}

/**
 * Local Sidereal Time (LST) in degrees.
 * @param {number} jd - Julian Day
 * @param {number} longitude - observer longitude in degrees (east positive)
 */
export function localSiderealTime(jd, longitude) {
  return normalizeDeg(greenwichSiderealTime(jd) + longitude)
}
