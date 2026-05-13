import { rad, normalizeDeg } from '../utils/angles.js'
import { julianCenturies } from '../utils/julianDay.js'

/**
 * Sun ecliptic longitude (geometric, referred to mean equinox of date).
 * Meeus Ch.25 - low precision formula, accuracy ~0.01° for 1950-2050.
 */
export function sunLongitude(jd) {
  const T = julianCenturies(jd)

  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T

  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(M))
    + (0.019993 - 0.000101 * T) * Math.sin(rad(2 * M))
    + 0.000289 * Math.sin(rad(3 * M))

  return normalizeDeg(L0 + C)
}

/**
 * Sun mean anomaly (degrees) - useful for other calculations.
 */
export function sunMeanAnomaly(jd) {
  const T = julianCenturies(jd)
  return normalizeDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
}
