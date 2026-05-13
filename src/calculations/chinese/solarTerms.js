import { sunLongitude } from '../astronomy/sun.js'
import { gregorianToJD } from '../utils/julianDay.js'

/**
 * 24 Solar Terms (节气) - sun ecliptic longitudes in degrees.
 * Starting from 立春 (index 0) at 315°.
 *
 * The "major" terms (节) used as month boundaries in Ba Zi are at indices:
 * 0(立春), 2(惊蛰), 4(清明), 6(立夏), 8(芒种), 10(小暑),
 * 12(立秋), 14(白露), 16(寒露), 18(立冬), 20(大雪), 22(小寒)
 *
 * Indices are 0-based: 立春=0, 雨水=1, ..., 大寒=23.
 */
const SOLAR_TERM_LONGITUDES = [
  315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 105, 120,
  135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300,
]

const SOLAR_TERM_NAMES = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
]

// Month branches corresponding to each Jie (节): indices 0,2,4,6,...
// 寅卯辰巳午未申酉戌亥子丑
const ZHENG_MONTH_JIE_INDEX = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

/**
 * Find the Julian Day when sun reaches a specific longitude.
 * Uses Newton's method. Converges in ~5 iterations.
 *
 * @param {number} year - Gregorian year
 * @param {number} targetLon - target ecliptic longitude in degrees
 * @returns {number} JD of the solar term
 */
export function findSolarTermJD(year, targetLon) {
  // Initial guess: each solar term is roughly 15.2 days apart
  // First 立春 is around Feb 4 each year
  const guessJD = gregorianToJD(year, 2, 4) + (targetLon - 315) / 360 * 365.25

  let jd = guessJD
  for (let i = 0; i < 10; i++) {
    const lon = sunLongitude(jd)
    let diff = lon - targetLon
    // Handle 360° wrap
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    if (Math.abs(diff) < 0.0001) break
    // Sun moves ~0.9856 degrees per day
    jd -= diff / 0.9856
  }

  return jd
}

/**
 * Get the solar term index (0-23) for a given JD.
 * Returns the index of the most recent Jie (节, major term).
 */
export function getCurrentJieIndex(jd) {
  // Determine the year of the JD
  const jd0 = jd - gregorianToJD(2000, 1, 1)
  const approxYear = 2000 + jd0 / 365.25

  // Find all 24 solar terms for this approximate year
  const year = Math.round(approxYear)

  // Check the 12 Jie (节) for this year
  let currentJie = -1
  let currentJieJD = -Infinity

  for (let m = 0; m < 12; m++) {
    const termIndex = ZHENG_MONTH_JIE_INDEX[m]
    const targetLon = SOLAR_TERM_LONGITUDES[termIndex]

    // Try the current year and next year
    for (const y of [year - 1, year, year + 1]) {
      const jieJD = findSolarTermJD(y, targetLon)
      if (jieJD <= jd && jieJD > currentJieJD) {
        currentJieJD = jieJD
        currentJie = m
      }
    }
  }

  return currentJie
}

export { SOLAR_TERM_LONGITUDES, SOLAR_TERM_NAMES, ZHENG_MONTH_JIE_INDEX }
