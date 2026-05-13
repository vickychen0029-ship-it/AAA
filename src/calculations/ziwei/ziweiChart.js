import { astro } from 'iztro'

/**
 * Calculate full Zi Wei Dou Shu chart using the iztro library.
 *
 * @param {object} profile - { birthDate, birthHour, birthMinute, gender }
 * @returns {object} chart data
 */
export function calculateZiweiChart(profile) {
  const birthHour = parseInt(profile.birthHour)
  // Convert hour to 时辰 index (0=子, 1=丑, ..., 11=亥)
  const hourIndex = Math.floor(((birthHour + 1) % 24) / 2)

  const gender = profile.gender === 'male' ? '男' : '女'

  const a = astro.bySolar(profile.birthDate, hourIndex, gender, false, 'zh-CN')

  // Parse chineseDate string (e.g. "乙亥 丙戌 癸卯 庚申")
  const dateParts = (a.chineseDate || '').split(' ')

  // Parse bureau (e.g. "土五局")
  const bureauStr = a.fiveElementsClass || '水二局'

  // Map palaces
  const chart = a.palaces.map((p) => ({
    name: p.name,
    stem: p.heavenlyStem,
    branch: p.earthlyBranch,
    isBodyPalace: p.isBodyPalace,
    isOriginalPalace: p.isOriginalPalace,
    majorStars: p.majorStars.map((s) => ({
      name: s.name,
      mutagen: s.mutagen || '',
      brightness: s.brightness || '',
    })),
    minorStars: p.minorStars.map((s) => ({
      name: s.name,
      brightness: s.brightness || '',
    })),
    adjectiveStars: p.adjectiveStars?.map((s) => s.name) || [],
    changsheng: p.changsheng12 || '',
    decadal: p.decadal
      ? { stem: p.decadal.heavenlyStem, branch: p.decadal.earthlyBranch, start: p.decadal.range[0], end: p.decadal.range[1] }
      : null,
  }))

  return {
    chart,
    lunarDate: a.lunarDate,
    chineseDate: a.chineseDate,
    yearPillar: dateParts[0] || '',
    monthPillar: dateParts[1] || '',
    dayPillar: dateParts[2] || '',
    hourPillar: dateParts[3] || '',
    bureau: bureauStr,
    soulBranch: a.earthlyBranchOfSoulPalace,
    bodyBranch: a.earthlyBranchOfBodyPalace,
    zodiac: a.zodiac,
    sign: a.sign,
  }
}

// Re-export for backward compatibility
export { PALACE_NAMES } from './fiveBureau.js'
