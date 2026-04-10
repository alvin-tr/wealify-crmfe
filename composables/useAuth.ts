import { computed } from 'vue'
import { useState, useCookie, useRuntimeConfig } from '#imports'

export interface AuthUser {
  id: number
  username: string
  full_name: string
  role: string
  department?: string
  status: string
  avatar?: string | null
  last_login?: string | null
  last_password_change?: string | null
}

interface LoginResponse {
  success: boolean
  token: string
  user: AuthUser
}

interface RefreshResponse {
  success: boolean
  user: AuthUser
}

export const useAuth = () => {
  const config = useRuntimeConfig()

  const tokenCookie = useCookie<string | null>('crm_auth_token', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  const userState = useState<AuthUser | null>('auth_user', () => null)
  const loadingState = useState<boolean>('auth_loading', () => false)
  const initializedState = useState<boolean>('auth_initialized', () => false)

  const setSession = (token: string | null, user: AuthUser | null) => {
    tokenCookie.value = token
    userState.value = user
  }

  const getAuthHeaders = () => {
    const token = tokenCookie.value
    if (!token) return {}
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const login = async (username: string, password: string) => {
    loadingState.value = true
    try {
      const response = await $fetch<LoginResponse>(`${config.public.apiBase}/auth/login`, {
        method: 'POST',
        body: { username, password },
      })

      if (!response?.success || !response.token) {
        throw new Error('Invalid login response')
      }

      setSession(response.token, response.user)
      return response
    } finally {
      loadingState.value = false
    }
  }

  const logout = async () => {
    const token = tokenCookie.value
    try {
      if (token) {
        await $fetch(`${config.public.apiBase}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
        })
      }
    } catch (error) {
      console.error('[useAuth] Logout failed', error)
    } finally {
      setSession(null, null)
    }
  }

  const refreshUser = async () => {
    const token = tokenCookie.value
    if (!token) {
      setSession(null, null)
      return null
    }

    try {
      const response = await $fetch<RefreshResponse>(`${config.public.apiBase}/auth/refresh`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      if (response?.success) {
        userState.value = response.user
        return response.user
      }

      setSession(null, null)
      return null
    } catch (error) {
      console.error('[useAuth] Refresh failed', error)
      setSession(null, null)
      return null
    }
  }

  const ensureInitialized = async () => {
    if (initializedState.value) return
    initializedState.value = true

    if (tokenCookie.value && !userState.value) {
      await refreshUser()
    }
  }

  return {
    token: tokenCookie,
    user: userState,
    loading: computed(() => loadingState.value),
    isAuthenticated: computed(() => !!tokenCookie.value && !!userState.value),
    login,
    logout,
    refreshUser,
    ensureInitialized,
    getAuthHeaders,
  }
}


