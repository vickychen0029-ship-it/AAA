export const KB_V1 = {
  version: '1.0.0',
  updatedAt: '2026-05-10',
}

export const READING_MODES = {
  concise: '简版',
  standard: '标准版',
}

export function formatCardText(text, mode, options = {}) {
  if (!text || mode !== 'concise') return text
  const { conciseSentences = 1, conciseMaxChars = 88 } = options
  const sentences = String(text)
    .split(/(?<=[。！？])/)
    .map((v) => v.trim())
    .filter(Boolean)
  const picked = sentences.slice(0, Math.max(1, conciseSentences)).join('')
  return picked.length > conciseMaxChars ? `${picked.slice(0, conciseMaxChars)}...` : picked
}

export const BAZI_TERM_KB = {
  七杀: {
    short: '事业驱动力偏强，遇到压力时更可能激活执行与掌控。',
    hint: '提醒：节奏过快时先定边界，再提速度。',
  },
  正印: {
    short: '关系中更可能看重情绪支持、理解感与稳定托底。',
    hint: '提醒：把需求说清楚，比“等对方懂”更有效。',
  },
  伤官: {
    short: '表达与创新能力偏强，遇到问题更可能用脑力破局。',
    hint: '提醒：先确认规则，再展示锋芒，协作阻力会更小。',
  },
  羊刃: {
    short: '意志力与抗压性偏强，关键时刻更可能咬住不退。',
    hint: '提醒：强势阶段也要留恢复窗口，避免硬扛过度。',
  },
  桃花: {
    short: '社交可见度偏高，人际与审美表达更容易被关注。',
    hint: '提醒：边界和承诺越清晰，关系质量越稳。',
  },
  驿马: {
    short: '行动与迁移信号偏强，变化场景里更可能出现机会。',
    hint: '提醒：减少无效切换，留出沉淀时间。',
  },
}

export const BAZI_SHENSHA_KB = {
  桃花: {
    short: '人际可见度偏高，社交与表现更可能被关注。',
    hint: '提醒：边界和承诺清晰，关系质量会更稳。',
  },
  驿马: {
    short: '变化与迁移主题偏强，跨场景机会更可能出现。',
    hint: '提醒：减少无效切换，保留沉淀周期。',
  },
  华盖: {
    short: '独处思考与研究能力偏强，适合深度沉淀。',
    hint: '提醒：避免过度封闭，保持必要协作。',
  },
  将星: {
    short: '组织与决策倾向偏强，更可能在关键处担责。',
    hint: '提醒：强执行同时做好授权，团队会更稳。',
  },
  天乙贵人: {
    short: '关键节点更可能获得外部支持与托底。',
    hint: '提醒：长期经营高信任关系，贵人效应更明显。',
  },
  文昌: {
    short: '学习表达与内容输出更可能形成优势。',
    hint: '提醒：稳定输出节奏，比灵感爆发更重要。',
  },
}

export const ZIWEI_TERM_KB = {
  命宫: { short: '命宫是人生底盘，更可能决定你做选择的默认逻辑。', hint: '提醒：先认清主线，再分配精力，路径会更稳。' },
  身宫: { short: '身宫是执行引擎，显示你更可能在哪类场景主动发力。', hint: '提醒：把身宫方向做成长期积累，效果更明显。' },
  化禄: { short: '化禄偏资源入口，机会与支持更可能从这里出现。', hint: '提醒：有机会时先做转化，不只停留在连接。' },
  化权: { short: '化权偏掌控执行，你更可能在关键处承担决策责任。', hint: '提醒：强执行也要配授权，团队协同更顺。' },
  化科: { short: '化科偏口碑专业，适合做长期背书与稳定输出。', hint: '提醒：持续产出比短期高光更重要。' },
  化忌: { short: '化忌是修炼课题，提示你在该主题要更重边界。', hint: '提醒：先设风险上限，再做扩张尝试。' },
  夫妻宫: { short: '夫妻宫也看长期合作关系，信任与节奏匹配很关键。', hint: '提醒：先对齐价值观，再推进深度绑定。' },
}

export const VEDIC_TERM_KB = {
  Lagna: { short: '上升是外在接口，你更可能以它的方式开启行动。', hint: '提醒：先对齐主线，再扩大投入。' },
  Chandra: { short: '月亮是情绪内核，压力下更可能回到它的节律。', hint: '提醒：稳定恢复力，输出质量更稳。' },
  Nakshatra: { short: '星宿是细颗粒人格滤镜，补充星座差异。', hint: '提醒：把星宿特质放进具体习惯中。' },
  Mahadasha: { short: '大运是时间主轴，不同阶段激活不同课题。', hint: '提醒：顺着当前主轴配置资源更省力。' },
  庙旺: { short: '庙旺行星工具感更强，优势更可能快速落地。', hint: '提醒：优势期更要做长期沉淀。' },
  落陷: { short: '落陷是修炼课题，不是结论，意味着方法更关键。', hint: '提醒：先定边界，再做迭代优化。' },
  第1宫: { short: '第1宫关乎自我定位，决定你如何开启新周期。', hint: '提醒：身份升级先从日常节律开始。' },
}
