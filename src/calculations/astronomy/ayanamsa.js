import { julianCenturies } from '../utils/julianDay.js'

/**
 * Lahiri Ayanamsa (Indian Astronomical Ephemeris polynomial).
 * Returns the offset in degrees to subtract from tropical longitude to get
 * sidereal (Vedic) longitude.
 */
export function lahiriAyanamsa(jd) {
  const T = julianCenturies(jd)
  // IAE formula
  const aya = 23.8570922 + (5029.0966 / 3600) * T + (1.11161 / 3600) * T * T
  return aya
}

/**
 * Convert tropical ecliptic longitude to sidereal (Vedic) longitude.
 */
export function toSidereal(tropicalLongitude, jd) {
  const aya = lahiriAyanamsa(jd)
  let sidereal = tropicalLongitude - aya
  if (sidereal < 0) sidereal += 360
  return sidereal % 360
}
