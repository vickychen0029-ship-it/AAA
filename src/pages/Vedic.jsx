import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import AIInterviewPanel from '../components/AIInterviewPanel.jsx'
import { calculateVedicChart } from '../calculations/vedic/vedicChart.js'
import {
  READING_MODES,
  VEDIC_TERM_KB,
  formatCardText,
} from '../knowledge/readingKnowledge.js'

const STATE_COLORS = {
  exalted: '#EF4444',
  moolatrikona: '#F97316',
  own: '#10B981',
  friendly: '#6366F1',
  neutral: '#9CA3AF',
  enemy: '#F59E0B',
  debilitated: '#6B7280',
}

const STATE_EMOJIS = {
  exalted: '🔥',
  moolatrikona: '💎',
  own: '✅',
  friendly: '👍',
  neutral: '➖',
  enemy: '⚠️',
  debilitated: '⬇️',
}

const DASHA_COLORS = {
  Ketu: '#6366F1',
  Venus: '#E84393',
  Sun: '#F97316',
  Moon: '#3B82F6',
  Mars: '#EF4444',
  Rahu: '#8B5CF6',
  Jupiter: '#F59E0B',
  Saturn: '#6366F1',
  Mercury: '#10B981',
}


function buildVedicReading(chart) {
  if (!chart) return null

  const ascName = chart.ascendant?.sign?.name || ''
  const moonName = chart.moonSign?.name || ''
  const moonNakshatra = chart.moonNakshatra?.chinese || chart.moonNakshatra?.name || ''
  const ascNakshatra = chart.ascendant?.nakshatra?.chinese || chart.ascendant?.nakshatra?.name || ''

  const byState = chart.planets.reduce((acc, p) => {
    const key = p.state || 'neutral'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const strongest = chart.planets
    .filter((p) => ['exalted', 'moolatrikona', 'own'].includes(p.state))
    .slice(0, 3)
    .map((p) => p.chinese)
  const challenge = chart.planets
    .filter((p) => ['enemy', 'debilitated'].includes(p.state))
    .slice(0, 2)
    .map((p) => p.chinese)
  const houseFocus = chart.planets.reduce((acc, p) => {
    const key = `第${p.house}宫`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topHouses = Object.entries(houseFocus)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([h]) => h)

  const currentDasha = chart.dasha?.periods?.[0]
  const nextDasha = chart.dasha?.periods?.[1]
  const dashaLine = currentDasha
    ? `当前大运主星为${currentDasha.lord}（约${currentDasha.startAge}~${currentDasha.endAge}岁）。`
    : '当前大运信息不足。'
  const dashaTransition = nextDasha
    ? `下一阶段将切换至${nextDasha.lord}大运（约${nextDasha.startAge}~${nextDasha.endAge}岁），建议提前半年做方向与资源准备。`
    : '后续大运切换信息不足。'

  const personality = `上升${ascName}（${ascNakshatra}）+ 月亮${moonName}（${moonNakshatra}）组合，显示你在外在表现与内在需求之间都很重“稳定感与方向感”。`

  const talent =
    strongest.length > 0
      ? `庙旺/入庙行星集中在${strongest.join('、')}，代表这些领域更容易形成你的长期优势。`
      : '行星状态分布均匀，属于“均衡推进型”，优势在持续迭代而非单点爆发。'

  const risk =
    challenge.length > 0
      ? `需要留意${challenge.join('、')}相关课题，遇到压力时容易出现“过快决策或过度内耗”。`
      : '敌对/落陷信息不重，风险主要来自节奏分配而非能力短板。'

  const action =
    (byState.exalted || 0) + (byState.own || 0) >= 3
      ? '建议把重心放在能持续复利的主航道：长期项目、专业壁垒、可沉淀资产。'
      : '建议先搭好稳定框架（作息、预算、学习节奏），再逐步提高目标难度。'

  const houseHint = topHouses.length > 0
    ? `行星聚焦宫位偏向${topHouses.join('、')}，这些生活主题会成为你阶段性的主战场。`
    : '宫位焦点分布较散，属于多线并进型路径。'

  const stateSummary = `行星状态统计：庙旺${byState.exalted || 0}、本源${byState.moolatrikona || 0}、入庙${byState.own || 0}、友好${byState.friendly || 0}、中性${byState.neutral || 0}、敌对${byState.enemy || 0}、落陷${byState.debilitated || 0}。`

  const relationshipHint =
    (byState.enemy || 0) + (byState.debilitated || 0) >= 2
      ? '关系层面建议采用“慢承诺、快沟通”策略，先建立规则再投入情感。'
      : '关系层面整体可用，重点在保持高质量沟通和共同成长目标。'

  const ascHouseRuler = chart.planets.find((p) => p.house === 1)
  const moonPlanets = chart.planets.filter((p) => p.sign?.name === moonName).map((p) => p.chinese)

  const beneficCount = (byState.exalted || 0) + (byState.moolatrikona || 0) + (byState.own || 0) + (byState.friendly || 0)
  const stressCount = (byState.enemy || 0) + (byState.debilitated || 0)
  const energyProfile = beneficCount >= stressCount + 2
    ? '盘面整体偏“顺风结构”，更适合主动扩张与成果放大。'
    : stressCount >= beneficCount
      ? '盘面整体偏“逆风修炼”，更适合先稳系统再追增量。'
      : '盘面呈“拉锯结构”，关键在节奏管理与取舍能力。'

  const coreMatrix = [
    {
      title: '1. 人格主轴（上升 + 月亮）',
      content: `${personality}上升看对外行动，月亮看内在需求。两者同向时更顺，反向时你更可能出现“外在强、内在累”的体感。`,
    },
    {
      title: '2. 上升轴落地（第1宫）',
      content: ascHouseRuler
        ? `第1宫有${ascHouseRuler.chinese}参与，你更可能在“自我定义、形象建立、主线推进”上偏主动。该星为${ascHouseRuler.stateLabel}时，身份升级节奏会受其影响。`
        : '第1宫主导信号较弱，更适合通过阶段目标和外部反馈逐步明确主线。',
    },
    {
      title: '3. 心智与感受（Chandra轴）',
      content: moonPlanets.length > 0
        ? `月亮星座还聚集${moonPlanets.join('、')}，情绪和认知耦合更深。你更可能共情强、感受细；重大决策前建议留“冷静窗口”。`
        : '月亮轴更偏单核心驱动，心智模式相对稳定，适合长期主义路线。',
    },
  ]

  const stateEnergy = [
    {
      title: '1. 行星状态分布',
      content: `${stateSummary}${energyProfile}`,
    },
    {
      title: '2. 优势与潜能',
      content: `${talent}这通常是你“同样投入更易出结果”的赛道，适合作为职业与个人品牌主轴。`,
    },
    {
      title: '3. 风险课题',
      content: `${risk}关键是提前设边界：预算上限、决策冷静期、复盘节奏。`,
    },
    {
      title: '4. 宫位焦点',
      content: `${houseHint}多行星聚焦同一宫位时，该主题更可能成为阶段性必修课。`,
    },
  ]

  const dashaFlow = [
    {
      title: '1. 当前大运主旋律',
      content: dashaLine,
    },
    {
      title: '2. 大运切换窗口',
      content: dashaTransition,
    },
    {
      title: '3. 关系与合作',
      content: relationshipHint,
    },
  ]

  const strategy = [
    {
      title: '1. 执行策略（90天）',
      content: `${action}建议采用“1个主目标 + 2个支撑习惯”，把目标压缩成可追踪周行动。`,
    },
    {
      title: '2. 资源策略',
      content: '优先配置两类资源：稳现金流的硬技能、扩机会入口的协作网络。两者并行，抗波动更强。',
    },
    {
      title: '3. 风险预案',
      content: '出现过劳、急躁、决策分散时先做减法：砍低价值任务，回主航道，再逐步恢复扩张。',
    },
  ]

  const conclusions = [
    `人格结论：上升${ascName} + 月亮${moonName}，你更可能在“先稳节律、再提效率”时发挥更好。`,
    `能量结论：${energyProfile}这意味着你更可能通过阶段取舍而非蛮力推进达成目标。`,
    `时间结论：${currentDasha ? `当前${currentDasha.lord}大运，顺着该主题做资源配置更稳。` : '当前大运信息有限，建议先按核心目标做稳态推进。'}`,
  ]

  return { coreMatrix, stateEnergy, dashaFlow, strategy, conclusions }
}

function buildVedicCoreModule(chart) {
  if (!chart) return null

  const ascName = chart.ascendant?.sign?.name || '-'
  const moonName = chart.moonSign?.name || '-'
  const ascNak = chart.ascendant?.nakshatra?.chinese || '-'
  const firstHousePlanet = chart.planets.find((p) => p.house === 1)
  const currentDasha = chart.dasha?.periods?.[0]

  return {
    profession: [
      { label: 'Lagna（上升）', value: ascName },
      { label: 'Chandra（月亮）', value: moonName },
      { label: '上升星宿', value: ascNak },
      { label: '当前大运', value: currentDasha?.lord || '-' },
    ],
    plain: [
      {
        title: `【Lagna：${ascName}】外在的你`,
        content: `上升像人生“门面系统”。${ascName}上升时，你更可能重方向感和掌控感，做事偏结构化。`,
      },
      {
        title: `【Chandra：${moonName}】内在的你`,
        content: `月亮是情绪与安全感核心。${moonName}月亮时，你更可能在压力下回到熟悉节律，高质量输出依赖高质量恢复。`,
      },
      {
        title: `【Mahadasha：${currentDasha?.lord || '-'}】时间主线`,
        content: `大运是阶段主旋律。当前由${currentDasha?.lord || '该主星'}主导时，你更可能被对应主题牵引，适合围绕这条主线重排目标与资源。`,
      },
    ],
    terms: ['Lagna', 'Chandra', 'Nakshatra', 'Mahadasha', '庙旺', '落陷', '第1宫'],
    stamp: firstHousePlanet?.chinese || '上升',
  }
}

export default function Vedic() {
  const { profile, hasProfile } = useProfile()
  const [readingMode, setReadingMode] = useState('standard')
  const [openTerm, setOpenTerm] = useState('')
  const [openLongSection, setOpenLongSection] = useState('')

  const chart = useMemo(() => {
    if (!hasProfile) return null
    try {
      return calculateVedicChart(profile)
    } catch {
      return null
    }
  }, [hasProfile, profile])

  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : ''
  const timeLabel = `${profile.birthHour}:${String(profile.birthMinute || 0).padStart(2, '0')}`
  const reading = buildVedicReading(chart)
  const coreSelf = buildVedicCoreModule(chart)
  const interviewPayload = useMemo(() => {
    if (!chart) return null
    return {
      ascendant: {
        sign: chart.ascendant?.sign?.name || '',
        degree: chart.ascendant?.degreeStr || '',
        nakshatra: chart.ascendant?.nakshatra?.chinese || chart.ascendant?.nakshatra?.name || '',
      },
      moon: {
        sign: chart.moonSign?.name || '',
        nakshatra: chart.moonNakshatra?.chinese || chart.moonNakshatra?.name || '',
      },
      dasha: {
        current: chart.dasha?.periods?.[0]?.lord || '',
        next: chart.dasha?.periods?.[1]?.lord || '',
      },
      planets: (chart.planets || []).slice(0, 9).map((p) => ({
        key: p.key,
        name: p.chinese,
        sign: p.sign?.name || '',
        house: p.house,
        state: p.stateLabel || p.state || '',
      })),
    }
  }, [chart])

  if (!hasProfile) {
    return (
      <div className="page page-wide vedic-page">
        <div className="page-header">
          <h1>🕉️ 印占</h1>
          <p>吠陀占星 · 恒星黄道 · Vimshottari大运</p>
        </div>
        <div className="card subpage-empty">
          <p>尚未创建档案</p>
          <Link to="/profile" className="btn btn-primary">创建档案</Link>
        </div>
      </div>
    )
  }

  if (!chart) {
    return (
      <div className="page page-wide vedic-page">
        <div className="page-header">
          <h1>🕉️ 印占</h1>
          <p>吠陀占星 · 恒星黄道 · Vimshottari大运</p>
        </div>
        <div className="card subpage-empty">
          <p>计算遇到问题，请检查出生日期</p>
          <Link to="/profile" className="btn btn-primary">检查档案</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-wide vedic-page">
      <div className="page-header">
        <h1>🕉️ 印占</h1>
        <p>Lahiri岁差 · 恒星黄道 · Vimshottari大运</p>
        <div className="mode-switch">
          {Object.entries(READING_MODES).map(([key, label]) => (
            <button key={key} type="button" className={`mode-switch-btn ${readingMode === key ? 'active' : ''}`} onClick={() => setReadingMode(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile badge */}
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

      <AIInterviewPanel
        systemType="vedic"
        profile={profile}
        payload={interviewPayload}
        title="命盘深度访谈解析"
      />

      {/* Ascendant + Moon Sign + Nakshatra summary */}
      <div className="card mb-16" style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
          {/* Lagna (Ascendant) */}
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Lagna 上升
            </div>
            <div style={{ fontSize: '2rem' }}>{chart.ascendant.sign.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{chart.ascendant.sign.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{chart.ascendant.degreeStr}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {chart.ascendant.nakshatra.chinese} · 第{chart.ascendant.nakshatra.pada}足
            </div>
          </div>

          {/* Moon Sign */}
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Chandra 月亮
            </div>
            <div style={{ fontSize: '2rem' }}>{chart.moonSign.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{chart.moonSign.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {chart.moonNakshatra.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {chart.moonNakshatra.chinese} · 第{chart.moonNakshatra.pada}足
            </div>
          </div>

          {/* Dasha start */}
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
              Mahadasha 大运
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: DASHA_COLORS[chart.dasha.birthLord] || '#7B61FF' }}>
              {chart.dasha.birthLord}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              出生起运
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              剩余 {chart.dasha.balance} 年
            </div>
          </div>
        </div>
      </div>

      {/* Planet positions table */}
      <div className="card mb-16" style={{ overflowX: 'auto' }}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: 14 }}>行星位置（恒星黄道）</h3>
        <table className="planet-table">
          <thead>
            <tr>
              <th>行星</th>
              <th>星座</th>
              <th>度数</th>
              <th>宫位</th>
              <th>星宿</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {chart.planets.map((p) => (
              <tr key={p.key}>
                <td>
                  <span style={{ marginRight: 4 }}>{p.icon}</span>
                  <span style={{ fontWeight: 600 }}>{p.chinese}</span>
                </td>
                <td>
                  {p.sign.emoji} {p.sign.name}
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {p.degreeStr}
                </td>
                <td style={{ fontWeight: 600 }}>
                  第{p.house}宫
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {p.nakshatra.chinese}
                </td>
                <td>
                  <span style={{
                    color: STATE_COLORS[p.state] || '#999',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}>
                    {STATE_EMOJIS[p.state]} {p.stateLabel}
                  </span>
                </td>
              </tr>
            ))}
            {/* Ascendant row */}
            <tr>
              <td><span style={{ fontWeight: 600 }}>⬆️ 上升</span></td>
              <td>{chart.ascendant.sign.emoji} {chart.ascendant.sign.name}</td>
              <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{chart.ascendant.degreeStr}</td>
              <td style={{ fontWeight: 600 }}>第1宫</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {chart.ascendant.nakshatra.chinese}
              </td>
              <td><span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Vimshottari Dasha timeline */}
      <div className="card mb-16" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: 14 }}>
          Vimshottari 大运（120年周期）
        </h3>

        {/* Timeline visualization */}
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 32, marginBottom: 14 }}>
          {chart.dasha.periods.slice(0, 7).map((p, i) => {
            const total = 120
            const width = (p.years / total * 100).toFixed(1)
            return (
              <div
                key={i}
                title={`${p.lord}: ${p.startAge}-${p.endAge}岁 (${p.years}年)`}
                style={{
                  width: width + '%',
                  background: DASHA_COLORS[p.lord] || '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  minWidth: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  borderRight: i < 6 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                }}
              >
                {width > 8 ? p.lord : ''}
              </div>
            )
          })}
        </div>

        {/* Dasha list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {chart.dasha.periods.map((p, i) => (
            <div
              key={i}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: i === 0 ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                border: i === 0 ? '1px solid var(--accent)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: DASHA_COLORS[p.lord] || '#999',
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  {p.lord}
                  {i === 0 && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--accent)', marginLeft: 4 }}>当前</span>
                  )}
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', paddingLeft: 14 }}>
                {p.startAge} – {p.endAge} 岁 · {p.years}年
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
          行星状态说明
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
          {Object.entries(STATE_EMOJIS).map(([state, emoji]) => (
            <span key={state} style={{ color: STATE_COLORS[state] || '#999' }}>
              {emoji} {({exalted:'庙旺', moolatrikona:'本源', own:'入庙', friendly:'友好', neutral:'中性', enemy:'敌对', debilitated:'落陷'})[state]}
            </span>
          ))}
        </div>
      </div>

      {coreSelf && (
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
              <div className="bazi-dayseal-stamp">{`${coreSelf.stamp}核心`}</div>
              <div className="bazi-dayseal-main">
                <span>{coreSelf.stamp[0] || '上'}</span>
                <span>{coreSelf.stamp[1] || '升'}</span>
              </div>
              <div className="bazi-dayseal-sub">恒星黄道结构 · 时间流解读</div>
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
                  <span>{term} · {VEDIC_TERM_KB[term]?.short || '术语标签'}</span>
                  <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
                </button>
              )
            })}
          </div>
          {openTerm && (
            <div className="bazi-term-panel">
              <div className="bazi-term-title">术语翻译：{openTerm}</div>
              <div className="bazi-term-content">
                {VEDIC_TERM_KB[openTerm]?.hint || `${openTerm}：建议与宫位和大运一起解读。`}
              </div>
            </div>
          )}
        </div>
      )}

      {reading && (
        <div className="card mt-24">
          <h3 style={{ marginBottom: 12 }}>二、先看结论（3条）</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reading.conclusions.map((c) => (
              <div key={c} className="reading-card">
                <div className="reading-card-content">{formatCardText(c, readingMode, { conciseSentences: 1 })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reading && (
        <div className="card mt-24">
          <h3 style={{ marginBottom: 12 }}>三、深度解读（按需展开）</h3>
          {[
            { key: 'core', title: '核心矩阵（上升、月亮、人格轴）', list: reading.coreMatrix },
            { key: 'state', title: '状态与能量（行星状态、宫位重心）', list: reading.stateEnergy },
            { key: 'dasha', title: '时间流（大运节奏）', list: reading.dashaFlow },
            { key: 'strategy', title: '实践策略（执行与预案）', list: reading.strategy },
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
        Lahiri岁差 + Meeus天文算法 · 27 Nakshatra · Vimshottari 120年大运 · 仅供娱乐参考
      </p>
    </div>
  )
}
