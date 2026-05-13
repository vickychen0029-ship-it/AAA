import { gregorianToJD, julianDayNumber } from '../utils/julianDay.js'
import { sexagenaryToStemBranch } from '../utils/sexagenary.js'

/**
 * Calculate the day pillar (日柱).
 *
 * The 60-day cycle (干支纪日) has been continuous since ~722 BCE.
 * Reference: January 1, 1900 at 12:00 UT (JDN 2415021) = 甲戌 = index 10.
 *
 * Uses the LOCAL calendar date (year/month/day) at 12:00 UT to compute JDN.
 * This ensures the day pillar changes at local midnight, not UT midnight.
 *
 * @param {number} year - local Gregorian year
 * @param {number} month - local Gregorian month (1-12)
 * @param {number} day - local Gregorian day
 * @returns {{ stem: string, branch: string, stemIndex: number, branchIndex: number, sexagenaryIndex: number }}
 */
export function dayPillar(year, month, day) {
  // Use 12:00 UT on the local date so JDN always maps to the local calendar date
  const jdNoon = gregorianToJD(year, month, day, 12, 0)
  const jdn = julianDayNumber(jdNoon)

  // Reference: JDN 2415021 (Jan 1, 1900) = sexagenary index 10 (甲戌)
  const REFERENCE_JDN = 2415021
  const REFERENCE_INDEX = 10

  const diff = jdn - REFERENCE_JDN
  const sexagenaryIndex = ((diff % 60) + REFERENCE_INDEX + 60) % 60

  return {
    ...sexagenaryToStemBranch(sexagenaryIndex),
    sexagenaryIndex,
  }
}
