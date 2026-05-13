/**
 * Place 紫微星 based on Five Elements Bureau number and lunar day.
 *
 * Formula from traditional Zi Wei Dou Shu:
 *   Divide lunar day by bureau number, get quotient and remainder.
 *   The position is determined by a parity rule.
 *
 * @param {number} bureauNum - bureau number (2=水, 3=木, 4=金, 5=土, 6=火)
 * @param {number} lunarDay - lunar day (1-30)
 * @returns {number} branch index (0=寅, ..., 11=丑) offset from 寅
 */
export function placeZiWei(bureauNum, lunarDay) {
  if (lunarDay <= 0) return 0

  // When day <= bureau number: 紫微 = bureauNum - lunarDay (0-based from 寅)
  if (lunarDay <= bureauNum) {
    return bureauNum - lunarDay
  }

  const quotient = Math.floor(lunarDay / bureauNum)
  const remainder = lunarDay % bureauNum

  if (remainder === 0) {
    // 整除: 紫微在商数宫 (1-based from 寅 → 0-based: quotient - 1)
    return ((quotient - 1) % 12 + 12) % 12
  }

  // 商奇则逆，商偶则顺 (1-based positions from 寅)
  let pos
  if (quotient % 2 === 1) {
    // Odd quotient: go backward from quotient by remainder
    pos = quotient - remainder
    while (pos <= 0) pos += 12
  } else {
    // Even quotient: go forward from quotient by remainder
    pos = quotient + remainder
    while (pos > 12) pos -= 12
  }
  // Convert to 0-based from 寅 and normalize
  return ((pos - 1) % 12 + 12) % 12
}

/**
 * Place all stars in the 12 palaces.
 * Returns an array of 12 palace objects.
 *
 * @param {number} ziWeiBranch - branch index (0=寅, ..., 11=丑) of 紫微星
 * @param {number} yearStemIndex - year heavenly stem (0=甲...9=癸)
 * @param {number} hourBranchIndex - birth hour branch (0=子...11=亥)
 * @param {number} lunarMonth - lunar month (1-12)
 * @param {number} lunarDay - lunar day (1-30)
 * @returns {Array<{ name: string, mainStars: string[], subStars: string[] }>}
 */
export function placeAllStars(ziWeiBranch, yearStemIndex, hourBranchIndex, lunarMonth, lunarDay) {
  // Initialize palaces (寅=0, 卯=1, ..., 丑=11)
  const palaces = Array.from({ length: 12 }, () => ({
    mainStars: [],
    subStars: [],
  }))

  // ---- 紫微星系 (Zi Wei star group) ----
  // 紫微 (0), 天机 (-1), (skip), 太阳 (-3), 武曲 (-4), 天同 (-5), (skip+2), 廉贞 (+2 from 紫微 or -7 from 天府)
  ziWeiGroup(palaces, ziWeiBranch)

  // ---- 天府星系 (Tian Fu star group) ----
  // 天府 is opposite 紫微: 天府 = 紫微 + 6 (寅-based)
  const tianFuBranch = (ziWeiBranch + 6) % 12
  tianFuGroup(palaces, tianFuBranch)

  // ---- 月系星 (Month-based stars) ----
  monthStars(palaces, lunarMonth)

  // ---- 时系星 (Hour-based stars) ----
  hourStars(palaces, hourBranchIndex)

  // ---- 年系星 (Year-stem-based stars) ----
  yearStemStars(palaces, yearStemIndex)

  // ---- 日系星 (Day-based stars) ----
  dayStars(palaces, lunarDay)

  return palaces
}

function ziWeiGroup(palaces, ziWeiPos) {
  // 紫微 at position
  palaces[ziWeiPos].mainStars.push('紫微')

  // 天机 = 紫微 - 1
  palaces[(ziWeiPos - 1 + 12) % 12].mainStars.push('天机')

  // Skip 1 position (empty)

  // 太阳 = 紫微 - 3
  palaces[(ziWeiPos - 3 + 12) % 12].mainStars.push('太阳')

  // 武曲 = 紫微 - 4
  palaces[(ziWeiPos - 4 + 12) % 12].mainStars.push('武曲')

  // 天同 = 紫微 - 5
  palaces[(ziWeiPos - 5 + 12) % 12].mainStars.push('天同')

  // Skip 2 positions (empty)

  // 廉贞 = 紫微 + 4
  palaces[(ziWeiPos + 4) % 12].mainStars.push('廉贞')
}

function tianFuGroup(palaces, tianFuPos) {
  palaces[tianFuPos].mainStars.push('天府')

  // 太阴 = 天府 + 1
  palaces[(tianFuPos + 1) % 12].mainStars.push('太阴')

  // 贪狼 = 天府 + 2
  palaces[(tianFuPos + 2) % 12].mainStars.push('贪狼')

  // 巨门 = 天府 + 3
  palaces[(tianFuPos + 3) % 12].mainStars.push('巨门')

  // 天相 = 天府 + 4
  palaces[(tianFuPos + 4) % 12].mainStars.push('天相')

  // 天梁 = 天府 + 5
  palaces[(tianFuPos + 5) % 12].mainStars.push('天梁')

  // 七杀 = 天府 + 6
  palaces[(tianFuPos + 6) % 12].mainStars.push('七杀')

  // Skip 3 positions

  // 破军 = 天府 + 10
  palaces[(tianFuPos + 10) % 12].mainStars.push('破军')
}

function monthStars(palaces, lunarMonth) {
  // 左辅 = month (from 辰=4)
  palaces[(lunarMonth + 3) % 12].subStars.push('左辅')
  // 右弼 = from 戌(10) counter-clockwise by (month - 1)
  palaces[(10 - (lunarMonth - 1) + 12) % 12].subStars.push('右弼')
}

function hourStars(palaces, hourBranch) {
  // 文昌 = from 戌(10) counter-clockwise by hour
  palaces[(10 - hourBranch + 12) % 12].subStars.push('文昌')
  // 文曲 = from 辰(4) clockwise by hour
  palaces[(4 + hourBranch) % 12].subStars.push('文曲')
  // 地劫 = from 亥(11) counter-clockwise by hour
  palaces[(11 - hourBranch + 12) % 12].subStars.push('地劫')
  // 地空 = from 亥(11) clockwise by hour
  palaces[(11 + hourBranch) % 12].subStars.push('地空')
}

function yearStemStars(palaces, yearStem) {
  // 禄存: 甲=寅, 乙=卯, 丙戊=巳, 丁己=午, 庚=申, 辛=酉, 壬=亥, 癸=子
  const luCunMap = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 }
  const luCunPos = luCunMap[yearStem]
  palaces[luCunPos].subStars.push('禄存')

  // 擎羊 = 禄存 + 1
  palaces[(luCunPos + 1) % 12].subStars.push('擎羊')
  // 陀罗 = 禄存 - 1
  palaces[(luCunPos - 1 + 12) % 12].subStars.push('陀罗')

  // 天魁/天钺 (based on year stem group)
  // 甲戊庚: 魁=丑, 钺=未
  // 乙己:   魁=子, 钺=申
  // 丙丁:   魁=亥, 钺=酉
  // 辛:     魁=午, 钺=寅
  // 壬癸:   魁=卯, 钺=巳
  const kuiYueMap = {
    0: [1, 7], 4: [1, 7], 6: [1, 7], // 甲戊庚
    1: [0, 8], 5: [0, 8],                // 乙己
    2: [11, 9], 3: [11, 9],              // 丙丁
    7: [6, 2],                             // 辛
    8: [3, 5], 9: [3, 5],                // 壬癸
  }
  const kuiYue = kuiYueMap[yearStem] || [1, 7]
  palaces[kuiYue[0]].subStars.push('天魁')
  palaces[kuiYue[1]].subStars.push('天钺')
}

function dayStars(palaces, lunarDay) {
  // 三台八座 (simplified)
  palaces[(lunarDay + 1) % 12].subStars.push('三台')
  palaces[(lunarDay + 5) % 12].subStars.push('八座')
  // 天喜 = from 酉(9) clockwise by day
  palaces[(9 + lunarDay) % 12].subStars.push('天喜')
}
