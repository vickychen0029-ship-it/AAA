/**
 * 27 Nakshatras (lunar mansions), each spanning 13°20' (360/27 = 13.3333°).
 * Each nakshatra is divided into 4 padas (quarters) of 3°20'.
 */
const NAKSHATRAS = [
  { name: 'Ashwini', chinese: '阿什维尼', ruler: 'Ketu', deity: 'Ashwini Kumaras', desc: '敏捷果断，具有治愈与开创的能量。行动迅速，富有冒险精神。' },
  { name: 'Bharani', chinese: '巴拉尼', ruler: 'Venus', deity: 'Yama', desc: '承载与转化之力，富有韧性和创造力。深谙生命无常，懂得珍惜。' },
  { name: 'Krittika', chinese: '克里提卡', ruler: 'Sun', deity: 'Agni', desc: '锐利如刀，具有批判精神和净化之力。追求真理，不畏艰难。' },
  { name: 'Rohini', chinese: '罗希尼', ruler: 'Moon', deity: 'Brahma', desc: '丰饶富足，充满魅力与艺术天赋。情感丰富，追求美好生活。' },
  { name: 'Mrigashira', chinese: '摩利伽师罗', ruler: 'Mars', deity: 'Soma', desc: '温柔好奇，善于探寻与追求未知。思维细腻，富有探索精神。' },
  { name: 'Ardra', chinese: '阿德拉', ruler: 'Rahu', deity: 'Rudra', desc: '激烈变革，具有强烈的求知与破坏旧制的力量。情绪强烈，追求深刻体验。' },
  { name: 'Punarvasu', chinese: '普那瓦苏', ruler: 'Jupiter', deity: 'Aditi', desc: '回归光明，具有重生与更新的能量。心地善良，富有同情心。' },
  { name: 'Pushya', chinese: '普什亚', ruler: 'Saturn', deity: 'Brihaspati', desc: '滋养培育，具有养护和教导的天赋。稳重踏实，值得信赖。' },
  { name: 'Ashlesha', chinese: '阿什勒沙', ruler: 'Mercury', deity: 'Nagas', desc: '深邃缠绕，具有深刻的洞察力和直觉。善于把握事物本质。' },
  { name: 'Magha', chinese: '摩伽', ruler: 'Ketu', deity: 'Pitris', desc: '庄严宏大，承袭祖先的力量与责任。具有领导才能和威严。' },
  { name: 'Purva Phalguni', chinese: '前颇勒具尼', ruler: 'Venus', deity: 'Bhaga', desc: '享受欢愉，追求快乐与美好的人际关系。富有创造力和感染力。' },
  { name: 'Uttara Phalguni', chinese: '后颇勒具尼', ruler: 'Sun', deity: 'Aryaman', desc: '稳固合作，注重承诺和伙伴关系。做事踏实，值得依靠。' },
  { name: 'Hasta', chinese: '赫斯塔', ruler: 'Moon', deity: 'Savitar', desc: '巧手匠心，具有手工技艺和创造能力。注重细节，精益求精。' },
  { name: 'Chitra', chinese: '奇特拉', ruler: 'Mars', deity: 'Tvashtar', desc: '璀璨夺目，追求美和独特的设计。具有艺术天份和独特品味。' },
  { name: 'Swati', chinese: '斯瓦提', ruler: 'Rahu', deity: 'Vayu', desc: '独立自由，如风中柳絮般灵活多变。善于适应，追求自由。' },
  { name: 'Vishakha', chinese: '毗沙迦', ruler: 'Jupiter', deity: 'Indra-Agni', desc: '目标坚定，具有达成目标的决心和毅力。双重力量驱动，势不可挡。' },
  { name: 'Anuradha', chinese: '阿努罗陀', ruler: 'Saturn', deity: 'Mitra', desc: '忠诚友谊，注重人际关系中的忠诚与合作。善于建立深厚连接。' },
  { name: 'Jyeshtha', chinese: '吉耶什塔', ruler: 'Mercury', deity: 'Indra', desc: '长尊权威，具有领袖气质和掌控力。富有智慧和丰富的经验。' },
  { name: 'Mula', chinese: '穆罗', ruler: 'Ketu', deity: 'Nirriti', desc: '连根拔起，深度探索事物的根源。不满足于表象，追求本质真相。' },
  { name: 'Purva Ashadha', chinese: '前阿沙陀', ruler: 'Venus', deity: 'Apas', desc: '不可战胜，充满早期的胜利能量。乐观积极，勇往直前。' },
  { name: 'Uttara Ashadha', chinese: '后阿沙陀', ruler: 'Sun', deity: 'Vishvadevas', desc: '终极胜利，达到持久的成功。坚韧不拔，能够完成伟大的事业。' },
  { name: 'Shravana', chinese: '施罗波那', ruler: 'Moon', deity: 'Vishnu', desc: '善于倾听，具有学习和吸收知识的天赋。智慧广博，善于沟通。' },
  { name: 'Dhanishtha', chinese: '达尼什塔', ruler: 'Mars', deity: 'Vasus', desc: '丰盛富饶，充满节奏感和音乐天赋。富有协调能力，追求和谐生活。' },
  { name: 'Shatabhisha', chinese: '沙陀毗沙', ruler: 'Rahu', deity: 'Varuna', desc: '百医之宿，具有疗愈和隐藏的能力。善于独处，内心世界丰富。' },
  { name: 'Purva Bhadrapada', chinese: '前跋陀罗钵陀', ruler: 'Jupiter', deity: 'Ajaikapada', desc: '烈火洗礼，具有深刻的转化和蜕变能量。追求灵性成长。' },
  { name: 'Uttara Bhadrapada', chinese: '后跋陀罗钵陀', ruler: 'Saturn', deity: 'Ahirbudhnya', desc: '深海智慧，具有稳定深沉的智慧。能够承受压力，保持内心平静。' },
  { name: 'Revati', chinese: '雷婆蒂', ruler: 'Mercury', deity: 'Pushan', desc: '滋养守护，充满慈悲和关怀的能量。是旅程的终点也是新的起点。' },
]

const SPAN = 360 / 27 // 13.3333 degrees per nakshatra
const PADA_SPAN = SPAN / 4 // 3.3333 degrees per pada

/**
 * Get nakshatra from sidereal ecliptic longitude.
 * @param {number} siderealLongitude - sidereal ecliptic longitude in degrees (0-360)
 * @returns {{ index: number, name: string, chinese: string, ruler: string, pada: number, desc: string }}
 */
export function getNakshatra(siderealLongitude) {
  const lon = ((siderealLongitude % 360) + 360) % 360
  const index = Math.min(Math.floor(lon / SPAN), 26)
  const progress = lon - index * SPAN
  const pada = Math.min(Math.floor(progress / PADA_SPAN), 3) + 1

  return {
    index,
    pada,
    ...NAKSHATRAS[index],
  }
}

export { NAKSHATRAS, SPAN, PADA_SPAN }
