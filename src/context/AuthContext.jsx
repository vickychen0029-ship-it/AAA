import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContextValue.js'
import { fetchMe, getStoredToken, loginWithPhone, logout, registerWithPhone } from '../services/authApi.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let canceled = false
    const init = async () => {
      const currentToken = getStoredToken()
      if (!currentToken) {
        if (!canceled) {
          setUser(null)
          setLoading(false)
        }
        return
      }
      try {
        const me = await fetchMe(currentToken)
        if (!canceled) {
          setToken(currentToken)
          setUser(me)
        }
      } catch {
        if (!canceled) {
          logout()
          setToken('')
          setUser(null)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    init()
    return () => { canceled = true }
  }, [])

  const login = async (phone, password) => {
    setLoading(true)
    try {
      await loginWithPhone(phone, password)
      const nextToken = getStoredToken()
      const me = await fetchMe(nextToken)
      setToken(nextToken)
      setUser(me)
      return me
    } finally {
      setLoading(false)
    }
  }

  const register = async (phone, password, username = null) => {
    return registerWithPhone(phone, password, username)
  }

  const signOut = () => {
    logout()
    setToken('')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
