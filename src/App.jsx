import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth.js'
import { ProfileProvider } from './context/ProfileContext.jsx'
import { useProfile } from './context/useProfile.js'

const Home = lazy(() => import('./pages/Home.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Bazi = lazy(() => import('./pages/Bazi.jsx'))
const Ziwei = lazy(() => import('./pages/Ziwei.jsx'))
const Vedic = lazy(() => import('./pages/Vedic.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'))

const navGroups = [
  {
    id: 'east',
    title: '东方命理',
    items: [
      { to: '/bazi', icon: '☯️', label: '生辰八字' },
      { to: '/ziwei', icon: '🔮', label: '紫微斗数' },
      { to: '/liuyao', icon: '🪙', label: '六壬速卜' },
      { to: '/meihua', icon: '🌸', label: '梅花易数' },
      { to: '/dream-sign', icon: '🧿', label: '占梦问签' },
    ],
  },
  {
    id: 'global',
    title: '海外星命',
    items: [
      { to: '/zodiac', icon: '✨', label: '星座占星' },
      { to: '/vedic', icon: '🕉️', label: '印占占星' },
    ],
  },
]

const mobileNavItems = [
  { to: '/zodiac', icon: '✨', label: '星座' },
  { to: '/bazi', icon: '☯️', label: '八字' },
  { to: '/ziwei', icon: '🔮', label: '紫薇' },
  { to: '/vedic', icon: '🕉️', label: '印占' },
  { to: '/profile', icon: '👤', label: '档案' },
]

function Placeholder({ title }) {
  return (
    <div className="page">
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚧</div>
        <h1>{title}</h1>
        <p style={{ marginTop: 8 }}>功能开发中，敬请期待</p>
      </div>
    </div>
  )
}

function RouteLoading() {
  return (
    <div className="page">
      <div className="card subpage-empty">
        <p>页面加载中…</p>
      </div>
    </div>
  )
}

function buildProfileReport(profile) {
  if (!profile) return '暂无档案'
  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '未设置'
  const dstLabel = profile.dstMode === 'manual'
    ? `手动（${profile.isDST ? '是' : '否'}）`
    : '自动识别'

  return [
    '星座玄象 · 档案摘要',
    `昵称：${profile.nickname || '未设置'}`,
    `性别：${genderLabel}`,
    `出生日期：${profile.birthDate || '未设置'}`,
    `出生时间：${profile.birthHour}:${String(profile.birthMinute).padStart(2, '0')}`,
    `出生地点：${profile.birthPlace || '未设置'}`,
    `地理标准化：${profile.geo?.name || '未标准化'}`,
    `夏令时：${dstLabel}`,
    `现居地：${profile.currentPlace || '未设置'}`,
  ].join('\n')
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { profile, profiles, setCurrentProfile } = useProfile()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({
    east: false,
    global: false,
  })

  const activeGroupId = useMemo(() => {
    if (
      location.pathname.startsWith('/bazi') ||
      location.pathname.startsWith('/ziwei') ||
      location.pathname.startsWith('/liuyao') ||
      location.pathname.startsWith('/meihua') ||
      location.pathname.startsWith('/dream-sign')
    ) return 'east'
    if (location.pathname.startsWith('/zodiac') || location.pathname.startsWith('/vedic')) return 'global'
    return null
  }, [location.pathname])

  useEffect(() => {
    if (!activeGroupId) return
    setExpandedGroups((prev) => ({ ...prev, [activeGroupId]: true }))
  }, [activeGroupId])

  const avatarChar = useMemo(() => {
    const name = (profile?.nickname || '').trim()
    return name ? name[0] : '我'
  }, [profile])

  const copyReport = async () => {
    const report = buildProfileReport(profile)
    try {
      await navigator.clipboard.writeText(report)
      setReportCopied(true)
      setTimeout(() => setReportCopied(false), 1200)
    } catch {
      setReportCopied(false)
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🌙</div>
          <div>
            <div className="sidebar-brand-text">星座玄象</div>
            <div className="sidebar-brand-sub">探索命运的无限可能</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.id} className="sidebar-group">
              <button
                type="button"
                className={`sidebar-group-trigger ${expandedGroups[group.id] ? 'active' : ''}`}
                onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
              >
                <span className="sidebar-group-label">{group.title}</span>
                <span className={`sidebar-group-caret ${expandedGroups[group.id] ? 'expanded' : ''}`} aria-hidden>
                  ▾
                </span>
              </button>
              {expandedGroups[group.id] && (
                <div className="sidebar-group-items">
                  {group.items.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to}>
                      <span className="nav-icon">{icon}</span>
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

      </aside>

      <div className="main-content">
        <header className="app-header">
          <div className="app-header-right">
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary"
                style={{ height: 36, fontSize: '0.8125rem' }}
                onClick={() => setProfileMenuOpen((v) => !v)}
              >
                档案库
              </button>
              {profileMenuOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 42,
                    right: 0,
                    minWidth: 220,
                    maxWidth: 300,
                    padding: 8,
                    zIndex: 1000,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', padding: '4px 8px 6px' }}>
                    选择档案
                  </div>
                  {profiles.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`btn ${p.id === profile.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6, height: 36, fontSize: '0.8125rem' }}
                      onClick={() => {
                        setCurrentProfile(p.id)
                        setProfileMenuOpen(false)
                      }}
                    >
                      {p.nickname || `档案${idx + 1}`}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%', height: 36, fontSize: '0.8125rem' }}
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate('/profile')
                    }}
                  >
                    管理档案
                  </button>
                </div>
              )}
            </div>
            <button
              className={`btn ${reportCopied ? 'btn-secondary' : 'btn-primary'}`}
              style={{ height: 36, fontSize: '0.8125rem', padding: '0 14px' }}
              onClick={copyReport}
            >
              {reportCopied ? '已复制报告' : '生成报告'}
            </button>
            <button
              className="btn btn-secondary"
              style={{ height: 36, fontSize: '0.8125rem', padding: '0 14px' }}
              onClick={signOut}
            >
              退出登录
            </button>
            <div className="header-avatar">{avatarChar}</div>
          </div>
        </header>

        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/zodiac" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/zodiac" element={<Home />} />
            <Route path="/bazi" element={<Bazi />} />
            <Route path="/ziwei" element={<Ziwei />} />
            <Route path="/liuyao" element={<Placeholder title="六壬速卜" />} />
            <Route path="/meihua" element={<Placeholder title="梅花易数" />} />
            <Route path="/dream-sign" element={<Placeholder title="占梦问签" />} />
            <Route path="/vedic" element={<Vedic />} />
            <Route path="/synastry" element={<Placeholder title="合盘配对" />} />
            <Route path="/calendar" element={<Placeholder title="运势日历" />} />
            <Route path="/star-calendar" element={<Placeholder title="星象日历" />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Routes>
        </Suspense>
      </div>

      <nav className="bottom-nav">
        {mobileNavItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to}>
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function AuthedOrLoginApp() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <RouteLoading />

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    )
  }

  return (
    <ProfileProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ProfileProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthedOrLoginApp />
    </AuthProvider>
  )
}
