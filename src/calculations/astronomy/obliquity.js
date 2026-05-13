import { julianCenturies } from '../utils/julianDay.js'

/**
 * Mean obliquity of the ecliptic (IAU 2006 polynomial).
 * Returns degrees. Accuracy ~0.01 arcseconds for 1900-2100.
 */
export function meanObliquity(jd) {
  const T = julianCenturies(jd)
  const eps0 = 84381.406
    - 46.836769 * T
    - 0.0001831 * T * T
    + 0.00200340 * T * T * T
    - 0.000000576 * T * T * T * T
    - 0.0000000434 * T * T * T * T * T
  return eps0 / 3600 // arcseconds → degrees
}
