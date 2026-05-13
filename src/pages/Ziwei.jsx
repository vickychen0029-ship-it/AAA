import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import AIInterviewPanel from '../components/AIInterviewPanel.jsx'
import { calculateZiweiChart } from '../calculations/ziwei/ziweiChart.js'
import {
  READING_MODES,
  ZIWEI_TERM_KB,
  formatCardText,
} from '../knowledge/readingKnowledge.js'

const BRIGHTNESS_COLORS = {
  '庙': '#EF4444',
  '旺': '#F97316',
  '得': '#F59E0B',
  '利': '#6366F1',
  '平': '#9CA3AF',
  '不': '#9CA3AF',
  '陷': '#6B7280',
}

const MUTAGEN_COLORS = {
  '禄': '#10B981',
  '权': '#F97316',
  '科': '#6366F1',
  '忌': '#EF4444',
}


function buildZiweiReading(result) {
  if (!result?.chart) return null

  const palaces = result.chart
  const mingPalace = palaces.find((p) => p.name?.includes('命'))
  const careerPalace = palaces.find((p) => p.name?.includes('官禄'))
  const wealthPalace = palaces.find((p) => p.name?.includes('财帛'))
  const relationPalace = palaces.find((p) => p.name?.includes('夫妻'))
  const migrationPalace = palaces.find((p) => p.name?.includes('迁移'))
  const illnessPalace = palaces.find((p) => p.name?.includes('疾厄'))
  const parentsPalace = palaces.find((p) => p.name?.includes('父母'))

  const majorStarCount = palaces.reduce((sum, p) => sum + (p.majorStars?.length || 0), 0)
  const mutagenCount = palaces.reduce((sum, p) => sum + (p.majorStars?.filter((s) => s.mutagen).length || 0), 0)
  const bodyCount = palaces.filter((p) => p.isBodyPalace).length

  const mingStars = mingPalace?.majorStars?.map((s) => s.name).slice(0, 3) || []
  const careerStars = careerPalace?.majorStars?.map((s) => s.name).slice(0, 3) || []
  const wealthStars = wealthPalace?.majorStars?.map((s) => s.name).slice(0, 3) || []
  const relationStars = relationPalace?.majorStars?.map((s) => s.name).slice(0, 3) || []
  const migrationStars = migrationPalace?.majorStars?.map((s) => s.name).slice(0, 2) || []
  const illnessStars = illnessPalace?.majorStars?.map((s) => s.name).slice(0, 2) || []
  const parentStars = parentsPalace?.majorStars?.map((s) => s.name).slice(0, 2) || []

  const allMutagens = palaces.flatMap((p) => (p.majorStars || []).map((s) => s.mutagen).filter(Boolean))
  const mutagenCounts = { 禄: 0, 权: 0, 科: 0, 忌: 0 }
  for (const m of allMutagens) {
    if (mutagenCounts[m] != null) mutagenCounts[m] += 1
  }
  const dominantMutagen = Object.entries(mutagenCounts).sort((a, b) => b[1] - a[1])[0][0]

  const base =
    mingStars.length > 0
      ? `命宫主星以${mingStars.join('、')}为核心，你做判断时更依赖主观感受与价值排序。`
      : '命宫主星分布偏散，人生节奏更像“边走边定”，早期多尝试反而是优势。'

  const career =
    careerStars.length > 0
      ? `官禄宫见${careerStars.join('、')}，职业路径适合“先专业深耕，再放大影响力”。`
      : '官禄宫主星不重，职业更适合项目制与多线程成长，不必拘泥单一路径。'

  const wealth =
    wealthStars.length > 0
      ? `财帛宫出现${wealthStars.join('、')}，财富累积依赖能力兑现与节奏管理，宜做长期可复利投入。`
      : '财帛宫偏轻，财务策略上建议“先稳现金流，再做风险资产配置”。'

  const relation =
    relationStars.length > 0
      ? `夫妻宫带${relationStars.join('、')}，关系里你更看重“信任与共识”，沟通重在节奏与边界。`
      : '夫妻宫讯号不集中，感情上建议以“价值观匹配 + 生活方式匹配”为第一筛选条件。'

  const action =
    mutagenCount >= 8
      ? '四化信息较密，阶段性波动会更明显。建议把年度目标拆到季度，用复盘替代焦虑。'
      : '四化分布较匀，属于可持续推进型命盘。建议持续做一个核心能力的深度升级。'

  const mobility = migrationStars.length > 0
    ? `迁移宫见${migrationStars.join('、')}，外部环境变化会明显影响你的发挥，跨城/跨团队机会值得主动争取。`
    : '迁移宫主星偏少，外部变化不是主变量，关键在内部执行质量与节奏稳定。'

  const health = illnessStars.length > 0
    ? `疾厄宫有${illnessStars.join('、')}，提醒你把“恢复力管理”放在优先级前列，避免长期透支。`
    : '疾厄宫信号不强，健康课题更多来自作息与压力管理，保持规律即可。'

  const support = parentStars.length > 0
    ? `父母宫出现${parentStars.join('、')}，贵人与支持系统常以“制度/资源/长辈建议”形式出现。`
    : '父母宫信息分散，支持系统更依赖自建网络，建议主动经营合作关系。'

  const mutagenLine =
    dominantMutagen === '禄' ? '化禄信号更显著，资源与机会导向强。' :
    dominantMutagen === '权' ? '化权信号更显著，掌控与执行导向强。' :
    dominantMutagen === '科' ? '化科信号更显著，口碑与专业背书导向强。' :
    '化忌信号更显著，提醒你在关键决策前做更充分的风险预案。'
  const mingBrightness = mingPalace?.majorStars?.map((s) => `${s.name}${s.brightness ? `[${s.brightness}]` : ''}`) || []
  const careerBrightness = careerPalace?.majorStars?.map((s) => `${s.name}${s.brightness ? `[${s.brightness}]` : ''}`) || []
  const wealthBrightness = wealthPalace?.majorStars?.map((s) => `${s.name}${s.brightness ? `[${s.brightness}]` : ''}`) || []
  const relationBrightness = relationPalace?.majorStars?.map((s) => `${s.name}${s.brightness ? `[${s.brightness}]` : ''}`) || []

  const brightnessCounts = { 庙: 0, 旺: 0, 得: 0, 利: 0, 平: 0, 不: 0, 陷: 0 }
  for (const palace of palaces) {
    for (const star of palace.majorStars || []) {
      if (star.brightness && brightnessCounts[star.brightness] != null) brightnessCounts[star.brightness] += 1
    }
  }

  const bodyPalace = palaces.find((p) => p.isBodyPalace)
  const bodyStars = bodyPalace?.majorStars?.map((s) => s.name).slice(0, 3) || []

  const coreMatrix = [
    {
      title: '1. 命宫主轴（人格底盘）',
      content: `${base}${mingBrightness.length > 0 ? `命宫亮度：${mingBrightness.join('、')}。亮度高时相关能力更容易落地；亮度偏平陷时，更适合用方法论稳步激活。` : '命宫更偏多线整合，适合边做边收敛主线。'}`,
    },
    {
      title: '2. 身宫落点（行动方式）',
      content: bodyPalace
        ? `身宫在${bodyPalace.name}（${bodyPalace.branch}），你更可能在该主题亲自上场。${bodyStars.length > 0 ? `主星有${bodyStars.join('、')}，执行力更容易转成结果。` : '主星不密集，更适合稳步推进。'}`
        : '身宫信息不完整，建议结合大限与流年再做阶段细化。',
    },
    {
      title: '3. 事业-财富联动',
      content: `${career}${wealth}${careerBrightness.length > 0 || wealthBrightness.length > 0 ? `官禄亮度：${careerBrightness.join('、') || '无'}；财帛亮度：${wealthBrightness.join('、') || '无'}。这组联动对应“能力变收入”的效率。` : ''}`,
    },
    {
      title: '4. 关系-迁移联动',
      content: `${relation}${mobility}${relationBrightness.length > 0 ? `夫妻宫亮度：${relationBrightness.join('、')}。亮度偏强时推进更快，偏弱时更适合慢节奏建立信任。` : ''}`,
    },
  ]

  const stateEnergy = [
    {
      title: '1. 主星密度与阶段波动',
      content: `主星约${majorStarCount}颗、四化约${mutagenCount}处、身宫标记${bodyCount}处。密度高时议题更集中，密度低时路径更灵活，建议先定优先级再推进。`,
    },
    {
      title: '2. 四化能量分布',
      content: `四化：禄${mutagenCounts.禄}/权${mutagenCounts.权}/科${mutagenCounts.科}/忌${mutagenCounts.忌}。${mutagenLine}这组更适合用来分配精力：先抓主轴，再补短板。`,
    },
    {
      title: '3. 亮度状态（庙旺平陷）',
      content: `亮度：庙${brightnessCounts.庙}、旺${brightnessCounts.旺}、得${brightnessCounts.得}、利${brightnessCounts.利}、平${brightnessCounts.平 + brightnessCounts.不}、陷${brightnessCounts.陷}。庙旺多反馈快，平陷多更依赖复盘。`,
    },
    {
      title: '4. 健康与恢复力',
      content: `${health}长期表现更取决于恢复力：稳定作息、压力卸载、周期复盘要一起做。`,
    },
  ]

  const deepLogic = [
    {
      title: '1. 三方主题协同（命·官·财）',
      content: '重点不是单宫好坏，而是命宫、官禄、财帛能否形成“定位→兑现→沉淀”闭环。若长期脱节，你更可能出现忙碌却不增值的消耗感。',
    },
    {
      title: '2. 关系与支持系统',
      content: `${support}遇到转折或迁移时，支持系统质量通常比短期机会更关键，建议提前经营高信任协作圈。`,
    },
    {
      title: '3. 决策模式校准',
      content: '化权与化忌并存时，你更可能出现“执行快、复盘慢”。建议固定四步法：目标、动作、反馈、修正，把波动转成可管理节奏。',
    },
  ]

  const strategy = [
    {
      title: '1. 90天行动策略',
      content: `${action}建议用“1个主项目 + 2个支撑动作”：主项目抓结果，支撑动作稳现金流和能力升级。`,
    },
    {
      title: '2. 关系策略',
      content: '关系层面优先筛选“价值观一致 + 节奏兼容”。比起短期热度，更关键是能否共同承担现实目标。',
    },
    {
      title: '3. 风险预案',
      content: '出现内耗信号（睡眠差、沟通急、决策散）时，先降速再优化，避免在高噪音阶段做不可逆决定。',
    },
  ]

  const conclusions = [
    `主轴结论：命宫以${mingStars.join('、') || '多线整合'}为核心，你更可能在明确价值排序后发挥更稳。`,
    `节奏结论：四化以化${dominantMutagen}更突出，当前更可能在“先抓主线、再做扩张”时效率更高。`,
    `关系结论：${relationStars.length > 0 ? `夫妻宫见${relationStars.join('、')}，你更可能在信任和节奏一致时进入高质量协作。` : '关系宫信号分散，你更可能通过慢筛选建立长期关系。'}`,
  ]

  return { coreMatrix, stateEnergy, deepLogic, strategy, conclusions }
}

function buildZiweiCoreModule(result) {
  if (!result?.chart) return null

  const palaces = result.chart
  const mingPalace = palaces.find((p) => p.name?.includes('命'))
  const bodyPalace = palaces.find((p) => p.isBodyPalace)
  const relationPalace = palaces.find((p) => p.name?.includes('夫妻'))
  const mingStars = mingPalace?.majorStars?.map((s) => s.name).slice(0, 2).join('、') || '未聚焦'
  const relationStars = relationPalace?.majorStars?.map((s) => s.name).slice(0, 2).join('、') || '未聚焦'

  const allMutagens = palaces.flatMap((p) => (p.majorStars || []).map((s) => s.mutagen).filter(Boolean))
  const mutagenCounts = { 禄: 0, 权: 0, 科: 0, 忌: 0 }
  for (const m of allMutagens) {
    if (mutagenCounts[m] != null) mutagenCounts[m] += 1
  }
  const dominantMutagen = Object.entries(mutagenCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '禄'

  return {
    profession: [
      { label: '命宫主位', value: mingPalace?.name || '未定位' },
      { label: '身宫主位', value: bodyPalace?.name || '未定位' },
      { label: '命宫主星', value: mingStars },
      { label: '关系宫主星', value: relationStars },
    ],
    plain: [
      {
        title: `【命宫：${mingPalace?.name || '-'}】你的人生底盘`,
        content: `命宫像“人生操作系统”。命宫主星为${mingStars}时，你更可能先确认价值排序，再投入执行。`,
      },
      {
        title: `【身宫：${bodyPalace?.name || '-'}】你的行动引擎`,
        content: `身宫像“自动奔向的战场”。它提示你更可能在哪类议题亲自上场，把想法变成结果。`,
      },
      {
        title: `【四化主轴：化${dominantMutagen}】你的阶段策略`,
        content: `当前更突出的是化${dominantMutagen}，你更可能需要围绕“${dominantMutagen === '禄' ? '资源机会' : dominantMutagen === '权' ? '掌控执行' : dominantMutagen === '科' ? '口碑专业' : '风险管理'}”配置精力。`,
      },
    ],
    terms: ['命宫', '身宫', '化禄', '化权', '化科', '化忌', '夫妻宫'],
    stamp: '命宫',
  }
}

export default function Ziwei() {
  const { profile, hasProfile } = useProfile()
  const [readingMode, setReadingMode] = useState('standard')
  const [openTerm, setOpenTerm] = useState('')
  const [openLongSection, setOpenLongSection] = useState('')

  const result = useMemo(() => {
    if (!hasProfile) return null
    try {
      return calculateZiweiChart(profile)
    } catch {
      return null
    }
  }, [hasProfile, profile])

  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : ''
  const timeLabel = `${profile.birthHour}:${String(profile.birthMinute || 0).padStart(2, '0')}`
  const reading = buildZiweiReading(result)
  const coreSelf = buildZiweiCoreModule(result)
  const interviewPayload = useMemo(() => {
    if (!result?.chart) return null
    const findPalace = (namePart) => result.chart.find((p) => p.name?.includes(namePart))
    const pickStars = (palace) => (palace?.majorStars || []).slice(0, 4).map((s) => ({
      name: s.name,
      brightness: s.brightness || '',
      mutagen: s.mutagen || '',
    }))
    return {
      lunar_date: result.lunarDate || '',
      bureau: result.bureau || '',
      ming_palace: result.soulBranch || '',
      body_palace: result.bodyBranch || '',
      core_palaces: {
        ming: pickStars(findPalace('命')),
        career: pickStars(findPalace('官禄')),
        wealth: pickStars(findPalace('财帛')),
        relation: pickStars(findPalace('夫妻')),
        health: pickStars(findPalace('疾厄')),
      },
    }
  }, [result])

  if (!hasProfile) {
    return (
      <div className="page page-wide ziwei-page">
        <div className="page-header">
          <h1>🔮 紫微斗数</h1>
          <p>紫微斗数命盘排盘</p>
        </div>
        <div className="card subpage-empty">
          <p>尚未创建档案</p>
          <Link to="/profile" className="btn btn-primary">创建档案</Link>
        </div>
      </div>
    )
  }

  if (!result || !result.chart) {
    return (
      <div className="page page-wide ziwei-page">
        <div className="page-header">
          <h1>🔮 紫微斗数</h1>
          <p>紫微斗数命盘排盘</p>
        </div>
        <div className="card subpage-empty">
          <p>计算遇到问题，请检查出生日期是否在1900-2100范围内</p>
          <Link to="/profile" className="btn btn-primary">检查档案</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-wide ziwei-page">
      <div className="page-header">
        <h1>🔮 紫微斗数</h1>
        <p>Powered by iztro · 实时排盘</p>
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
        systemType="ziwei"
        profile={profile}
        payload={interviewPayload}
        title="命盘深度访谈解析"
      />

      {/* Summary card */}
      <div className="card mb-16" style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>农历</span>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{result.lunarDate || '-'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>五行局</span>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{result.bureau || '-'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>命宫</span>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {result.soulBranch ? `命宫在${result.soulBranch}` : '-'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>身宫</span>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {result.bodyBranch ? `身宫在${result.bodyBranch}` : '-'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>八字</span>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {result.chineseDate || '-'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>生肖 · 星座</span>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {result.zodiac || '-'} · {result.sign || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Star chart - 12 palaces */}
      <div className="result-card mb-16">
        <h3 style={{ textAlign: 'center', marginBottom: 16 }}>紫微命盘</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {result.chart.map((palace, i) => {
            const isBody = palace.isBodyPalace

            return (
              <div
                key={i}
                style={{
                  background: isBody ? '#fef3c7' : 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 6px',
                  border: isBody ? '1.5px solid #F59E0B' : '0.5px solid var(--separator)',
                  textAlign: 'center',
                }}
              >
                {/* Palace name */}
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  marginBottom: 1,
                }}>
                  {palace.branch} · {palace.stem}
                </div>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 4,
                }}>
                  {palace.name}
                  {isBody && <span style={{ fontSize: '0.625rem', color: '#F59E0B', marginLeft: 3 }}>⊗身</span>}
                </div>

                {/* Major stars */}
                {palace.majorStars.length > 0 ? (
                  <div style={{ marginBottom: 3 }}>
                    {palace.majorStars.map((s, si) => (
                      <div key={si} style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5 }}>
                        {s.name}
                        {s.mutagen && (
                          <span style={{
                            fontSize: '0.625rem',
                            color: MUTAGEN_COLORS[s.mutagen] || '#999',
                            marginLeft: 2,
                            fontWeight: 700,
                          }}>
                            {s.mutagen}
                          </span>
                        )}
                        {s.brightness && (
                          <span style={{
                            fontSize: '0.5625rem',
                            color: BRIGHTNESS_COLORS[s.brightness] || '#999',
                            marginLeft: 2,
                          }}>
                            [{s.brightness}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#d0d0d0', marginBottom: 3 }}>
                    —
                  </div>
                )}

                {/* Minor stars */}
                {palace.minorStars.length > 0 && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {palace.minorStars.map((s, si) => (
                      <span key={si}>
                        {si > 0 && ' · '}
                        {s.name}
                        {s.brightness && (
                          <span style={{
                            fontSize: '0.5625rem',
                            color: BRIGHTNESS_COLORS[s.brightness] || '#999',
                          }}>
                            [{s.brightness}]
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Adjective stars */}
                {palace.adjectiveStars.length > 0 && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: 2 }}>
                    {palace.adjectiveStars.join(' · ')}
                  </div>
                )}

                {/* Chángshēng + Decadal */}
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: 3 }}>
                  {palace.changsheng}
                  {palace.decadal && ` · ${palace.decadal.start}-${palace.decadal.end}岁`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
          图例说明
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
          <span>⊗ 身宫</span>
          <span style={{ color: '#10B981' }}>禄</span>
          <span style={{ color: '#F97316' }}>权</span>
          <span style={{ color: '#6366F1' }}>科</span>
          <span style={{ color: '#EF4444' }}>忌</span>
          <span style={{ color: '#EF4444' }}>庙</span>
          <span style={{ color: '#F97316' }}>旺</span>
          <span style={{ color: '#F59E0B' }}>得</span>
          <span style={{ color: '#6366F1' }}>利</span>
          <span style={{ color: '#9CA3AF' }}>平/不</span>
          <span style={{ color: '#6B7280' }}>陷</span>
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
                <span>{coreSelf.stamp[0] || '命'}</span>
                <span>{coreSelf.stamp[1] || '宫'}</span>
              </div>
              <div className="bazi-dayseal-sub">术语背书 + 现实可感知表达</div>
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
                  <span>{term} · {ZIWEI_TERM_KB[term]?.short || '术语标签'}</span>
                  <span className="bazi-term-arrow">{isOpen ? '−' : '+'}</span>
                </button>
              )
            })}
          </div>
          {openTerm && (
            <div className="bazi-term-panel">
              <div className="bazi-term-title">术语翻译：{openTerm}</div>
              <div className="bazi-term-content">
                {ZIWEI_TERM_KB[openTerm]?.hint || `${openTerm}：请结合全盘结构看，不单独下结论。`}
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
            { key: 'core', title: '核心矩阵（命宫、身宫、宫位联动）', list: reading.coreMatrix },
            { key: 'state', title: '状态与能量（四化、亮度、恢复力）', list: reading.stateEnergy },
            { key: 'logic', title: '底层逻辑（三方协同）', list: reading.deepLogic },
            { key: 'strategy', title: '实践策略（90天行动）', list: reading.strategy },
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
        Powered by iztro · 仅供娱乐参考
      </p>
    </div>
  )
}
