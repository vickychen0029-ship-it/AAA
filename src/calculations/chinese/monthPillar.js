import { getCurrentJieIndex } from './solarTerms.js'
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../utils/sexagenary.js'

/**
 * Calculate the month pillar (月柱).
 *
 * The month branch is determined by which solar term (节) range the birth falls in.
 * Month branches: 寅(立春), 卯(惊蛰), 辰(清明), 巳(立夏), 午(芒种), 未(小暑),
 *                 申(立秋), 酉(白露), 戌(寒露), 亥(立冬), 子(大雪), 丑(小寒)
 *
 * The month stem is derived from the year stem using the "Five Tigers Escape" (五虎遁):
 *  甲/己 year → 丙寅 start
 *  乙/庚 year → 戊寅 start
 *  丙/辛 year → 庚寅 start
 *  丁/壬 year → 壬寅 start
 *  戊/癸 year → 甲寅 start
 *
 * @param {number} yearStemIndex - year heavenly stem index (0=甲, ..., 9=癸)
 * @param {number} jd - Julian Day
 * @returns {{ stem: string, branch: string, stemIndex: number, branchIndex: number }}
 */
export function monthPillar(yearStemIndex, jd) {
  // jieIndex: 0=寅月(立春), 1=卯月(惊蛰), ..., 11=丑月(小寒)
  const jieIndex = getCurrentJieIndex(jd)

  // Convert to earthly branch index: 寅=2, 丑=1, etc.
  const earthlyBranchIndex = (jieIndex + 2) % 12

  // Five Tigers Escape (五虎遁): determine stem of 寅月 from year stem
  // 甲/己→丙寅, 乙/庚→戊寅, 丙/辛→庚寅, 丁/壬→壬寅, 戊/癸→甲寅
  const offset = ((yearStemIndex % 5 + 1) * 2) % 10

  // stemIndex increments by 1 for each month after 寅月
  const stemIndex = (offset + jieIndex) % 10

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[earthlyBranchIndex],
    stemIndex,
    branchIndex: earthlyBranchIndex,
  }
}
