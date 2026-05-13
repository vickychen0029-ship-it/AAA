import { rad, normalizeDeg } from '../utils/angles.js'
import { julianCenturies } from '../utils/julianDay.js'

/**
 * Moon ecliptic longitude (geometric, referred to mean equinox of date).
 * Simplified 5-term perturbation model.
 * Accuracy ~0.1° for 1900-2100, sufficient for sign determination.
 *
 * Based on the simplified lunar theory from Meeus Ch.47.
 */
export function moonLongitude(jd) {
  const T = julianCenturies(jd)

  // Mean orbital elements
  const Lp = 218.3165 + 481267.8813 * T          // Moon's mean longitude
  const D  = 297.8502 + 445267.1114 * T           // Mean elongation from Sun
  const M  = 357.5291 +  35999.0503 * T           // Sun's mean anomaly
  const Mp = 134.9634 + 477198.8676 * T           // Moon's mean anomaly

  // 5 largest perturbation terms
  const correction =
      6.2887 * Math.sin(rad(Mp))                  // Equation of center
    + 1.2740 * Math.sin(rad(2 * D - Mp))          // Evection
    + 0.6583 * Math.sin(rad(2 * D))               // Variation
    + 0.2136 * Math.sin(rad(2 * Mp))              // Smaller elliptic
    - 0.1856 * Math.sin(rad(M))                   // Annual equation

  return normalizeDeg(Lp + correction)
}
