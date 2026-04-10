export interface CreateUserInput {
  username: string
  full_name: string
  password: string
  role?: 'admin' | 'sales_manager' | 'sales' | 'marketing' | 'customer_support' | 'other'
  status?: 'active' | 'inactive' | 'locked'
  avatar?: string | null
}

export interface CreateUserResponse {
  success: boolean
  id: number
}

export interface UpdateUserInput {
  full_name?: string
  password?: string
  role?: 'admin' | 'sales_manager' | 'sales' | 'marketing' | 'customer_support' | 'other'
  status?: 'active' | 'inactive' | 'locked'
  avatar?: string | null
  sales_staff_code?: string | null
  sales_phone?: string | null
  sales_department?: string | null
}

export interface SalesUserLink {
  id: number
  staff_code: string
  full_name: string
  email: string | null
  email_lark?: string | null
  avatar?: string | null
  phone?: string | null
  department?: string | null
  role?: string | null
  status?: string | null
  hired_at?: string | null
  resigned_at?: string | null
}

export interface UserWithSalesInfo {
  id: number
  username: string
  full_name: string
  avatar?: string | null
  role: 'admin' | 'sales_manager' | 'sales' | 'marketing' | 'customer_support' | 'other'
  status: 'active' | 'inactive' | 'locked'
  last_login?: string | null
  last_password_change?: string | null
  created_at?: string | null
  updated_at?: string | null
  email?: string | null
  phone?: string | null
  sales_user?: SalesUserLink | null
}

export interface UsersListResponse {
  success: boolean
  data: UserWithSalesInfo[]
}

export const useUsers = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()

  const fetchUsers = async (): Promise<UserWithSalesInfo[]> => {
    const response = await $fetch<UsersListResponse>(`${apiBaseUrl}/users`, {
      headers: {
        ...auth.getAuthHeaders(),
      },
    })
    if (response?.success && Array.isArray(response.data)) {
      return response.data
    }
    return []
  }

  const createUser = async (payload: CreateUserInput): Promise<CreateUserResponse> => {
    return await $fetch<CreateUserResponse>(`${apiBaseUrl}/users`, {
      method: 'POST',
      body: payload,
      headers: auth.getAuthHeaders() as unknown as HeadersInit,
    })
  }

  const updateUser = async (id: number, payload: UpdateUserInput): Promise<{ success: boolean; message?: string }> => {
    return await $fetch<{ success: boolean; message?: string }>(`${apiBaseUrl}/users/${id}`, {
      method: 'PATCH',
      body: payload,
      headers: {
        ...auth.getAuthHeaders(),
      },
    })
  }

  return {
    fetchUsers,
    createUser,
    updateUser,
  }
}


