export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

const FIVE_ELEMENTS = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']

/**
 * Return the stem and branch indices from a sexagenary cycle index (0-59).
 * Index 0 = 甲子.
 */
export function sexagenaryToStemBranch(index) {
  const si = ((index % 60) + 60) % 60
  return {
    stemIndex: si % 10,
    branchIndex: si % 12,
    stem: HEAVENLY_STEMS[si % 10],
    branch: EARTHLY_BRANCHES[si % 12],
  }
}

export function stemBranchToSexagenary(stemIndex, branchIndex) {
  // Solve idx such that idx%10 === stemIndex and idx%12 === branchIndex
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIndex && i % 12 === branchIndex) return i
  }
  return 0 // fallback for invalid stem/branch combinations
}

export function getZodiacAnimal(branchIndex) {
  return ZODIAC_ANIMALS[((branchIndex % 12) + 12) % 12]
}

export function getStemElement(stemIndex) {
  return FIVE_ELEMENTS[((stemIndex % 10) + 10) % 10]
}

/**
 * Nayin (纳音) five-element lookup table.
 * Maps sexagenary index (0-59) to one of: 金, 木, 水, 火, 土.
 */
export const NAYIN_TABLE = [
  '金', '金', '火', '火', '木', '木', '土', '土', '金', '金', // 甲子 ~ 癸酉
  '火', '火', '水', '水', '土', '土', '金', '金', '木', '木', // 甲戌 ~ 癸未
  '水', '水', '土', '土', '火', '火', '木', '木', '水', '水', // 甲申 ~ 癸巳
  '金', '金', '火', '火', '木', '木', '土', '土', '金', '金', // 甲午 ~ 癸卯
  '火', '火', '水', '水', '土', '土', '金', '金', '木', '木', // 甲辰 ~ 癸丑
  '水', '水', '土', '土', '火', '火', '木', '木', '水', '水', // 甲寅 ~ 癸亥
]

export function getNayinElement(sexagenaryIndex) {
  return NAYIN_TABLE[((sexagenaryIndex % 60) + 60) % 60]
}
