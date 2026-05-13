import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '../services/api.js'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('smweb_access_token') || ''
      const res = await fetch(`${getApiBaseUrl()}/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : []
      if (!res.ok) throw new Error(data?.detail || `加载失败：${res.status}`)
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let canceled = false
    const run = async () => {
      if (canceled) return
      await loadUsers()
    }
    run()
    return () => { canceled = true }
  }, [])

  const toggleActive = async (userId, current) => {
    try {
      const token = localStorage.getItem('smweb_access_token') || ''
      const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/active?is_active=${String(!current)}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) throw new Error(data?.detail || `更新失败：${res.status}`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  return (
    <div className="page page-wide">
      <div className="page-header">
        <h1>👮 账号管理</h1>
        <p>仅管理员可见。可查看账号和启停状态。</p>
      </div>

      {loading && <div className="card">加载中…</div>}
      {error && <div className="card" style={{ color: '#b42318' }}>{error}</div>}

      {!loading && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="planet-table">
            <thead>
              <tr>
                <th>手机号</th>
                <th>昵称</th>
                <th>管理员</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.username || '-'}</td>
                  <td>{u.is_superuser ? '是' : '否'}</td>
                  <td>{u.is_active ? '启用' : '停用'}</td>
                  <td>
                    {!u.is_superuser && (
                      <button className="btn btn-secondary" style={{ height: 32 }} onClick={() => toggleActive(u.id, u.is_active)}>
                        {u.is_active ? '停用' : '启用'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
