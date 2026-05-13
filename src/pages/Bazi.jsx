import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { calculateBazi } from '../calculations/chinese/bazi.js'
import {
  exportBaziInterview,
  getLatestBaziInterview,
  startBaziInterview,
  submitBaziInterviewAnswer,
} from '../services/aiInterviewApi.js'
import {
  HEAVENLY_STEMS,
  getNayinElement,
  getStemElement,
  stemBranchToSexagenary,
} from '../calculations/utils/sexagenary.js'
import {
  BAZI_SHENSHA_KB,
  BAZI_TERM_KB,
  READING_MODES,
  formatCardText,
} from '../knowledge/readingKnowledge.js'

const ELEMENT_COMMENTS = {
  '金': '金主义，其性刚，其情烈。你做事讲标准、重结果，面对问题倾向直接切割与快速判断。',
  '木': '木主仁，其性直，其情和。你在意成长与长期价值，愿意投入时间去搭建体系与关系。',
  '水': '水主智，其性聪，其情善。你擅长观察、学习与调整，能够在复杂局面中寻找更优解。',
  '火': '火主礼，其性急，其情恭。你表达力和感染力强，行动启动快，适合在变化中推进事情。',
  '土': '土主信，其性重，其情厚。你偏稳健务实，重承诺和落地，愿意为长期目标持续投入。',
}

const STEM_POLARITY = {
  甲: 'yang', 乙: 'yin', 丙: 'yang', 丁: 'yin', 戊: 'yang',
  己: 'yin', 庚: 'yang', 辛: 'yin', 壬: 'yang', 癸: 'yin',
}

const GENERATES = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const CONTROLS = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }

const BRANCH_HIDDEN_STEMS = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const CHANG_SHENG_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']
const CHANG_SHENG_START = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' }

const XUN_KONG = [
  ['戌', '亥'], // 甲子旬
  ['申', '酉'], // 甲戌旬
  ['午', '未'], // 甲申旬
  ['辰', '巳'], // 甲午旬
  ['寅', '卯'], // 甲辰旬
  ['子', '丑'], // 甲寅旬
]

const GROUP_BY_BRANCH = {
  子: '申子辰', 申: '申子辰', 辰: '申子辰',
  寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌',
  巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑',
  亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未',
}

const TAOHUA_BY_GROUP = { 申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子' }
const YIMA_BY_GROUP = { 申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳' }
const HUAGAI_BY_GROUP = { 申子辰: '辰', 寅午戌: '戌', 巳酉丑: '丑', 亥卯未: '未' }
const JIANGXING_BY_GROUP = { 申子辰: '子', 寅午戌: '午', 巳酉丑: '酉', 亥卯未: '卯' }

const TIANYI_BY_DAY_STEM = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
  辛: ['寅', '午'],
}

const WENCHANG_BY_DAY_STEM = {
  甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申',
  己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
}

const TEN_GOD_TRAITS = {
  比肩: '独立、主见强，重个人边界和执行意志。',
  劫财: '竞争意识明显，行动果断，但要避免资源分散。',
  食神: '表达自然、温和输出，重体验和持续创造。',
  伤官: '思维锋利、敢于打破旧规则，适合创新突破。',
  偏财: '资源整合力强，擅长机会识别与外部链接。',
  正财: '务实稳健，重秩序和结果可落地。',
  七杀: '抗压、果断、目标感强，适合高竞争场域。',
  正官: '责任感与规范意识强，重名誉与长期信用。',
  偏印: '学习快、洞察力强，适合复杂问题拆解。',
  正印: '包容、支持、重体系，容易得到稳定助力。',
}

const CHANG_SHENG_TRAITS = {
  长生: '起势阶段，适合建立新方向。',
  沐浴: '感受力强，变化多，适合学习与试错。',
  冠带: '规则感提升，开始形成外在形象。',
  临官: '执行力增强，适合承担职责。',
  帝旺: '能量高峰，宜主动出击。',
  衰: '节奏放缓，适合收敛与优化。',
  病: '敏感度高，需重视身心平衡。',
  死: '旧模式退场，适合阶段性清理。',
  墓: '沉淀积累，利复盘与储备。',
  绝: '断舍离窗口，宜减负转向。',
  胎: '新周期酝酿，先蓄力再发力。',
  养: '滋养修复，利打基础与内功。',
}

const STEM_IMAGE = {
  甲: '参天大树',
  乙: '藤蔓花草',
  丙: '烈日阳光',
  丁: '烛火灯光',
  戊: '高山厚土',
  己: '田园沃土',
  庚: '刀斧精钢',
  辛: '珠玉金饰',
  壬: '江河大海',
  癸: '雨露清泉',
}

const BRANCH_IMAGE = {
  子: '地下活水',
  丑: '寒冬湿土',
  寅: '初春萌木',
  卯: '繁茂花林',
  辰: '蓄势水库',
  巳: '升温火势',
  午: '正午烈火',
  未: '暖土余温',
  申: '收敛秋金',
  酉: '精炼金气',
  戌: '燥土守成',
  亥: '深冬海水',
}


const PILLAR_META = {
  year: {
    label: '年柱',
    age: '1-15岁',
    role: '祖辈、原生家庭',
    phase: '这是你的“根”。多反映家风、早年环境与安全感原点。',
  },
  month: {
    label: '月柱',
    age: '16-30岁',
    role: '父母、事业环境',
    phase: '这是你的“苗”。多反映青年奋斗节奏、职场空气和竞争密度。',
  },
  day: {
    label: '日柱',
    age: '31-45岁',
    role: '自我、内心、配偶',
    phase: '这是你的“花”。核心看你真实人格、关系模式和中段发力点。',
  },
  hour: {
    label: '时柱',
    age: '46岁以后',
    role: '子女、下属、晚年',
    phase: '这是你的“果”。看晚景沉淀、团队影响力与传承能力。',
  },
}


function getElementRelation(dayElement, targetElement) {
  if (targetElement === dayElement) return 'peer'
  if (GENERATES[dayElement] === targetElement) return 'output'
  if (CONTROLS[dayElement] === targetElement) return 'wealth'
  if (CONTROLS[targetElement] === dayElement) return 'officer'
  if (GENERATES[targetElement] === dayElement) return 'resource'
  return 'peer'
}

function tenGod(dayStem, targetStem) {
  const dayElement = getStemElement(HEAVENLY_STEMS.indexOf(dayStem))
  const targetElement = getStemElement(HEAVENLY_STEMS.indexOf(targetStem))
  const relation = getElementRelation(dayElement, targetElement)
  const samePolarity = STEM_POLARITY[dayStem] === STEM_POLARITY[targetStem]

  if (relation === 'peer') return samePolarity ? '比肩' : '劫财'
  if (relation === 'output') return samePolarity ? '食神' : '伤官'
  if (relation === 'wealth') return samePolarity ? '偏财' : '正财'
  if (relation === 'officer') return samePolarity ? '七杀' : '正官'
  if (relation === 'resource') return samePolarity ? '偏印' : '正印'
  return '比肩'
}

function hiddenStemDetails(dayStem, branch) {
  const hidden = BRANCH_HIDDEN_STEMS[branch] || []
  return hidden.map((stem) => ({
    stem,
    element: getStemElement(HEAVENLY_STEMS.indexOf(stem)),
    god: tenGod(dayStem, stem),
  }))
}

function getChangShengState(dayStem, branch) {
  const startBranch = CHANG_SHENG_START[dayStem]
  if (!startBranch) return '平'
  const startIdx = BRANCH_ORDER.indexOf(startBranch)
  const branchIdx = BRANCH_ORDER.indexOf(branch)
  if (startIdx < 0 || branchIdx < 0) return '平'
  const stageIndex = (branchIdx - startIdx + 12) % 12
  return CHANG_SHENG_STAGES[stageIndex]
}

function getMonthSeason(branch) {
  if (['寅', '卯', '辰'].includes(branch)) return '春令（木气渐旺）'
  if (['巳', '午', '未'].includes(branch)) return '夏令（火气渐旺）'
  if (['申', '酉', '戌'].includes(branch)) return '秋令（金气渐旺）'
  return '冬令（水气渐旺）'
}

function getXunKong(daySexagenaryIndex) {
  const xun = Math.floor(((daySexagenaryIndex % 60) + 60) % 60 / 10)
  return XUN_KONG[xun] || []
}

function detectBranchRelations(branches) {
  const values = Object.values(branches)
  const clashes = []
  const combines = []
  const penalties = []
  const halfCombines = []

  const clashMap = { 子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥' }
  for (const [a, b] of Object.entries(clashMap)) {
    if (values.includes(a) && values.includes(b)) clashes.push(`${a}${b}冲`)
  }

  const combinePairs = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]
  for (const [a, b] of combinePairs) {
    if (values.includes(a) && values.includes(b)) combines.push(`${a}${b}合`)
  }

  if (values.includes('子') && values.includes('卯')) penalties.push('子卯刑（无礼之刑）')
  if (values.includes('寅') && values.includes('巳') && values.includes('申')) penalties.push('寅巳申三刑')
  if (values.includes('丑') && values.includes('戌') && values.includes('未')) penalties.push('丑戌未三刑')

  const triads = [
    { group: ['申', '子', '辰'], name: '申子辰水局' },
    { group: ['亥', '卯', '未'], name: '亥卯未木局' },
    { group: ['寅', '午', '戌'], name: '寅午戌火局' },
    { group: ['巳', '酉', '丑'], name: '巳酉丑金局' },
  ]
  for (const t of triads) {
    const hit = t.group.filter((b) => values.includes(b))
    if (hit.length === 2) halfCombines.push(`${hit[0]}${hit[1]}半合（趋向${t.name.slice(-2)}）`)
    if (hit.length === 3) halfCombines.push(`${t.name}成局`)
  }

  return { clashes, combines, penalties, halfCombines }
}

function detectShensha(dayStem, yearBranch, dayBranch, allBranches) {
  const tags = []
  const yearGroup = GROUP_BY_BRANCH[yearBranch]
  const dayGroup = GROUP_BY_BRANCH[dayBranch]

  const taohuaYear = TAOHUA_BY_GROUP[yearGroup]
  const taohuaDay = TAOHUA_BY_GROUP[dayGroup]
  if (taohuaYear && allBranches.includes(taohuaYear)) tags.push(`桃花（以年支查：${yearGroup}见${taohuaYear}）`)
  if (taohuaDay && allBranches.includes(taohuaDay) && taohuaDay !== taohuaYear) tags.push(`桃花（以日支查：${dayGroup}见${taohuaDay}）`)

  const yima = YIMA_BY_GROUP[dayGroup]
  if (yima && allBranches.includes(yima)) tags.push(`驿马（${dayGroup}马在${yima}）`)

  const huagai = HUAGAI_BY_GROUP[dayGroup]
  if (huagai && allBranches.includes(huagai)) tags.push(`华盖（${dayGroup}见${huagai}）`)

  const jiangxing = JIANGXING_BY_GROUP[dayGroup]
  if (jiangxing && allBranches.includes(jiangxing)) tags.push(`将星（${dayGroup}见${jiangxing}）`)

  const tianyi = TIANYI_BY_DAY_STEM[dayStem] || []
  const tianyiHit = tianyi.filter((b) => allBranches.includes(b))
  if (tianyiHit.length > 0) tags.push(`天乙贵人（${dayStem}日见${tianyiHit.join('、')}）`)

  const wenchang = WENCHANG_BY_DAY_STEM[dayStem]
  if (wenchang && allBranches.includes(wenchang)) tags.push(`文昌（${dayStem}日见${wenchang}）`)

  return tags
}

function describePillarPhase(key) {
  if (key === 'year') return '这部分常对应早年环境烙印，重点看家庭规则、资源起点与安全感来源。'
  if (key === 'month') return '这部分常对应青年阶段的学业与职业赛道，重点看竞争强度与平台质量。'
  if (key === 'day') return '这部分是命盘核心，重点看自我底色、亲密关系模式与中段人生主课题。'
  return '这部分常对应后半生与潜意识驱动力，重点看长期影响力、传承与晚景结构。'
}

function getGodTendency(god) {
  return TEN_GOD_TRAITS[god] || '该十神提示你在此阶段有鲜明的行为倾向，需要结合全局判断。'
}

function buildStrengthProfile(bazi, dayElement) {
  const visibleStems = [bazi.year.stem, bazi.month.stem, bazi.day.stem, bazi.hour.stem]
  const visibleElements = visibleStems.map((stem) => getStemElement(HEAVENLY_STEMS.indexOf(stem)))
  const supportElement = Object.keys(GENERATES).find((k) => GENERATES[k] === dayElement)
  const supportCount = visibleElements.filter((e) => e === dayElement || e === supportElement).length
  const drainCount = visibleElements.filter((e) => CONTROLS[dayElement] === e || GENERATES[dayElement] === e).length

  if (supportCount >= 3) {
    return `四柱天干对日主${dayElement}的扶助较明显（扶助位约${supportCount}处），主观能动性强，适合主动掌控节奏；同时要留意“过刚”导致的沟通摩擦。`
  }
  if (drainCount >= 3) {
    return `四柱天干中“泄耗/耗力”信号较密集（相关位约${drainCount}处），更适合先稳框架再冲目标，避免在高压期过度透支。`
  }
  return '四柱天干对日主的扶抑较均衡，属于“可快可慢”的结构，关键在于阶段性策略：机会期放大执行，调整期回归复盘。'
}

function explainShenshaTag(tag) {
  if (tag.includes('桃花')) return `${tag}：增强人际吸引力与审美表达，优势是社交破冰快，提醒是边界与承诺要清晰。`
  if (tag.includes('驿马')) return `${tag}：代表动象和迁移象较强，适合跨城、跨团队或多场景协作，避免频繁切换导致节奏失控。`
  if (tag.includes('华盖')) return `${tag}：提升独处深度和研究能力，适合专业沉淀、内容创作或方法论建设。`
  if (tag.includes('将星')) return `${tag}：组织与带领倾向明显，遇事容易站到“决策位”，提醒是授权和协作机制同样重要。`
  if (tag.includes('天乙贵人')) return `${tag}：关键节点往往有贵人托底，建议主动经营长期合作关系与可信赖圈层。`
  if (tag.includes('文昌')) return `${tag}：学习、表达、考试或写作相关事项更易出成绩，适合打造稳定输出系统。`
  return `${tag}：可作为个性化提示，不单独决定吉凶。`
}

function buildCoreSelfModule(bazi) {
  const dayStem = bazi.day.stem
  const dayBranch = bazi.day.branch
  const seatState = getChangShengState(dayStem, dayBranch)
  const spouseGod = tenGod(dayStem, BRANCH_HIDDEN_STEMS[dayBranch]?.[0] || dayStem)

  const stemImage = STEM_IMAGE[dayStem] || '自我主轴'
  const branchImage = BRANCH_IMAGE[dayBranch] || '内在底层'

  const stemPlain = `日主是${dayStem}，意象像${stemImage}。你更可能给人正直、有方向感的印象，做事偏直接。优势是执行快，提醒是表达时留一点缓冲。`
  const branchPlain = `日支是${dayBranch}，意象像${branchImage}。这部分反映内在安全感来源，你更可能外刚内细，重情绪质量。`
  const spousePlain = `夫妻宫十神为${spouseGod}，你更可能看重被理解与稳定支持，关系里重“能否托底”。`
  const seatPlain = `自坐${seatState}。${seatState === '沐浴' ? '你更可能在人群中有可见度和亲和力。' : '你更可能在顺势节奏下稳定发力。'}`

  return {
    profession: [
      { label: '日主（你本人）', value: dayStem },
      { label: '日支（内心/夫妻宫）', value: dayBranch },
      { label: '自坐状态', value: seatState },
      { label: '夫妻宫十神', value: spouseGod },
    ],
    plain: [
      { title: `【天干：${dayStem}】外在的你`, content: stemPlain },
      { title: `【地支：${dayBranch}】内在的你`, content: `${branchPlain}${spousePlain}` },
      { title: `【自坐：${seatState}】隐藏魅力`, content: seatPlain },
    ],
    terms: [spouseGod, '七杀', '伤官', '羊刃', '桃花', '驿马'].filter((v, i, arr) => arr.indexOf(v) === i),
  }
}

function pickShenshaKeyword(tag) {
  if (tag.includes('桃花')) return '桃花'
  if (tag.includes('驿马')) return '驿马'
  if (tag.includes('华盖')) return '华盖'
  if (tag.includes('将星')) return '将星'
  if (tag.includes('天乙贵人')) return '天乙贵人'
  if (tag.includes('文昌')) return '文昌'
  return ''
}

function buildInteractiveReport(bazi) {
  const dayStem = bazi.day.stem
  const pillars = [
    { key: 'year', data: bazi.year },
    { key: 'month', data: bazi.month },
    { key: 'day', data: bazi.day },
    { key: 'hour', data: bazi.hour },
  ]

  const pillarDetails = pillars.map((p) => {
    const meta = PILLAR_META[p.key]
    const stemGod = p.key === 'day' ? '日元（你自己）' : tenGod(dayStem, p.data.stem)
    const hidden = hiddenStemDetails(dayStem, p.data.branch)
    const hiddenList = hidden.length > 0 ? hidden.map((h) => `${h.stem}${h.god}`).join('、') : '无明显藏干'

    const plain = p.key === 'year'
      ? '早年更可能先学规则和边界，核心课题是把压力转成独立性。'
      : p.key === 'month'
        ? '青年阶段竞争感更强，你更可能在高压中快速练出硬实力。'
        : p.key === 'day'
          ? '日柱是主轴，你更可能在自我价值和关系平衡里完成中段发力。'
          : '后半生更看沉淀与传承，你更可能从短期输赢转向长期体系。'

    return {
      key: p.key,
      title: `${meta.label}：${p.data.stem}${p.data.branch}（${meta.role}）`,
      profession: `专业构成：天干【${p.data.stem}】（${stemGod}）+ 地支【${p.data.branch}】（藏干：${hiddenList}）。`,
      meaning: `代表含义：${meta.phase}（${meta.age}）`,
      plain,
    }
  })

  const allBranches = [bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch]
  const shenshaTags = detectShensha(dayStem, bazi.year.branch, bazi.day.branch, allBranches)
  const shenshaDetails = shenshaTags.map((tag) => {
    const key = pickShenshaKeyword(tag)
    return {
      tag,
      short: BAZI_SHENSHA_KB[key]?.short || explainShenshaTag(tag),
      hint: BAZI_SHENSHA_KB[key]?.hint || '提醒：结合全盘看结构，不单独下结论。',
    }
  })

  const hiddenDynamics = pillars.map((p) => {
    const hidden = hiddenStemDetails(dayStem, p.data.branch)
    return {
      key: p.key,
      title: `${PILLAR_META[p.key].label}地支 ${p.data.branch} 藏干`,
      chips: hidden.map((h) => `${h.stem}（${h.god}）`),
      plain: hidden.length > 0
        ? `深层动机偏向${hidden.map((h) => `${h.god}`).join('、')}，关键决策时更可能由这些倾向驱动。`
        : '该支藏干信号较轻，更多通过外部环境触发。',
    }
  })

  const relations = detectBranchRelations({
    year: bazi.year.branch,
    month: bazi.month.branch,
    day: bazi.day.branch,
    hour: bazi.hour.branch,
  })

  const summary = [
    relations.clashes.length > 0 ? `有冲（${relations.clashes.join('、')}），你更可能经历阶段重构，提前做预案更稳。` : '正冲不重，整体稳定性较好，更可能走长期复利。',
    relations.combines.length > 0 ? `有合（${relations.combines.join('、')}），资源整合更可能成为你的加分项。` : '六合不强，更依赖主动经营关系与平台。',
    relations.penalties.length > 0 ? `有刑（${relations.penalties.join('、')}），提醒先定沟通规则再提执行速度。` : '刑象不重，内耗风险相对可控。',
  ].join('')

  const dayState = getChangShengState(dayStem, bazi.day.branch)
  const conclusions = [
    `核心人格：日柱${bazi.day.stem}${bazi.day.branch}，你更可能在“先定方向、再稳推进”时发挥更好。`,
    relations.clashes.length > 0
      ? `结构节奏：盘中有冲，人生阶段更可能出现几次重构，提前做预案会更稳。`
      : '结构节奏：盘面稳定性较好，更可能通过长期复利拉开差距。',
    `关系与能量：自坐${dayState}，你更可能在情绪被支持时进入高效状态，先管恢复力再冲目标。`,
  ]

  return { pillarDetails, shenshaDetails, hiddenDynamics, summary, conclusions }
}

function buildBaziReading(bazi) {
  if (!bazi) return null

  const dayStem = bazi.day.stem
  const dayElement = bazi.dayMaster.element
  const monthSeason = getMonthSeason(bazi.month.branch)

  const pillars = [
    { key: 'year', label: '年柱', age: '1-15岁', role: '祖辈/原生家庭', data: bazi.year },
    { key: 'month', label: '月柱', age: '16-30岁', role: '父母/事业环境', data: bazi.month },
    { key: 'day', label: '日柱', age: '31-45岁', role: '自我/伴侣关系', data: bazi.day },
    { key: 'hour', label: '时柱', age: '46岁后', role: '晚景/子女下属/潜意识', data: bazi.hour },
  ]

  const coreMatrix = pillars.map((p) => {
    const stemGod = p.key === 'day' ? '日元（你自己）' : tenGod(dayStem, p.data.stem)
    const hidden = hiddenStemDetails(dayStem, p.data.branch)
    const hiddenLine = hidden.length > 0
      ? hidden.map((h) => `${h.stem}（${h.god}）`).join('、')
      : '无明显藏干'

    const stemLine = `天干【${p.data.stem}】对日主属于“${stemGod}”取向，主外在角色与处事姿态。${stemGod === '日元（你自己）' ? '这里直接代表你的核心意志与人生主轴。' : getGodTendency(stemGod)}`
    const branchLine = `地支【${p.data.branch}】的藏干结构为：${hiddenLine}。这部分更像“内在引擎”，常在关键决策、情绪触发和关系互动里显形。`
    const phaseLine = describePillarPhase(p.key)

    return {
      title: `${p.label}（${p.age} · ${p.role}）`,
      content: `${stemLine}${branchLine}${phaseLine}`,
    }
  })

  const changShengLines = pillars.map((p) => `${p.label}${p.data.branch}为“${getChangShengState(dayStem, p.data.branch)}”`)
  const kongWang = getXunKong(bazi.day.sexagenaryIndex)
  const allBranches = [bazi.year.branch, bazi.month.branch, bazi.day.branch, bazi.hour.branch]
  const kongWangHits = allBranches.filter((b) => kongWang.includes(b))

  const yearNaYin = getNayinElement(bazi.year.sexagenaryIndex)
  const dayNaYin = getNayinElement(bazi.day.sexagenaryIndex)
  const monthNaYin = getNayinElement(stemBranchToSexagenary(bazi.month.stemIndex, bazi.month.branchIndex))
  const hourNaYin = getNayinElement(stemBranchToSexagenary(bazi.hour.stemIndex, bazi.hour.branchIndex))

  const stateEnergy = [
    {
      title: '1. 星运（十二长生）',
      content: `${changShengLines.join('；')}。其中日支${bazi.day.branch}落在“${getChangShengState(dayStem, bazi.day.branch)}”，关键词是“${CHANG_SHENG_TRAITS[getChangShengState(dayStem, bazi.day.branch)] || '阶段性能量切换明显'}”。这说明你的发力方式并非线性，往往是阶段性蓄力后再集中爆发。`,
    },
    {
      title: '2. 自坐（日柱）',
      content: `日柱为${bazi.day.stem}${bazi.day.branch}，它对应你“默认人格”和“关系中的真实反应”。当你感到安全时，会更容易展现该位置的高阶表达；当压力上升时，也会暴露它的低阶防御模式，因此中长期最重要的是建立可持续的情绪复位机制。`,
    },
    {
      title: '3. 空亡',
      content: `你这组日柱所属旬空为 ${kongWang.join('、')}。${kongWangHits.length > 0 ? `命盘中命中 ${kongWangHits.join('、')}，说明相关主题会有“先虚后实”的体验。` : '四柱地支未落旬空，结构执行力通常更偏实，投入与产出关联感更强。'}`,
    },
    {
      title: '4. 纳音辅助',
      content: `四柱纳音参考：年柱${yearNaYin}、月柱${monthNaYin}、日柱${dayNaYin}、时柱${hourNaYin}。纳音用于性格侧写与语义补充，不单独决定吉凶。`,
    },
    {
      title: '5. 季节背景',
      content: `月支为${bazi.month.branch}，处于${monthSeason}。季节背景会放大某些五行表达，让你在“何时发力、何时蓄力”上呈现阶段性差异。`,
    },
    {
      title: '6. 日主承压与扶助',
      content: buildStrengthProfile(bazi, dayElement),
    },
  ]

  const relations = detectBranchRelations({
    year: bazi.year.branch,
    month: bazi.month.branch,
    day: bazi.day.branch,
    hour: bazi.hour.branch,
  })

  const deepLogic = [
    {
      title: '1. 地支冲合刑整体',
      content: [
        relations.clashes.length > 0 ? `冲：${relations.clashes.join('、')}。冲代表拉扯和重构，常见于关系边界、居住迁移或职业节奏的大调整。` : '冲：未见明显正冲，结构稳定性相对更高。',
        relations.combines.length > 0 ? `合：${relations.combines.join('、')}。合代表资源连接与协同机会，利合作、整合与关系经营。` : '合：未见明显六合，更依赖主动经营关系与平台。',
        relations.penalties.length > 0 ? `刑：${relations.penalties.join('、')}。刑代表内在拧巴或执行内耗，建议把“先沟通规则”放在“先做事”之前。` : '刑：未见明显三刑或子卯刑，内耗型冲突相对可控。',
        relations.halfCombines.length > 0 ? `局势：${relations.halfCombines.join('、')}。这类结构常提示某一元素主题被持续放大。` : '局势：未形成明显半合/三合趋势，整体更偏综合型。',
      ].join(''),
    },
    {
      title: '2. 藏干互动（深层驱动力）',
      content: '地支藏干是命盘的“底层程序”。当天干显象与藏干诉求一致时，做事会有明显的顺手感；若显象与藏干长期反向，常见表现是“表面很能扛，内里很消耗”。因此你的长期策略不是一味加速，而是让目标、节奏、关系三者保持同向。',
    },
    {
      title: '3. 结构提示（落地建议）',
      content: '若“冲/刑”偏多，优先做关系边界和沟通协议；若“合/成局”偏多，优先做项目闭环和成果沉淀。对你而言，真正能拉开差距的不是一次爆发，而是“把高峰期成果留在系统里”的能力。',
    },
    {
      title: '4. 主轴矛盾与解法',
      content: '命盘解读里最常见的误区，是把“天赋”当作“结果”。正确路径是：先识别冲突主轴，再设计稳定解法。比如竞争强就配恢复机制，表达强就配规则框架，资源强就配风险边界，这样才能把命盘优势变成长期复利。',
    },
  ]

  const shenshaTags = detectShensha(dayStem, bazi.year.branch, bazi.day.branch, allBranches)
  const shensha = [
    {
      title: '1. 神煞标签（简版）',
      content: shenshaTags.length > 0
        ? `命盘可见：${shenshaTags.join('；')}。神煞更像“个性化标签”，用于辅助观察某些主题是否被放大。`
        : '本盘常见标签不算密集，说明你更适合以四柱结构、阶段节奏和现实选择作为主判断依据。',
    },
    {
      title: '2. 标签逐条解读',
      content: shenshaTags.length > 0
        ? shenshaTags.map((tag) => explainShenshaTag(tag)).join(' ')
        : '神煞标签较少不代表弱，往往意味着路径更务实，执行结果受自身策略影响更大。',
    },
    {
      title: '3. 使用建议',
      content: '神煞最合理的用法是“预警与加分项”：桃花重边界、驿马重节奏、贵人重协同、华盖重深耕。任何标签都不能脱离现实行动，真正的变化来自持续决策质量。',
    },
  ]

  return { coreMatrix, stateEnergy, deepLogic, shensha, dayElement }
}

export default function Bazi() {
  const { profile, hasProfile } = useProfile()
  const [readingMode, setReadingMode] = useState('standard')
  const [openTerm, setOpenTerm] = useState('')
  const [openPillar, setOpenPillar] = useState('')
  const [openShensha, setOpenShensha] = useState('')
  const [openHidden, setOpenHidden] = useState('')
  const [openLongSection, setOpenLongSection] = useState('')
  const [interviewSessions, setInterviewSessions] = useState({})
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewBusy, setInterviewBusy] = useState(false)
  const [interviewError, setInterviewError] = useState('')
  const [activeSection, setActiveSection] = useState('career')
  const [answerInputBySection, setAnswerInputBySection] = useState({})
  const [feedbackBySection, setFeedbackBySection] = useState({})
  const [exportCopied, setExportCopied] = useState(false)
  const interviewSections = useMemo(() => [
    { key: 'career', label: '事业', hint: '职业路径、管理能力、关键决策' },
    { key: 'love', label: '爱情', hint: '关系模式、沟通冲突、亲密边界' },
    { key: 'wealth', label: '财运', hint: '收入结构、现金流、风险偏好' },
    { key: 'health', label: '健康', hint: '作息压力、恢复能力、生活节律' },
  ], [])

  const bazi = useMemo(() => {
    if (!hasProfile) return null
    return calculateBazi(profile)
  }, [hasProfile, profile])

  useEffect(() => {
    if (!hasProfile || !profile.id) return
    let canceled = false
    const loadLatest = async () => {
      setInterviewLoading(true)
      setInterviewError('')
      try {
        const pairs = await Promise.all(
          interviewSections.map(async (s) => {
            try {
              const data = await getLatestBaziInterview(profile.id, s.key)
              return [s.key, data]
            } catch {
              return [s.key, null]
            }
          }),
        )
        if (!canceled) {
          setInterviewSessions(Object.fromEntries(pairs))
        }
      } catch {
        if (!canceled) setInterviewSessions({})
      } finally {
        if (!canceled) setInterviewLoading(false)
      }
    }
    loadLatest()
    return () => { canceled = true }
  }, [hasProfile, profile.id, interviewSections])

  const handleStartInterview = async (sectionKey) => {
    if (!bazi) return
    setInterviewBusy(true)
    setInterviewError('')
    try {
      const session = await startBaziInterview({
        profile_id: profile.id,
        bazi_payload: bazi,
        target_section: sectionKey,
      })
      setInterviewSessions((prev) => ({ ...prev, [sectionKey]: session }))
      setActiveSection(sectionKey)
      setAnswerInputBySection((prev) => ({ ...prev, [sectionKey]: null }))
      setFeedbackBySection((prev) => ({ ...prev, [sectionKey]: '' }))
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : '启动访谈失败')
    } finally {
      setInterviewBusy(false)
    }
  }

  const handleSubmitAnswer = async (sectionKey) => {
    const session = interviewSessions[sectionKey]
    const selected = answerInputBySection[sectionKey]
    if (!session?.session_id) return
    if (!selected?.key || !selected?.text) return
    setInterviewBusy(true)
    setInterviewError('')
    try {
      const updated = await submitBaziInterviewAnswer(session.session_id, {
        option_key: selected.key,
        option_text: selected.text,
      })
      setInterviewSessions((prev) => ({ ...prev, [sectionKey]: updated }))
      setAnswerInputBySection((prev) => ({ ...prev, [sectionKey]: null }))
      if (updated.feedback) {
        setFeedbackBySection((prev) => ({ ...prev, [sectionKey]: updated.feedback }))
      }
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : '提交答案失败')
    } finally {
      setInterviewBusy(false)
    }
  }

  const handleExport = async (sectionKey) => {
    const session = interviewSessions[sectionKey]
    if (!session?.session_id) return
    setInterviewBusy(true)
    setInterviewError('')
    try {
      const exported = await exportBaziInterview(session.session_id)
      const blob = new Blob([exported.markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bazi-interview-${sectionKey}-${profile.nickname || profile.id}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      try {
        await navigator.clipboard.writeText(exported.markdown)
        setExportCopied(true)
        setTimeout(() => setExportCopied(false), 1200)
      } catch {
        setExportCopied(false)
      }
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setInterviewBusy(false)
    }
  }

  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : ''
  const timeLabel = `${profile.birthHour}:${String(profile.birthMinute).padStart(2, '0')}`

  if (!hasProfile) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>☯️ 八字</h1>
          <p>基于档案信息自动排出命盘</p>
        </div>
        <div className="card subpage-empty">
          <p>尚未创建档案</p>
          <Link to="/profile" className="btn btn-primary">创建档案</Link>
        </div>
      </div>
    )
  }

  if (!bazi) return null

  const reading = buildBaziReading(bazi)
  const coreSelf = buildCoreSelfModule(bazi)
  const interactive = buildInteractiveReport(bazi)
  const activeSession = interviewSessions[activeSection] || null

  return (
    <div className="page page-wide bazi-page">
      <div className="page-header">
        <h1>☯️ 八字</h1>
        <p>基于天文算法 + 节气实时计算</p>
        <div className="mode-switch">
          {Object.entries(READING_MODES).map(([key, label]) => (
            <button key={key} type="button" className={`mode-switch-btn ${readingMode === key ? 'active' : ''}`} onClick={() => setReadingMode(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card profile-badge mb-16">
        <span style={{ fontSize: '1rem' }}>👤</span>
        <span className="profile-badge-meta">
          {profile.nickname} · {genderLabel} · {profile.birthDate} {timeLabel}
          {profile.dstMode === 'manual'
            ? ` · 夏令时（手动${profile.isDST ? '是' : '否'}）`
            : ' · 夏令时自动'}
        </span>
        <Link to="/profile" className="profile-badge-link">编辑</Link>
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 10 }}>命盘深度访谈解析</h3>
        <p style={{ fontSize: '0.8125rem', marginBottom: 10 }}>
          四大板块独立访谈：每个板块10题，按你的八字结构递进追问。
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9a3412', marginBottom: 12 }}>
          健康板块仅作参考，不替代医疗建议。
        </p>

        <div className="bazi-ai-entry-grid">
          {interviewSections.map((s) => {
            const session = interviewSessions[s.key]
            const total = session?.total_questions || 10
            const done = session?.answered_count || 0
            const pct = Math.min(100, Math.round((done / total) * 100))
            return (
              <div key={s.key} className={`bazi-ai-entry-card ${activeSection === s.key ? 'active' : ''}`}>
                <div className="bazi-ai-entry-title">{s.label}</div>
                <div className="bazi-ai-entry-hint">{s.hint}</div>
                <div className="bazi-ai-entry-meta">
                  {session ? `进度 ${done}/${total}` : '尚未开始'}
                </div>
                {session && (
                  <div style={{ height: 6, borderRadius: 999, background: '#dbeafe', marginTop: 8 }}>
                    <div style={{ height: 6, borderRadius: 999, width: `${pct}%`, background: 'linear-gradient(90deg, #0f7f91, #16a7b8)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!session ? (
                    <button className="btn btn-primary" type="button" onClick={() => handleStartInterview(s.key)} disabled={interviewBusy || interviewLoading}>
                      点击开始（10题）
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-secondary" type="button" onClick={() => setActiveSection(s.key)}>
                        {session.status === 'completed' ? '查看结果' : '继续作答'}
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => handleExport(s.key)} disabled={interviewBusy}>
                        导出
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {activeSession && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              当前板块：{interviewSections.find((s) => s.key === activeSection)?.label}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span>进度：{activeSession.answered_count}/{activeSession.total_questions}</span>
              <span>{Math.min(100, Math.round((activeSession.answered_count / activeSession.total_questions) * 100))}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#dbeafe' }}>
              <div style={{
                height: 8,
                borderRadius: 999,
                width: `${Math.min(100, Math.round((activeSession.answered_count / activeSession.total_questions) * 100))}%`,
                background: 'linear-gradient(90deg, #0f7f91, #16a7b8)',
              }}
              />
            </div>

            {activeSession.status !== 'completed' && activeSession.current_question && (
              <div className="reading-card" style={{ marginTop: 4 }}>
                <div className="reading-card-title">
                  {activeSession.current_question.section_label} · 第{activeSession.current_question.question_number_in_section}问
                </div>
                <div className="reading-card-content" style={{ marginBottom: 10 }}>
                  {activeSession.current_question.question}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(activeSession.current_question.options || []).map((opt) => {
                    const picked = answerInputBySection[activeSection]?.key === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`btn ${picked ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '10px 12px', whiteSpace: 'normal' }}
                        onClick={() => setAnswerInputBySection((prev) => ({ ...prev, [activeSection]: opt }))}
                      >
                        <strong>{opt.key}.</strong> {opt.text}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => handleSubmitAnswer(activeSection)}
                    disabled={interviewBusy || !answerInputBySection[activeSection]?.key}
                  >
                    {interviewBusy ? '提交中…' : '提交并进入下一问'}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => handleExport(activeSection)} disabled={interviewBusy}>
                    {exportCopied ? '已复制并导出' : '导出当前记录'}
                  </button>
                </div>
              </div>
            )}

            {feedbackBySection[activeSection] && (
              <div className="reading-card">
                <div className="reading-card-title">AI即时反馈</div>
                <div className="reading-card-content">{feedbackBySection[activeSection]}</div>
              </div>
            )}

            {activeSession.status === 'completed' && (
              <div className="reading-card" style={{ marginTop: 4 }}>
                <div className="reading-card-title">访谈已完成</div>
                <div className="reading-card-content">
                  已完成该板块10题递进访谈，你可以导出完整问答记录，或查看下方AI总结。
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn btn-secondary" type="button" onClick={() => handleExport(activeSection)} disabled={interviewBusy}>
                    {exportCopied ? '已复制并导出' : '导出完整记录'}
                  </button>
                  <button className="btn btn-primary" type="button" onClick={() => handleStartInterview(activeSection)} disabled={interviewBusy}>
                    重新开始新一轮访谈
                  </button>
                </div>
              </div>
            )}

            {activeSession.final_summary && (
              <div className="reading-card">
                <div className="reading-card-title">AI总结（结构化）</div>
                <div className="reading-card-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(activeSession.final_summary, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}

        {interviewLoading && (
          <p style={{ marginTop: 10, fontSize: '0.8125rem' }}>正在加载最近访谈…</p>
        )}
        {interviewError && (
          <p style={{ marginTop: 10, fontSize: '0.8125rem', color: '#b42318' }}>{interviewError}</p>
        )}
      </div>

      <div className="result-card">
        <h3 style={{ textAlign: 'center', marginBottom: 20 }}>八字命盘</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {bazi.pillars.map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
              <div style={{
                fontSize: '1.375rem',
                fontWeight: 600,
                background: 'var(--bg)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 4px',
                border: '0.5px solid var(--separator)',
                letterSpacing: 4,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            日主：{bazi.dayMaster.stem}（{reading?.dayElement}）
          </span>
          {' · '}
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {ELEMENT_COMMENTS[reading?.dayElement] || '命盘结构用于趋势参考，不替代现实决策。'}
          </span>
        </div>
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 12 }}>一、核心自我模块（专业展示 + 大白话翻译）</h3>
        <div className="bazi-core-panel">
          <div className="bazi-core-pillars">
            {coreSelf.profession.map((item) => (
              <div key={item.label} className="bazi-core-chip">
                <div className="bazi-core-chip-label">{item.label}</div>
                <div className="bazi-core-chip-value">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="bazi-dayseal-wrap">
            <div className="bazi-dayseal-stamp">{`${bazi.day.stem}${bazi.day.branch}核心`}</div>
            <div className="bazi-dayseal-main">
              <span>{bazi.day.stem}</span>
              <span>{bazi.day.branch}</span>
            </div>
            <div className="bazi-dayseal-sub">日柱高亮 · 命盘主轴</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {coreSelf.plain.map((s) => (
            <div key={s.title} className="reading-card">
              <div className="reading-card-title">{s.title}</div>
              <div className="reading-card-content">{formatCardText(s.content, readingMode, { conciseSentences: 1 })}</div>
            </div>
          ))}
        </div>

        <div className="bazi-term-grid">
          {coreSelf.terms.map((term) => {
            const isOpen = openTerm === term
            return (
              <button
                key={term}
                type="button"
                className={`bazi-term-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setOpenTerm(isOpen ? '' : term)}
              >
                <span>{term} · {BAZI_TERM_KB[term]?.short || '术语标签'}</span>
                <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
              </button>
            )
          })}
        </div>
        {openTerm && (
          <div className="bazi-term-panel">
            <div className="bazi-term-title">术语翻译：{openTerm}</div>
            <div className="bazi-term-content">
              {BAZI_TERM_KB[openTerm]?.hint || `${openTerm}：建议结合四柱结构一起看，不单独下结论。`}
            </div>
          </div>
        )}
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 12 }}>二、先看结论（3条）</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {interactive.conclusions.map((item) => (
            <div key={item} className="reading-card">
              <div className="reading-card-content">{formatCardText(item, readingMode, { conciseSentences: 1 })}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 12 }}>三、四柱人生进度条（点击展开）</h3>
        <div className="bazi-stack">
          {interactive.pillarDetails.map((item) => {
            const isOpen = openPillar === item.key
            return (
              <div key={item.key} className={`bazi-expand-card ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="bazi-expand-head"
                  onClick={() => setOpenPillar(isOpen ? '' : item.key)}
                >
                  <span>{item.title}</span>
                  <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="bazi-expand-body">
                    <p><strong>专业构成：</strong>{formatCardText(item.profession.replace('专业构成：', ''), readingMode, { conciseSentences: 1 })}</p>
                    <p><strong>代表含义：</strong>{formatCardText(item.meaning.replace('代表含义：', ''), readingMode, { conciseSentences: 1 })}</p>
                    <p><strong>大白话：</strong>{formatCardText(item.plain, readingMode, { conciseSentences: 1 })}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 12 }}>四、神煞个性化标签（点击查看）</h3>
        <div className="bazi-term-grid">
          {interactive.shenshaDetails.map((item) => {
            const isOpen = openShensha === item.tag
            return (
              <button
                key={item.tag}
                type="button"
                className={`bazi-term-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setOpenShensha(isOpen ? '' : item.tag)}
              >
                <span>{item.tag.split('（')[0]} · {item.short}</span>
                <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
              </button>
            )
          })}
        </div>
        {openShensha && (
          <div className="bazi-term-panel">
            <div className="bazi-term-title">神煞解读：{openShensha}</div>
            <div className="bazi-term-content">{interactive.shenshaDetails.find((v) => v.tag === openShensha)?.hint}</div>
          </div>
        )}
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 12 }}>五、地支藏干深层动能（点击查看）</h3>
        <div className="bazi-stack">
          {interactive.hiddenDynamics.map((item) => {
            const isOpen = openHidden === item.key
            return (
              <div key={item.key} className={`bazi-expand-card ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="bazi-expand-head"
                  onClick={() => setOpenHidden(isOpen ? '' : item.key)}
                >
                  <span>{item.title}</span>
                  <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="bazi-expand-body">
                    <div className="bazi-inline-chips">
                      {item.chips.map((chip) => (
                        <span key={chip} className="bazi-inline-chip">{chip}</span>
                      ))}
                    </div>
                    <p><strong>深层动机：</strong>{formatCardText(item.plain, readingMode, { conciseSentences: 1 })}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mt-24">
        <h3 style={{ marginBottom: 12 }}>六、全盘联动逻辑（汇总）</h3>
        <div className="reading-card">
          <div className="reading-card-title">你的命盘如何拼成一个完整的人</div>
          <div className="reading-card-content">{formatCardText(interactive.summary, readingMode, { conciseSentences: 2, conciseMaxChars: 150 })}</div>
        </div>
      </div>

      {reading && (
        <div className="card mt-24">
          <h3 style={{ marginBottom: 12 }}>七、深度解读（按需展开）</h3>
          {[
            { key: 'core', title: '核心矩阵（四柱、十神）', list: reading.coreMatrix },
            { key: 'state', title: '状态与能量（星运、自坐、空亡）', list: reading.stateEnergy },
            { key: 'logic', title: '底层逻辑（冲合刑与结构）', list: reading.deepLogic },
            { key: 'shensha', title: '神煞标签（潜能与提醒）', list: reading.shensha },
          ].map((group) => {
            const isOpen = openLongSection === group.key
            return (
              <div key={group.key} className={`bazi-expand-card ${isOpen ? 'active' : ''}`} style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  className="bazi-expand-head"
                  onClick={() => setOpenLongSection(isOpen ? '' : group.key)}
                >
                  <span>{group.title}</span>
                  <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="bazi-expand-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {group.list.map((s) => (
                        <div key={s.title} className="reading-card">
                          <div className="reading-card-title">{s.title}</div>
                          <div className="reading-card-content">{formatCardText(s.content, readingMode, { conciseSentences: 1 })}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="page-note">
        命理解读用于结构化自我观察与决策复盘 · 仅供娱乐与参考
      </p>
    </div>
  )
}
