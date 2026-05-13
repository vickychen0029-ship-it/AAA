import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/useProfile.js'
import AIInterviewPanel from '../components/AIInterviewPanel.jsx'
import { sunLongitude } from '../calculations/astronomy/sun.js'
import { moonLongitude } from '../calculations/astronomy/moon.js'
import { planetLongitude, junoLongitude } from '../calculations/astronomy/planets.js'
import { northNodeLongitude } from '../calculations/astronomy/northNode.js'
import { ascendant } from '../calculations/western/ascendant.js'
import { getSign } from '../calculations/western/signs.js'
import { resolveBirthLocation } from '../calculations/utils/location.js'
import { birthTimeToJulianDay } from '../calculations/utils/timezone.js'
import { createNatalChart } from '../services/chartsApi.js'

const planetDefs = [
  {
    key: 'sun',
    icon: '☀️',
    label: '太阳',
    calc: (jd) => sunLongitude(jd),
    descTemplate: (s) => `太阳星座代表你的核心自我与外在人格，落在${s.name}意味着你天生具备${s.element}象特质的能量。`,
  },
  {
    key: 'moon',
    icon: '🌙',
    label: '月亮',
    calc: (jd) => moonLongitude(jd),
    descTemplate: (s) => `月亮掌管你的情绪与潜意识，月亮${s.name}让你的内心世界充满${s.element}象的感知方式。`,
  },
  {
    key: 'rising',
    icon: '⬆️',
    label: '上升',
    calc: null, // special case - computed from ASC
    descTemplate: (s) => `上升星座是你给外界的第一印象，上升${s.name}让你在人群中展现出${s.element}象的气质。`,
  },
  {
    key: 'mercury',
    icon: '☿️',
    label: '水星',
    calc: (jd) => planetLongitude('mercury', jd),
    descTemplate: (s) => `水星主宰思维与沟通方式，水星${s.name}赋予你${s.element}象特质的表达和思考模式。`,
  },
  {
    key: 'venus',
    icon: '♀️',
    label: '金星',
    calc: (jd) => planetLongitude('venus', jd),
    descTemplate: (s) => `金星影响你的爱情观与审美，金星${s.name}让你在感情中追求${s.element}象的感受。`,
  },
  {
    key: 'mars',
    icon: '♂️',
    label: '火星',
    calc: (jd) => planetLongitude('mars', jd),
    descTemplate: (s) => `火星代表行动力与欲望，火星${s.name}让你以${s.element}象的方式去争取和竞争。`,
  },
  {
    key: 'northNode',
    icon: '☊',
    label: '北交',
    calc: (jd) => northNodeLongitude(jd),
    descTemplate: (s) => `北交点指向你今生的成长方向，北交${s.name}引导你发展${s.element}象的灵魂课题。`,
  },
  {
    key: 'juno',
    icon: '💍',
    label: '婚神',
    calc: (jd) => junoLongitude(jd),
    descTemplate: (s) => `婚神星揭示你的婚姻与伴侣关系模式，婚神${s.name}适合寻找具有${s.element}象特质的伴侣。`,
  },
]

export default function Zodiac() {
  const { profile, hasProfile } = useProfile()
  const [backendChartResult, setBackendChartResult] = useState({
    key: '',
    status: 'idle',
    message: '',
  })
  const chartGeo = profile.geo || null
  const canSyncBackendChart = Boolean(
    hasProfile
    && profile.id
    && chartGeo?.birthUtc
    && Number.isFinite(chartGeo?.lat)
    && Number.isFinite(chartGeo?.lng),
  )

  const placements = useMemo(() => {
    if (!hasProfile || !profile.birthDate) return null

    const [y, m, d] = profile.birthDate.split('-').map(Number)
    const h = parseInt(profile.birthHour)
    const min = parseInt(profile.birthMinute)

    const location = resolveBirthLocation(profile, y, m, d, h, min)
    const { lat, lng } = location
    const utcFromProfileMs = chartGeo?.birthUtc ? Date.parse(chartGeo.birthUtc) : NaN
    const jd = Number.isFinite(utcFromProfileMs)
      ? (utcFromProfileMs / 86400000 + 2440587.5)
      : birthTimeToJulianDay(profile, location, y, m, d, h, min).jd

    // Compute ASC separately
    const ascLon = ascendant(jd, lat, lng)

    return planetDefs.map((def) => {
      let lon
      if (def.key === 'rising') {
        lon = ascLon
      } else {
        lon = def.calc(jd)
      }
      const sign = getSign(lon)
      return {
        ...def,
        sign,
        longitude: lon,
        desc: def.descTemplate(sign),
      }
    })
  }, [hasProfile, profile, chartGeo?.birthUtc])

  const backendSyncKey = useMemo(() => {
    if (!canSyncBackendChart) return ''
    return `${profile.id}|${chartGeo.birthUtc}|${chartGeo.lat}|${chartGeo.lng}`
  }, [canSyncBackendChart, profile.id, chartGeo])

  useEffect(() => {
    if (!canSyncBackendChart) {
      return
    }

    let canceled = false

    createNatalChart({
      profile_id: profile.id,
      birth_utc_dt: chartGeo.birthUtc,
      geo: {
        lat: chartGeo.lat,
        lng: chartGeo.lng,
      },
      house_system: 'P',
    })
      .then(() => {
        if (canceled) return
        setBackendChartResult({
          key: backendSyncKey,
          status: 'success',
          message: '高精度星盘已同步',
        })
      })
      .catch((err) => {
        if (canceled) return
        const detail = err instanceof Error ? err.message : '后端排盘失败'
        setBackendChartResult({
          key: backendSyncKey,
          status: 'error',
          message: `后端排盘失败，已自动使用本地算法继续展示（${detail}）`,
        })
      })

    return () => {
      canceled = true
    }
  }, [backendSyncKey, canSyncBackendChart, profile.id, chartGeo])

  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : ''
  const timeLabel = `${profile.birthHour}:${String(profile.birthMinute).padStart(2, '0')}`
  const interviewPayload = useMemo(() => {
    if (!placements || placements.length === 0) return null
    const core = Object.fromEntries(
      placements.map((p) => [p.key, { label: p.label, sign: p.sign.name, element: p.sign.element, longitude: Number(p.longitude.toFixed(3)) }]),
    )
    return {
      sun_sign: core.sun?.sign || '',
      moon_sign: core.moon?.sign || '',
      rising_sign: core.rising?.sign || '',
      profile: {
        gender: profile.gender,
        birth_place: profile.birthPlace || '',
      },
      placements: core,
    }
  }, [placements, profile.gender, profile.birthPlace])

  if (!hasProfile) {
    return (
      <div className="page page-wide zodiac-page">
        <div className="page-header">
          <h1>✨ 星座</h1>
          <p>基于档案信息自动生成你的星盘</p>
        </div>
        <div className="card subpage-empty">
          <p>尚未创建档案</p>
          <Link to="/profile" className="btn btn-primary">创建档案</Link>
        </div>
      </div>
    )
  }

  const sunPlacement = placements?.find((p) => p.key === 'sun')
  const backendStatus = !canSyncBackendChart
    ? 'idle'
    : (backendChartResult.key === backendSyncKey ? backendChartResult.status : 'loading')
  const backendMessage = backendStatus === 'loading'
    ? '正在同步高精度星盘计算…'
    : backendChartResult.message

  return (
    <div className="page page-wide zodiac-page">
      <div className="page-header zodiac-head">
        <h1>✨ 我的星盘</h1>
        <p>基于天文算法 + 你的出生信息实时计算</p>
      </div>
      <div className="zodiac-hero mb-16">
        <div className="zodiac-hero-title">Celestial Snapshot</div>
        <div className="zodiac-hero-sub">本命星体已对齐，以下是你的核心天象分布</div>
        <div className="zodiac-hero-chips">
          <span>本命盘</span>
          <span>上升定位</span>
          <span>七行星</span>
          <span>交点与婚神</span>
        </div>
      </div>

      <AIInterviewPanel
        systemType="zodiac"
        profile={profile}
        payload={interviewPayload}
        title="命盘深度访谈解析"
      />

      {canSyncBackendChart && backendStatus !== 'idle' && (
        <div className={`card mb-16 zodiac-status ${backendStatus === 'error' ? 'is-error' : ''}`}>
          <p style={{ fontSize: '0.8125rem' }}>
            {backendMessage}
          </p>
        </div>
      )}

      {/* Profile badge */}
      <div className="card profile-badge mb-16">
        <span style={{ fontSize: '1rem' }}>👤</span>
        <span className="profile-badge-meta">
          {profile.nickname} · {genderLabel} · {profile.birthDate} {timeLabel}
          {profile.birthPlace ? ` · ${profile.birthPlace}` : ''}
          {profile.dstMode === 'manual'
            ? ` · 夏令时（手动${profile.isDST ? '是' : '否'}）`
            : ' · 夏令时自动'}
        </span>
        <Link to="/profile" className="profile-badge-link">编辑</Link>
      </div>

      {/* Sun sign hero */}
      {sunPlacement && (
        <div className="card text-center mb-16 zodiac-sun-card" style={{ padding: '28px 24px' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 8 }}>{sunPlacement.sign.emoji}</span>
          <h2 style={{ marginBottom: 4 }}>太阳{sunPlacement.sign.name}</h2>
          <p style={{ fontSize: '0.8125rem' }}>{sunPlacement.sign.element}象星座</p>
        </div>
      )}

      {/* Planetary placements list */}
      <div className="zodiac-list">
        {placements?.map((p) => (
          <div
            key={p.key}
            className="card zodiac-item"
          >
            <div className={`zodiac-item-icon ${p.key === 'sun' ? 'is-sun' : ''}`}>
              {p.icon}
            </div>
            <div className="zodiac-item-body">
              <div className="zodiac-item-top">
                <span className="zodiac-item-label">{p.label}</span>
                <span className="zodiac-item-emoji">{p.sign.emoji}</span>
                <span className="zodiac-item-sign">
                  {p.sign.name}
                </span>
              </div>
              <p className="zodiac-item-desc">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="page-note">
        基于 Meeus 天文算法实时计算 · 仅供娱乐参考
      </p>
    </div>
  )
}
