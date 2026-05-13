import { getNayinElement, stemBranchToSexagenary } from '../utils/sexagenary.js'

/**
 * Five Elements Bureau numbers (五行局):
 *   水二局 = 2, 木三局 = 3, 金四局 = 4, 土五局 = 5, 火六局 = 6
 */
const BUREAU_NUMBERS = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 }

/**
 * Palace names in traditional Zi Wei order (starting from 寅).
 */
export const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '交友', '官禄', '田宅', '福德', '父母',
]

/**
 * Get the Five Elements Bureau number from Ming Gong's stem-branch.
 * Uses the Nayin (纳音) five-element of the stem-branch pair.
 *
 * @param {number} stemIndex - heavenly stem index of 命宫 (0=甲, ..., 9=癸)
 * @param {number} branchIndex - earthly branch index of 命宫 (0=子, ..., 11=亥)
 * @returns {{ element: string, number: number }}
 */
export function getBureau(stemIndex, branchIndex) {
  const sexagenaryIndex = stemBranchToSexagenary(stemIndex, branchIndex)
  const element = getNayinElement(sexagenaryIndex)
  return {
    element,
    number: BUREAU_NUMBERS[element] || 2,
  }
}
