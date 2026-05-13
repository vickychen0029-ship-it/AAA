import { useState } from 'react'
import { useProfile } from '../context/useProfile.js'

export default function Profile() {
  const {
    profile,
    profiles,
    setCurrentProfile,
    updateProfile,
    addProfile,
    deleteProfile,
    loading,
    error,
  } = useProfile()

  const [editing, setEditing] = useState(false)
  const [isNewDraft, setIsNewDraft] = useState(false)
  const [form, setForm] = useState({ ...profile, id: profile.id })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [geoWarn, setGeoWarn] = useState('')

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const startAddProfile = () => {
    setForm({
      id: '',
      nickname: '',
      gender: '',
      birthDate: '',
      birthHour: '12',
      birthMinute: '0',
      birthPlace: '',
      currentPlace: '',
      dstMode: 'auto',
      isDST: false,
      geo: null,
    })
    setIsNewDraft(true)
    setEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setGeoWarn('')

    try {
      const payload = { ...form }
      if (isNewDraft) {
        await addProfile(payload)
      } else {
        await updateProfile(payload)
      }

      setSaved(true)
      setIsNewDraft(false)
      setEditing(false)
      setTimeout(() => setSaved(false), 1200)
    } catch (err) {
      setGeoWarn(err instanceof Error ? err.message : '保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '未设置'
  const timeLabel = `${profile.birthHour}:${String(profile.birthMinute).padStart(2, '0')}`

  const infoItems = [
    { icon: '😊', label: '昵称', value: profile.nickname || '未设置' },
    { icon: '⚥', label: '性别', value: genderLabel },
    { icon: '📅', label: '出生日期', value: profile.birthDate || '未设置' },
    { icon: '🕐', label: '出生时间', value: profile.birthDate ? timeLabel : '未设置' },
    {
      icon: '🕰️',
      label: '夏令时',
      value: profile.dstMode === 'manual'
        ? `手动（${profile.isDST ? '是' : '否'}）`
        : '自动识别',
    },
    { icon: '📍', label: '出生地点', value: profile.birthPlace || '未设置' },
    { icon: '🧭', label: '地理标准化', value: profile.geo?.name || '未标准化' },
    { icon: '🏠', label: '现居地', value: profile.currentPlace || '未设置' },
  ]

  if (!editing) {
    return (
      <div className="page">
        <div className="page-header profile-head">
          <h1>👤 我的</h1>
          <p>档案管理与切换</p>
        </div>
        <div className="profile-hero mb-16">
          <div className="profile-hero-title">Profile Atelier</div>
          <div className="profile-hero-sub">以档案为中心管理排盘数据，支持多角色快速切换</div>
        </div>
        {loading && (
          <div className="card mb-16">
            <p>正在加载档案…</p>
          </div>
        )}
        {!!error && (
          <div className="card mb-16" style={{ borderColor: '#fecaca', background: '#fff7ed' }}>
            <p style={{ color: '#b42318' }}>加载失败：{error}</p>
          </div>
        )}

        <div className="card mb-16 profile-list-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3>档案列表</h3>
            <button type="button" className="btn btn-secondary" style={{ height: 34, fontSize: '0.75rem' }} onClick={startAddProfile}>
              + 新增档案
            </button>
          </div>
          <div className="profile-chip-list">
            {profiles.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`btn profile-chip ${p.id === profile.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setCurrentProfile(p.id)
                  setForm({ ...p })
                  setIsNewDraft(false)
                }}
              >
                {p.nickname || `档案${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div className="card text-center mb-16 profile-main-card" style={{ padding: '28px 24px' }}>
          <div className="profile-avatar-mark">
            👤
          </div>
          <h2 style={{ marginBottom: 4 }}>{profile.nickname || '未命名'}</h2>
          <p style={{ fontSize: '0.8125rem' }}>
            {profile.birthDate ? `${profile.birthDate} · ${genderLabel}` : '点击编辑完善档案'}
          </p>
        </div>

        {/* Info list */}
        <div className="card profile-info-card" style={{ padding: '4px 0', overflow: 'hidden' }}>
          {infoItems.map(({ icon, label, value }) => (
            <div
              key={label}
              className="profile-info-row"
            >
              <span className="profile-info-icon">{icon}</span>
              <span className="profile-info-label">{label}</span>
              <span className="profile-info-value">{value}</span>
            </div>
          ))}
          <div style={{ borderBottom: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            type="button"
            onClick={startAddProfile}
          >
            新增档案
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            type="button"
            onClick={() => { setForm({ ...profile, id: profile.id }); setIsNewDraft(false); setEditing(true) }}
          >
            编辑当前
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ marginTop: 10, color: '#b42318' }}
          onClick={async () => {
            const okToDelete = window.confirm('确认删除当前档案吗？删除后不可恢复。')
            if (!okToDelete) return
            try {
              const ok = await deleteProfile(profile.id)
              if (!ok) {
                window.alert('至少保留一份档案')
              }
            } catch (err) {
              window.alert(err instanceof Error ? err.message : '删除失败')
            }
          }}
        >
          删除当前档案
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header profile-head">
        <h1>{isNewDraft ? '👤 新增档案' : '👤 编辑档案'}</h1>
        <p>{isNewDraft ? '填写新档案信息' : `当前档案：${profile.nickname || '未命名'}`}</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card profile-form-card">
          <div className="input-group">
            <label>昵称</label>
            <input
              type="text"
              placeholder="你的昵称"
              value={form.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>性别</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'male', label: '男 ♂' },
                { value: 'female', label: '女 ♀' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`btn ${form.gender === value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => set('gender', form.gender === value ? '' : value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>出生日期（公历）</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
              required
            />
          </div>

          <div className="date-row">
            <div className="input-group">
              <label>时</label>
              <select value={form.birthHour} onChange={(e) => set('birthHour', e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}时</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>分</label>
              <select value={form.birthMinute} onChange={(e) => set('birthMinute', e.target.value)}>
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}分</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>夏令时模式</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={`btn ${form.dstMode !== 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, height: 44 }}
                  onClick={() => set('dstMode', 'auto')}
                >
                  自动
                </button>
                <button
                  type="button"
                  className={`btn ${form.dstMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, height: 44 }}
                  onClick={() => set('dstMode', 'manual')}
                >
                  手动
                </button>
              </div>
            </div>
          </div>

          {form.dstMode === 'manual' && (
            <div className="input-group">
              <label>夏令时（手动）</label>
              <button
                type="button"
                className={`btn ${form.isDST ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', height: 44 }}
                onClick={() => set('isDST', !form.isDST)}
              >
                {form.isDST ? '是' : '否'}
              </button>
            </div>
          )}

          <div className="input-group">
            <label>出生地点</label>
            <input
              type="text"
              placeholder="例如：北京"
              value={form.birthPlace}
              onChange={(e) => {
                set('birthPlace', e.target.value)
                if (geoWarn) setGeoWarn('')
              }}
              required
            />
            <p style={{ fontSize: '0.75rem', marginTop: 6, color: 'var(--text-tertiary)' }}>
              建议格式：城市 + 国家/省份（例：上海，中国 / Paris, France）
            </p>
            {geoWarn && (
              <p style={{ fontSize: '0.75rem', marginTop: 6, color: '#b45309' }}>
                {geoWarn}
              </p>
            )}
          </div>

          <div className="input-group">
            <label>现居地</label>
            <input
              type="text"
              placeholder="例如：上海"
              value={form.currentPlace}
              onChange={(e) => set('currentPlace', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                setEditing(false)
                setIsNewDraft(false)
                setForm({ ...profile, id: profile.id })
              }}
            >
              取消
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${saved ? 'btn-secondary' : ''}`}
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? '保存中…' : saved ? '✓ 已保存' : '保存'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
