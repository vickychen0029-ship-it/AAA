import { useState } from 'react'
import { useAuth } from '../context/useAuth.js'

export default function Login() {
  const { login, register, loading } = useAuth()
  const [mode, setMode] = useState('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (mode === 'register') {
        await register(phone, password, nickname || null)
        setSuccess('注册成功，请直接登录')
        setMode('login')
        return
      }
      await login(phone, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 520, paddingTop: 56 }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 8 }}>账号登录</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
          使用手机号和密码登录，登录后仅可查看自己的档案与数据。
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setMode('login')}>
            登录
          </button>
          <button type="button" className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setMode('register')}>
            注册
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label>昵称（可选）</label>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="你的昵称" />
            </div>
          )}

          <div className="input-group">
            <label>手机号</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              required
            />
          </div>

          <div className="input-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少8位"
              minLength={8}
              required
            />
          </div>

          {error && <p style={{ color: '#b42318', fontSize: '0.8125rem', marginBottom: 10 }}>{error}</p>}
          {success && <p style={{ color: '#047857', fontSize: '0.8125rem', marginBottom: 10 }}>{success}</p>}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '提交中…' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}
