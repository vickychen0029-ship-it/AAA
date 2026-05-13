import { findSolarTermJD } from './solarTerms.js'
import { sexagenaryToStemBranch } from '../utils/sexagenary.js'

/**
 * Calculate the year pillar (年柱) for a given JD.
 * Year pillar uses the LiChun (立春, solar longitude 315°) boundary.
 * Birth before LiChun belongs to the previous year.
 *
 * @param {number} jd - Julian Day
 * @returns {{ stem: string, branch: string, stemIndex: number, branchIndex: number }}
 */
export function yearPillar(jd) {
  // Approximate year from JD
  const approxYear = 2000 + Math.round((jd - 2451545.0) / 365.25)

  // Check LiChun for approximate year and the one after/before
  let astroYear = approxYear
  for (const y of [approxYear - 1, approxYear, approxYear + 1]) {
    const liChunJD = findSolarTermJD(y, 315)
    if (jd >= liChunJD) {
      astroYear = y
    }
  }

  // Year 1984 = 甲子 (sexagenary index 0)
  // Formula: (year - 4) % 60 gives sexagenary index
  const sexagenaryIndex = ((astroYear - 4) % 60 + 60) % 60

  return {
    ...sexagenaryToStemBranch(sexagenaryIndex),
    sexagenaryIndex,
    year: astroYear,
  }
}
