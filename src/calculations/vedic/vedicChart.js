import { sunLongitude } from '../astronomy/sun.js'
import { moonLongitude } from '../astronomy/moon.js'
import { planetLongitude } from '../astronomy/planets.js'
import { northNodeLongitude, southNodeLongitude } from '../astronomy/northNode.js'
import { ascendant } from '../western/ascendant.js'
import { getSign } from '../western/signs.js'
import { toSidereal } from '../astronomy/ayanamsa.js'
import { getNakshatra } from './nakshatra.js'
import { resolveBirthLocation } from '../utils/location.js'
import { birthTimeToJulianDay } from '../utils/timezone.js'

// ==================== Vimshottari Dasha ====================
// Order of mahadashas and their durations (years)
const DASHA_SEQUENCE = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 },
]

// Dasha lords for each nakshatra (index 0-26)
const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
]

// ==================== Planetary Dignities ====================
// Exaltation: [signIndex, degree]
const EXALTATION = {
  sun: [0, 10],       // Aries 10°
  moon: [1, 3],       // Taurus 3°
  mars: [9, 28],      // Capricorn 28°
  mercury: [5, 15],   // Virgo 15°
  jupiter: [3, 5],    // Cancer 5°
  venus: [11, 27],    // Pisces 27°
  saturn: [6, 20],    // Libra 20°
}

// Own signs (Swakshetra)
const OWN_SIGNS = {
  sun: [4],           // Leo
  moon: [3],          // Cancer
  mars: [0, 7],       // Aries, Scorpio
  mercury: [2, 5],    // Gemini, Virgo
  jupiter: [8, 11],   // Sagittarius, Pisces
  venus: [1, 6],      // Taurus, Libra
  saturn: [9, 10],    // Capricorn, Aquarius
}

// Moolatrikona: { signIndex: [minDegree, maxDegree] }
const MOOLATRIKONA = {
  sun: [4, 0, 20],       // Leo 0-20°
  moon: [1, 4, 27],      // Taurus 4-27°
  mars: [0, 0, 12],      // Aries 0-12°
  mercury: [5, 16, 20],  // Virgo 16-20°
  jupiter: [8, 0, 10],   // Sagittarius 0-10°
  venus: [6, 0, 15],     // Libra 0-15°
  saturn: [10, 0, 20],   // Aquarius 0-20°
}

const VEDIC_PLANETS = [
  { key: 'sun', chinese: '太阳', icon: '☀️' },
  { key: 'moon', chinese: '月亮', icon: '🌙' },
  { key: 'mars', chinese: '火星', icon: '🔥' },
  { key: 'mercury', chinese: '水星', icon: '💧' },
  { key: 'jupiter', chinese: '木星', icon: '🌳' },
  { key: 'venus', chinese: '金星', icon: '⭐' },
  { key: 'saturn', chinese: '土星', icon: '🪐' },
  { key: 'rahu', chinese: '罗睺', icon: '🐉' },
  { key: 'ketu', chinese: '计都', icon: '🐍' },
]

/**
 * Get Vedic planetary state (dignity).
 * Returns one of: 'exalted', 'moolatrikona', 'own', 'debilitated', 'neutral'
 */
function getPlanetaryState(key, signIndex, degreeInSign) {
  const exalt = EXALTATION[key]
  if (!exalt) return 'neutral'

  const deg = degreeInSign

  // Check exaltation
  if (exalt && signIndex === exalt[0]) {
    return 'exalted'
  }

  // Check debilitation (opposite sign)
  const debSign = (exalt[0] + 6) % 12
  if (signIndex === debSign) {
    return 'debilitated'
  }

  // Check own sign
  if (OWN_SIGNS[key]?.includes(signIndex)) {
    // Check Moolatrikona
    const mt = MOOLATRIKONA[key]
    if (mt && signIndex === mt[0] && deg >= mt[1] && deg <= mt[2]) {
      return 'moolatrikona'
    }
    return 'own'
  }

  // Check friendly/enemy relationships
  const friends = {
    sun: [3, 4, 8, 11],    // Moon, Leo, Jupiter, Pisces → friendly
    moon: [0, 1, 3, 8],    // Aries, Taurus, Cancer, Jupiter
    mars: [3, 4, 8, 11],   // Cancer, Leo, Jupiter, Pisces
    mercury: [1, 2, 5, 6], // Taurus, Gemini, Virgo, Libra
    jupiter: [0, 3, 4, 8], // Aries, Cancer, Leo, Sagittarius
    venus: [2, 5, 9, 10],  // Gemini, Virgo, Capricorn, Aquarius
    saturn: [1, 2, 6, 7],  // Taurus, Gemini, Libra, Scorpio
  }

  const enemies = {
    sun: [1, 2, 6, 7],     // Taurus, Gemini, Libra, Scorpio
    moon: [2, 5, 6, 9],    // Gemini, Virgo, Libra, Capricorn
    mars: [1, 2, 5, 6],    // Taurus, Gemini, Virgo, Libra
    mercury: [0, 7, 9, 10],// Aries, Scorpio, Capricorn, Aquarius
    jupiter: [1, 2, 5, 6], // Taurus, Gemini, Virgo, Libra
    venus: [0, 3, 4, 7],   // Aries, Cancer, Leo, Scorpio
    saturn: [0, 3, 4, 8],  // Aries, Cancer, Leo, Sagittarius
  }

  if (friends[key]?.includes(signIndex)) return 'friendly'
  if (enemies[key]?.includes(signIndex)) return 'enemy'
  return 'neutral'
}

const STATE_LABELS = {
  exalted: '庙旺(擢升)',
  moolatrikona: '本源',
  own: '入庙',
  friendly: '友好',
  neutral: '中性',
  enemy: '敌对',
  debilitated: '落陷',
}

/**
 * Calculate Vimshottari Dasha periods.
 * Returns the current and upcoming mahadasha periods from birth.
 */
function calculateDasha(moonNakshatra) {
  const { index, pada } = moonNakshatra
  const dashaLord = NAKSHATRA_LORDS[index]

  // Find starting position in dasha sequence
  const seqIndex = DASHA_SEQUENCE.findIndex(d => d.lord === dashaLord)

  // Balance of birth dasha: remaining portion of nakshatra
  // Each nakshatra is divided into 4 padas. So progress = (index_in_nakshatra + pada/4)
  // Actually the formula is: balance = (1 - (moon_position_in_nakshatra / 13.3333)) * total_years
  // Each pada is 3°20', so progress = (pada - 1 + quarter_progress) / 4
  // Simplified: progress = (pada - 1) / 4 (approximate)

  // More precise: the progress through the nakshatra determines remaining dasha
  // pada 1: 0/4 to 1/4 complete → balance = (1 - 0/4) * years to (1 - 1/4) * years
  // We'll use the midpoint of the pada
  const padaProgress = ((pada - 1) + 0.5) / 4
  const balanceYears = (1 - padaProgress) * DASHA_SEQUENCE[seqIndex].years

  // Build full dasha timeline
  const periods = []
  let cumulativeYears = 0
  for (let i = 0; i < 9; i++) {
    const dashaIdx = (seqIndex + i) % 9
    const { lord, years } = DASHA_SEQUENCE[dashaIdx]
    const startAge = cumulativeYears
    cumulativeYears += (i === 0 ? balanceYears : years)
    const endAge = cumulativeYears
    periods.push({
      lord,
      years: i === 0 ? parseFloat(balanceYears.toFixed(1)) : years,
      startAge: parseFloat(startAge.toFixed(1)),
      endAge: parseFloat(endAge.toFixed(1)),
    })
  }

  return {
    birthLord: dashaLord,
    balance: parseFloat(balanceYears.toFixed(1)),
    periods,
  }
}

/**
 * Calculate a full Vedic (sidereal) chart.
 */
export function calculateVedicChart(profile) {
  const [y, m, d] = profile.birthDate.split('-').map(Number)
  const localHour = parseInt(profile.birthHour)
  const min = parseInt(profile.birthMinute) || 0

  const location = resolveBirthLocation(profile, y, m, d, localHour, min)
  const { lat, lng } = location
  const { jd } = birthTimeToJulianDay(profile, location, y, m, d, localHour, min)

  // Compute tropical positions
  const ascLon = ascendant(jd, lat, lng)
  const sunLon = sunLongitude(jd)
  const moonLon = moonLongitude(jd)

  const tropicalPositions = {
    asc: ascLon,
    sun: sunLon,
    moon: moonLon,
    mars: planetLongitude('mars', jd),
    mercury: planetLongitude('mercury', jd),
    jupiter: planetLongitude('jupiter', jd),
    venus: planetLongitude('venus', jd),
    saturn: planetLongitude('saturn', jd),
    rahu: northNodeLongitude(jd),
    ketu: southNodeLongitude(jd),
  }

  // Convert to sidereal
  const sidereal = {}
  for (const [key, lon] of Object.entries(tropicalPositions)) {
    sidereal[key] = toSidereal(lon, jd)
  }

  const ascSign = getSign(sidereal.asc)
  const ascSignIndex = Math.floor(sidereal.asc / 30)

  // Calculate Moon nakshatra (for Dasha)
  const moonNakshatra = getNakshatra(sidereal.moon)
  const dasha = calculateDasha(moonNakshatra)

  // Build planet list with full data
  const planets = VEDIC_PLANETS.map((def) => {
    const lon = sidereal[def.key]
    const sign = getSign(lon)
    const signIndex = Math.floor(lon / 30)
    const degreeInSign = lon - signIndex * 30
    const house = ((signIndex - ascSignIndex + 12) % 12) + 1
    const nakshatra = getNakshatra(lon)
    const state = ['rahu', 'ketu'].includes(def.key) ? 'neutral' : getPlanetaryState(def.key, signIndex, degreeInSign)

    // Format degree string
    const fullDeg = Math.floor(degreeInSign)
    const arcMin = Math.floor((degreeInSign - fullDeg) * 60)
    const degreeStr = `${fullDeg}°${String(arcMin).padStart(2, '0')}'`

    return {
      ...def,
      sign,
      signIndex,
      degreeInSign: parseFloat(degreeInSign.toFixed(2)),
      degreeStr,
      house,
      nakshatra,
      state,
      stateLabel: STATE_LABELS[state] || '中性',
      longitude: lon,
    }
  })

  // Ascendant detail
  const ascDegreeInSign = sidereal.asc - ascSignIndex * 30
  const ascFullDeg = Math.floor(ascDegreeInSign)
  const ascArcMin = Math.floor((ascDegreeInSign - ascFullDeg) * 60)
  const ascDetail = {
    sign: ascSign,
    signIndex: ascSignIndex,
    degreeInSign: parseFloat(ascDegreeInSign.toFixed(2)),
    degreeStr: `${ascFullDeg}°${String(ascArcMin).padStart(2, '0')}'`,
    nakshatra: getNakshatra(sidereal.asc),
  }

  return {
    ascendant: ascDetail,
    moonSign: getSign(sidereal.moon),
    moonNakshatra,
    dasha,
    planets,
    sidereal,
  }
}
