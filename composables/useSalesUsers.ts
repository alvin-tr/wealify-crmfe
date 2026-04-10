export interface SalesUser {
  id?: number
  sales_user_id?: number
  user_id?: number | null
  staff_code: string
  full_name: string
  email: string
  email_lark?: string | null
  avatar?: string | null
  phone?: string | null
  telegram?: string | null
  department: 'sales' | 'telesale' | 'cskh' | 'marketing' | 'admin'
  role?: 'sales_rep' | 'sales_lead' | 'manager' | 'support'
  status?: 'active' | 'inactive' | 'on_leave'
  hired_at?: string | null
  resigned_at?: string | null
  is_accepting_customers?: boolean | number
}

export interface SalesUsersResponse {
  success: boolean
  data: SalesUser[]
  count?: number
}

export const useSalesUsers = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()

  const fetchSalesUsers = async (): Promise<SalesUser[]> => {
    const url = `${apiBaseUrl}/sales-users`
    try {
      const res = await $fetch<SalesUsersResponse>(url, {
        headers: {
          ...auth.getAuthHeaders(),
        },
      })
      if (res?.success && Array.isArray(res.data)) return res.data
      // fallback if API returns array directly
      return (res as unknown as SalesUser[]) || []
    } catch (err) {
      console.error('[useSalesUsers] fetch error:', err)
      throw err
    }
  }

  const createSalesUser = async (payload: Partial<SalesUser>) => {
    const url = `${apiBaseUrl}/sales-users`
    try {
      return await $fetch(url, {
        method: 'POST',
        body: payload,
        headers: {
          ...auth.getAuthHeaders(),
        },
      })
    } catch (err) {
      console.error('[useSalesUsers] create error:', err)
      throw err
    }
  }

  const updateSalesUser = async (id: number, payload: Partial<SalesUser>) => {
    const url = `${apiBaseUrl}/sales-users/${id}`
    try {
      return await $fetch(url, {
        method: 'PATCH',
        body: payload,
        headers: {
          ...auth.getAuthHeaders(),
        },
      })
    } catch (err) {
      console.error('[useSalesUsers] update error:', err)
      throw err
    }
  }

  const toggleAccepting = async (id: number, isAccepting: boolean) => {
    const url = `${apiBaseUrl}/sales-users/${id}/toggle-accepting`
    try {
      return await $fetch(url, {
        method: 'PATCH',
        body: { is_accepting_customers: isAccepting },
        headers: {
          ...auth.getAuthHeaders(),
        },
      })
    } catch (err) {
      console.error('[useSalesUsers] toggleAccepting error:', err)
      throw err
    }
  }

  return { fetchSalesUsers, createSalesUser, updateSalesUser, toggleAccepting }
}
