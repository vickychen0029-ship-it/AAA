/**
 * Calculate 命宫 (Ming Gong / Life Palace) position.
 *
 * Rule:
 *   从寅宫(地支2)起正月，顺数至出生月（农历月）
 *   再从该位置起子时，逆数至出生时支
 *
 * @param {number} lunarMonth - lunar month (1-12)
 * @param {number} hourBranchIndex - birth hour earthly branch index (0=子, ..., 11=亥)
 * @returns {number} palace index (0=子, 1=丑, ..., 11=亥)
 */
export function calculateMingGong(lunarMonth, hourBranchIndex) {
  // Start at 寅 (branch index 2), count forward by month
  const monthPos = (2 + lunarMonth - 1) % 12

  // From that position, start 子 (index 0) and count backward by hour branch
  const mingGongIndex = (monthPos - hourBranchIndex + 12) % 12

  return mingGongIndex
}

/**
 * Calculate 身宫 (Shen Gong / Body Palace).
 *
 * Rule:
 *   从寅宫(地支2)起正月，顺数至出生月
 *   再从该位置起子时，顺数至出生时支
 *
 * @param {number} lunarMonth - lunar month (1-12)
 * @param {number} hourBranchIndex - birth hour earthly branch index
 * @returns {number} palace index (0=子, ..., 11=亥)
 */
export function calculateShenGong(lunarMonth, hourBranchIndex) {
  const monthPos = (2 + lunarMonth - 1) % 12
  const shenGongIndex = (monthPos + hourBranchIndex) % 12
  return shenGongIndex
}
