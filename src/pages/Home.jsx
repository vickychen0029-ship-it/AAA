import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import { sunLongitude } from '../calculations/astronomy/sun.js'
import { moonLongitude } from '../calculations/astronomy/moon.js'
import { planetLongitude } from '../calculations/astronomy/planets.js'
import { ascendant } from '../calculations/western/ascendant.js'
import { getSign } from '../calculations/western/signs.js'
import { resolveBirthLocation } from '../calculations/utils/location.js'
import { birthTimeToJulianDay } from '../calculations/utils/timezone.js'

const ZODIAC_EMOJIS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
const PLANET_COLORS = { sun: '#F97316', moon: '#3B82F6', mercury: '#8B5CF6', venus: '#E84393', mars: '#EF4444', jupiter: '#F59E0B', saturn: '#6366F1', uranus: '#06B6D4', neptune: '#6366F1', pluto: '#8B5CF6' }
const PLANET_ICONS = { sun: '☀️', moon: '🌙', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇' }
const PLANET_NAMES = { sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' }

const categoryLinks = [
  { path: '/zodiac', emoji: '✨', title: '星座', desc: '星盘 · 运势 · 性格', color: '#F97316' },
  { path: '/bazi', emoji: '☯️', title: '八字', desc: '四柱 · 五行 · 命理', color: '#8B5CF6' },
  { path: '/ziwei', emoji: '🔮', title: '紫薇', desc: '命盘 · 十二宫 · 星耀', color: '#E84393' },
  { path: '/vedic', emoji: '🕉️', title: '印占', desc: '星宿 · 吠陀 · 运程', color: '#00B894' },
]

function RadarChart({ elements }) {
  const size = 160, cx = size / 2, cy = size / 2, r = 60
  const count = elements.length
  const labels = ['火元素', '土元素', '风元素', '水元素']

  const points = elements.map((v, i) => {
    const a = (i * 360 / count - 90) * Math.PI / 180
    return { x: cx + r * (v / 100) * Math.cos(a), y: cy + r * (v / 100) * Math.sin(a) }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map((scale, l) => {
        const lr = r * scale
        const pts = Array.from({ length: count }, (_, i) => {
          const a = (i * 360 / count - 90) * Math.PI / 180
          return `${cx + lr * Math.cos(a)},${cy + lr * Math.sin(a)}`
        }).join(' ')
        return <polygon key={l} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
      })}
      {Array.from({ length: count }, (_, i) => {
        const a = (i * 360 / count - 90) * Math.PI / 180
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#E5E7EB" strokeWidth="0.5" />
      })}
      <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(123, 97, 255, 0.15)" stroke="#7B61FF" strokeWidth="1.5" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#7B61FF" />)}
      {labels.map((label, i) => {
        const a = (i * 360 / count - 90) * Math.PI / 180
        const lx = cx + (r + 22) * Math.cos(a), ly = cy + (r + 22) * Math.sin(a)
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#6B7280" fontWeight="500">{label}</text>
      })}
    </svg>
  )
}

function StarRating({ value, max = 5 }) {
  return (
    <span className="star-rating">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'star-filled' : 'star-empty'}>
          {i < value ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function AstrologyWheel({ placements, ascLongitude }) {
  const size = 220, cx = size / 2, cy = size / 2, outerR = 100, innerR = 70
  const signs = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼']

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={innerR - 20} fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        return <line key={i} x1={cx} y1={cy} x2={cx + outerR * Math.cos(a)} y2={cy + outerR * Math.sin(a)} stroke="#E5E7EB" strokeWidth="0.5" />
      })}
      {signs.map((_, i) => {
        const a = (i * 30 - 75) * Math.PI / 180
        return (
          <text key={i} x={cx + (outerR - 10) * Math.cos(a)} y={cy + (outerR - 10) * Math.sin(a)}
            textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#9CA3AF">{ZODIAC_EMOJIS[i]}</text>
        )
      })}
      {placements?.map((p, i) => {
        const a = (p.longitude - 90) * Math.PI / 180
        const pr = innerR - 12 + i * 3
        return <circle key={p.key} cx={cx + pr * Math.cos(a)} cy={cy + pr * Math.sin(a)} r="3.5" fill={PLANET_COLORS[p.key] || '#7B61FF'} />
      })}
      {ascLongitude != null && (() => {
        const a = (ascLongitude - 90) * Math.PI / 180
        return <text x={cx + (innerR + 10) * Math.cos(a)} y={cy + (innerR + 10) * Math.sin(a)} textAnchor="middle" fontSize="8" fill="#7B61FF" fontWeight="700">ASC</text>
      })()}
    </svg>
  )
}

function AspectMatrix() {
  const planets = ['日','月','水','金','火','木','土','天','海','冥','升','中']
  const colors = ['#EF4444','#10B981','#F59E0B','#3B82F6','#06B6D4','#8B5CF6']
  const matrix = [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [2,0,0,0,0,0,0,0,0,0,0,0],
    [4,1,0,0,0,0,0,0,0,0,0,0],
    [0,3,1,0,0,0,0,0,0,0,0,0],
    [5,0,2,2,0,0,0,0,0,0,0,0],
    [1,0,0,0,5,0,0,0,0,0,0,0],
    [4,0,0,2,0,1,0,0,0,0,0,0],
    [0,0,2,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,4,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,0],
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.625rem', margin: '0 auto' }}>
        <thead>
          <tr>
            <th style={{ padding: 2 }}></th>
            {planets.map(p => <th key={p} style={{ padding: '2px 4px', fontWeight: 500, color: 'var(--text-tertiary)' }}>{p}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={ri}>
              <td style={{ padding: '2px 4px', fontWeight: 500, color: 'var(--text-tertiary)' }}>{planets[ri]}</td>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: 2, textAlign: 'center' }}>
                  {cell > 0 ? <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors[cell - 1] }} /> : <span style={{ color: '#E5E7EB', fontSize: 8 }}>·</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, hasProfile } = useProfile()
  const [readingTab, setReadingTab] = useState('character')

  const astroData = useMemo(() => {
    if (!hasProfile || !profile.birthDate) return null
    const [y, m, d] = profile.birthDate.split('-').map(Number)
    const h = parseInt(profile.birthHour)
    const min = parseInt(profile.birthMinute) || 0
    const location = resolveBirthLocation(profile, y, m, d, h, min)
    const { lat, lng } = location
    const { jd } = birthTimeToJulianDay(profile, location, y, m, d, h, min)

    const ascLon = ascendant(jd, lat, lng)
    const sunLon = sunLongitude(jd)
    const moonLon = moonLongitude(jd)
    const mercuryLon = planetLongitude('mercury', jd)
    const venusLon = planetLongitude('venus', jd)
    const marsLon = planetLongitude('mars', jd)
    const jupiterLon = planetLongitude('jupiter', jd)
    const saturnLon = planetLongitude('saturn', jd)

    const placements = [
      { key: 'sun', longitude: sunLon, sign: getSign(sunLon) },
      { key: 'moon', longitude: moonLon, sign: getSign(moonLon) },
      { key: 'mercury', longitude: mercuryLon, sign: getSign(mercuryLon) },
      { key: 'venus', longitude: venusLon, sign: getSign(venusLon) },
      { key: 'mars', longitude: marsLon, sign: getSign(marsLon) },
      { key: 'jupiter', longitude: jupiterLon, sign: getSign(jupiterLon) },
      { key: 'saturn', longitude: saturnLon, sign: getSign(saturnLon) },
    ]

    return { placements, sunSign: getSign(sunLon), moonSign: getSign(moonLon), ascSign: getSign(ascLon), ascLon, jd }
  }, [hasProfile, profile])

  const elementScores = useMemo(() => {
    if (!astroData) return [25, 25, 35, 85]
    const e = astroData.sunSign.element
    return [
      e === '火' ? 85 : 25,
      e === '土' ? 80 : 25,
      e === '风' ? 75 : 35,
      e === '水' ? 70 : 85,
    ]
  }, [astroData])

  const fortune = useMemo(() => {
    const d = new Date()
    const seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) % 10
    return {
      love: [4, 3, 5, 4, 4, 3, 4, 5, 4, 3][seed],
      career: [4, 4, 4, 3, 5, 4, 4, 4, 3, 5][seed],
      wealth: [4, 5, 4, 4, 3, 4, 5, 4, 4, 3][seed],
      mood: [5, 4, 4, 5, 4, 3, 5, 4, 4, 5][seed],
      color: ['深海蓝', '紫罗兰', '金色', '白色', '翠绿', '珊瑚红', '银色', '玫瑰粉', '靛蓝', '橙金'][seed],
      number: [8, 3, 9, 2, 5, 7, 1, 4, 6, 11][seed],
      direction: ['北方', '东南', '西南', '正东', '西北', '正南', '东北', '正西', '正南', '正北'][seed],
      dos: ['学习、冥想、签约', '社交、展示、合作', '创造、启动、投资', '休息、反思、规划', '运动、旅行、探索', '整理、清理、断舍离', '阅读、写作、研究', '聚会、表达、分享', '独处、内省、疗愈', '尝试、冒险、突破'][seed],
      donts: ['冲动消费、熬夜', '过度思考、拖延', '急躁决策、争吵', '暴饮暴食、挥霍', '犹豫不决、逃避', '冲动购物、借贷', '过度担忧、猜疑', '消极抱怨、指责', '重大决定、签约', '固步自封、拒绝'][seed],
      advice: [
        '今天月亮与金星形成和谐相位，情感能量充沛，适合与朋友或伴侣建立更深交流。太阳与土星形成三分相，事业上稳扎稳打会有收获。',
        '火星能量强劲的一天，行动力十足。适合推进搁置的项目，但注意不要过于急躁。傍晚适合与家人共度温馨时光。',
        '创造力达到峰值，水星与木星的和谐相位带来清晰的思维和良好的表达能力。把握机会展示自己的想法。',
        '适合沉浸式工作和深度学习的一天。土星的能量帮助你专注细节。感情方面可能会有意想不到的惊喜。',
        '注意身体信号，适当放慢节奏。今天认识的人可能会成为未来重要的伙伴。保持开放和真诚的态度。',
        '适合断舍离，清理不需要的东西和人際关系。财务方面需要谨慎，避免冲动消费。晚上适合静心冥想。',
        '直觉很强的一天，相信自己的判断。与家人的互动会带来温暖的感受。工作中可能收到好消息。',
        '主动出击的好时机，无论是工作还是感情。会有贵人出现帮助你。保持积极乐观的心态。',
        '情绪可能有些波动，适合通过运动或艺术释放。避免做出重大决定，多听取他人意见。',
        '新的机会正在靠近，保持开放的心态。可以尝试一些平时不敢做的事情，会有意外收获。',
      ][seed],
    }
  }, [])

  if (!hasProfile) {
    return (
      <div className="page page-wide">
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🌙</div>
          <h1 style={{ marginBottom: 8 }}>星座玄象</h1>
          <p style={{ marginBottom: 24 }}>探索命运的无限可能</p>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            创建我的星盘档案
          </button>

          <div className="card-grid mt-24">
            {categoryLinks.map(({ path, emoji, title, desc, color }) => (
              <div key={path} className="card" onClick={() => navigate(path)} style={{ cursor: 'pointer' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: 14,
                }}>
                  {emoji}
                </div>
                <h3 style={{ marginBottom: 4 }}>{title}</h3>
                <p style={{ fontSize: '0.75rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-wide">
      <div className="page-section">
        <div className="grid-3">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>核心画像标签</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {astroData && (
                <>
                  <span className="tag tag-purple">{astroData.sunSign.element}元素主导</span>
                  <span className="tag tag-purple">太阳落{astroData.sunSign.name}</span>
                  <span className="tag tag-purple">群星{astroData.moonSign.name}</span>
                </>
              )}
            </div>
            <RadarChart elements={elementScores} />
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 12 }}>核心解读</div>
            <p style={{ lineHeight: 1.8, flex: 1 }}>
              你拥有强大的{astroData?.sunSign?.element || '水'}元素能量，
              太阳落在{astroData?.sunSign?.name || '天蝎座'}，
              月亮在{astroData?.moonSign?.name || '巨蟹座'}，
              上升{astroData?.ascSign?.name || '处女座'}赋予你独特的外在气质。
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>档案入口</div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              档案信息统一在“档案库”管理，支持新增、切换、编辑与删除。
            </p>
            <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '0.8125rem', height: 36 }}>
              打开档案库
            </Link>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-title">
          今日运势
          <span className="section-subtitle" style={{ fontWeight: 400 }}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
          </span>
        </div>

        <div className="grid-3">
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 16 }}>运势指数</div>
            <div className="fortune-items">
              {[
                { label: '爱情', value: fortune.love, icon: '💕' },
                { label: '事业', value: fortune.career, icon: '💼' },
                { label: '财富', value: fortune.wealth, icon: '💰' },
                { label: '心情', value: fortune.mood, icon: '😊' },
              ].map(item => (
                <div key={item.label} className="fortune-item">
                  <span className="fortune-item-label">{item.icon} {item.label}</span>
                  <StarRating value={item.value} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 16 }}>每日幸运法宝</div>
            <div className="lucky-grid">
              <div className="lucky-row"><span className="lucky-label">🎨 幸运色</span><span className="lucky-value">{fortune.color}</span></div>
              <div className="lucky-row"><span className="lucky-label">🔢 幸运数字</span><span className="lucky-value">{fortune.number}</span></div>
              <div className="lucky-row"><span className="lucky-label">🧭 幸运方位</span><span className="lucky-value">{fortune.direction}</span></div>
              <div className="lucky-row"><span className="lucky-label">✅ 今日宜</span><span className="lucky-value" style={{ color: '#10B981' }}>{fortune.dos}</span></div>
              <div className="lucky-row"><span className="lucky-label">❌ 今日忌</span><span className="lucky-value" style={{ color: '#EF4444' }}>{fortune.donts}</span></div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 12 }}>运势建议</div>
            <p style={{ lineHeight: 1.8, flex: 1 }}>{fortune.advice}</p>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-title">
          深度解读
          <Link to="/zodiac" className="more">查看全部 ›</Link>
        </div>

        <div className="tab-bar">
          {[
            { key: 'character', label: '性格密码（Big 3）' },
            { key: 'love', label: '爱情轨迹' },
            { key: 'career', label: '事业财富' },
            { key: 'destiny', label: '宿命课题' },
          ].map(tab => (
            <button
              key={tab.key}
              className={readingTab === tab.key ? 'active' : ''}
              onClick={() => setReadingTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div className="reading-card">
            <div className="reading-card-title">☀️ 太阳 · {astroData?.sunSign?.name}</div>
            <div className="reading-card-content">你拥有强烈的目标感与执行力，擅长持续推进复杂任务。</div>
          </div>
          <div className="reading-card">
            <div className="reading-card-title">🌙 月亮 · {astroData?.moonSign?.name}</div>
            <div className="reading-card-content">情感细腻，具备洞察他人的能力，需要稳定与安全的关系环境。</div>
          </div>
          <div className="reading-card">
            <div className="reading-card-title">⬆️ 上升 · {astroData?.ascSign?.name}</div>
            <div className="reading-card-content">外在表达理性克制，重视秩序，做事讲究方法和节奏。</div>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-title">
          专业星盘
          <span className="section-subtitle" style={{ fontWeight: 400 }}>Placidus宫制</span>
        </div>

        <div className="grid-3">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 12 }}>本命星盘</div>
            <AstrologyWheel placements={astroData?.placements} ascLongitude={astroData?.ascLon} />
            <button className="btn btn-secondary" style={{ marginTop: 12, fontSize: '0.75rem', height: 32 }}>全屏查看</button>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 12 }}>行星落点表</div>
            <table className="planet-table">
              <thead><tr><th>行星</th><th>星座</th><th>度数</th><th>状态</th></tr></thead>
              <tbody>
                {astroData?.placements.map(p => (
                  <tr key={p.key}>
                    <td><span className="planet-dot" style={{ background: PLANET_COLORS[p.key] || '#7B61FF' }} />{PLANET_ICONS[p.key]} {PLANET_NAMES[p.key]}</td>
                    <td>{p.sign.emoji} {p.sign.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.longitude.toFixed(1)}°</td>
                    <td style={{ color: '#10B981', fontSize: '0.75rem' }}>顺行</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 12 }}>相位分析</div>
            <AspectMatrix />
            <div className="aspect-legend" style={{ marginTop: 12 }}>
              {[
                { color: '#EF4444', label: '合相 0°' },
                { color: '#10B981', label: '三分相 120°' },
                { color: '#F59E0B', label: '四分相 90°' },
                { color: '#3B82F6', label: '对分相 180°' },
                { color: '#06B6D4', label: '六分相 60°' },
                { color: '#8B5CF6', label: '梅花相 150°' },
              ].map(a => (
                <div key={a.label} className="aspect-legend-item"><span className="aspect-legend-dot" style={{ background: a.color }} />{a.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="grid-2">
          <div className="cta-card-v2 card" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>💑</div>
            <div className="cta-title">合盘引导</div>
            <div className="cta-desc">想知道你和TA合不合？</div>
            <div className="cta-sub">添加他人档案，一键查看双人关系</div>
            <button className="btn btn-secondary" style={{ marginTop: 8 }}>添加他人档案</button>
          </div>

          <div className="cta-card-v2 card" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>🤖</div>
            <div className="cta-title">AI占星师</div>
            <div className="cta-desc">对报告有疑问？</div>
            <div className="cta-sub">让AI为你做深度命盘解读</div>
            <button className="btn btn-primary" style={{ marginTop: 8 }}>开始咨询</button>
          </div>
        </div>
      </div>
    </div>
  )
}
