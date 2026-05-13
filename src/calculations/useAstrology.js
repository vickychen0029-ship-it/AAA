import { useMemo } from 'react'
import { sunLongitude } from './astronomy/sun.js'
import { moonLongitude } from './astronomy/moon.js'
import { planetLongitude } from './astronomy/planets.js'
import { northNodeLongitude } from './astronomy/northNode.js'
import { ascendant } from './western/ascendant.js'
import { getSign } from './western/signs.js'
import { calculateBazi } from './chinese/bazi.js'
import { calculateZiweiChart } from './ziwei/ziweiChart.js'
import { calculateVedicChart } from './vedic/vedicChart.js'
import { resolveBirthLocation } from './utils/location.js'
import { birthTimeToJulianDay } from './utils/timezone.js'

/**
 * Unified astrology hook.
 * Given a user profile, returns all computed data for 星座/八字/紫薇/印占.
 * Results are memoized and only recompute when profile changes.
 */
export function useAstrology(profile) {
  return useMemo(() => {
    if (!profile || !profile.birthDate) return null

    // Parse profile
    const [y, m, d] = profile.birthDate.split('-').map(Number)
    const localHour = parseInt(profile.birthHour)
    const min = parseInt(profile.birthMinute) || 0

    const location = resolveBirthLocation(profile, y, m, d, localHour, min)
    const { lat, lng } = location
    const { jd } = birthTimeToJulianDay(profile, location, y, m, d, localHour, min)

    // ---- 星座 (Western/Tropical) ----
    const ascLon = ascendant(jd, lat, lng)
    const tropical = {
      asc: getSign(ascLon),
      sun: getSign(sunLongitude(jd)),
      moon: getSign(moonLongitude(jd)),
      mercury: getSign(planetLongitude('mercury', jd)),
      venus: getSign(planetLongitude('venus', jd)),
      mars: getSign(planetLongitude('mars', jd)),
      northNode: getSign(northNodeLongitude(jd)),
    }

    // ---- 印占 (Vedic/Sidereal) ----
    const vedic = calculateVedicChart(profile)

    // ---- 八字 ----
    const bazi = calculateBazi(profile)

    // ---- 紫薇 ----
    const ziwei = calculateZiweiChart(profile, bazi)

    return {
      tropical,
      vedic,
      bazi,
      ziwei,
      jd,
      city: { lat, lng },
    }
  }, [profile])
}
