import { yearPillar } from './yearPillar.js'
import { monthPillar } from './monthPillar.js'
import { dayPillar } from './dayPillar.js'
import { hourPillar } from './hourPillar.js'
import { getStemElement } from '../utils/sexagenary.js'
import { resolveBirthLocation } from '../utils/location.js'
import { birthTimeToJulianDay } from '../utils/timezone.js'

/**
 * Calculate the full Ba Zi (八字) chart from birth data.
 *
 * @param {object} profile - profile data
 * @param {string} profile.birthDate - YYYY-MM-DD
 * @param {string} profile.birthHour - hour 0-23 (local time)
 * @param {string} profile.birthMinute - minute 0-59
 * @param {string} profile.dstMode - 'auto' | 'manual'
 * @param {boolean} profile.isDST - manual daylight saving flag
 * @returns {{ year, month, day, hour, dayMaster, pillars }}
 */
export function calculateBazi(profile) {
  const [y, m, d] = profile.birthDate.split('-').map(Number)
  const localHour = parseInt(profile.birthHour)
  const min = parseInt(profile.birthMinute) || 0

  const location = resolveBirthLocation(profile, y, m, d, localHour, min)
  const { jd } = birthTimeToJulianDay(profile, location, y, m, d, localHour, min)

  const year = yearPillar(jd)
  const month = monthPillar(year.stemIndex, jd)
  const day = dayPillar(y, m, d)
  // Hour pillar uses LOCAL time (时辰 is based on local solar time)
  const hour = hourPillar(day.stemIndex, localHour)

  const dayElement = getStemElement(day.stemIndex)

  return {
    year,
    month,
    day,
    hour,
    dayMaster: {
      stem: day.stem,
      element: dayElement,
    },
    pillars: [
      { label: '年柱', value: year.stem + year.branch },
      { label: '月柱', value: month.stem + month.branch },
      { label: '日柱', value: day.stem + day.branch },
      { label: '时柱', value: hour.stem + hour.branch },
    ],
  }
}
