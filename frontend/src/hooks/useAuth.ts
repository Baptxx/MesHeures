import { useState, useEffect, useCallback } from 'react'
import type { User } from '@/lib/types'
import { getToken, setToken, clearToken, onUnauthorized } from '@/lib/auth'
import { login as apiLogin, register as apiRegister, fetchMe } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    onUnauthorized(() => setUser(null))
  }, [])

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    fetchMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiLogin(email, password)
    setToken(token)
    setUser(user)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiRegister(email, password)
    setToken(token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return { user, loading, login, register, logout }
}
