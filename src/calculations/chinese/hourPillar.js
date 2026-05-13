import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../utils/sexagenary.js'

/**
 * Two-hour periods (时辰) in traditional Chinese timekeeping.
 * Each spans 2 hours. 子 hour bridges midnight (23:00-00:59).
 */
const SHI_CHEN = [
  { start: 23, end: 0.9999, branch: 0, name: '子时' },  // 23:00-00:59
  { start: 1,  end: 2.9999, branch: 1, name: '丑时' },  // 01:00-02:59
  { start: 3,  end: 4.9999, branch: 2, name: '寅时' },  // 03:00-04:59
  { start: 5,  end: 6.9999, branch: 3, name: '卯时' },  // 05:00-06:59
  { start: 7,  end: 8.9999, branch: 4, name: '辰时' },  // 07:00-08:59
  { start: 9,  end: 10.9999, branch: 5, name: '巳时' }, // 09:00-10:59
  { start: 11, end: 12.9999, branch: 6, name: '午时' }, // 11:00-12:59
  { start: 13, end: 14.9999, branch: 7, name: '未时' }, // 13:00-14:59
  { start: 15, end: 16.9999, branch: 8, name: '申时' }, // 15:00-16:59
  { start: 17, end: 18.9999, branch: 9, name: '酉时' }, // 17:00-18:59
  { start: 19, end: 20.9999, branch: 10, name: '戌时' },// 19:00-20:59
  { start: 21, end: 22.9999, branch: 11, name: '亥时' },// 21:00-22:59
]

// Another entry for 子时 0:00-0:59
const SHI_CHEN_MIDNIGHT = { start: 0, end: 0.9999, branch: 0, name: '子时' }

/**
 * Calculate the hour pillar (時柱).
 *
 * The hour branch is determined by the 2-hour period (時辰).
 * The hour stem is derived from the day stem using "Five Rats Escape" (五鼠遁):
 *  甲/己 day → 甲子 start
 *  乙/庚 day → 丙子 start
 *  丙/辛 day → 戊子 start
 *  丁/壬 day → 庚子 start
 *  戊/癸 day → 壬子 start
 *
 * @param {number} dayStemIndex - day heavenly stem index (0=甲, ..., 9=癸)
 * @param {number} hour - birth hour (0-23)
 * @returns {{ stem: string, branch: string, stemIndex: number, branchIndex: number, name: string }}
 */
export function hourPillar(dayStemIndex, hour) {
  // Find the shi chen
  let sc = SHI_CHEN.find(s => hour >= s.start && hour <= s.end)
  if (!sc) sc = SHI_CHEN_MIDNIGHT

  // Five Rats Escape: determine 子 hour's stem
  const group = dayStemIndex % 5
  const ziStem = (group * 2) % 10

  const stemIndex = (ziStem + sc.branch) % 10

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[sc.branch],
    stemIndex,
    branchIndex: sc.branch,
    name: sc.name,
  }
}

export function getShiChen(hour) {
  const sc = SHI_CHEN.find(s => hour >= s.start && hour <= s.end)
  if (sc) return sc
  return SHI_CHEN_MIDNIGHT
}
