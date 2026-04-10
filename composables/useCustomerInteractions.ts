export type InteractionType = 'call' | 'email' | 'meeting' | 'chat' | 'sms' | 'other'

export interface CustomerInteraction {
  id: number
  customer_id: number
  sales_user_id: number
  type: InteractionType
  channel: string | null
  interaction_date: string
  duration_minutes: number | null
  subject: string | null
  detail: string | null
  follow_up_required: boolean
  follow_up_date: string | null
  created_at: string
  updated_at: string
  attachments: Array<{
    id: number
    interaction_id: number
    file_url: string
    file_name: string | null
    file_type: string | null
    uploaded_by: number | null
    uploaded_at: string | null
  }>
}

export interface CreateCustomerInteractionInput {
  customer_id: number
  sales_user_id: number
  type: InteractionType
  interaction_date: string
  channel?: string | null
  duration_minutes?: number | null
  subject?: string | null
  detail?: string | null
  follow_up_required?: boolean
  follow_up_date?: string | null
  uploaded_by?: number | null
  attachments?: File[]
}

export interface InteractionOverviewMetrics {
  customers_today: number
  customers_this_week: number
  customers_this_month: number
  customers_previous_month: number
  month_over_month_growth: number | null
  new_customers_this_month: number
}

export interface InteractionFiltersInput {
  sales_user_id?: number | null
  customer_id?: number | null
  type?: string | null
  channel?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface InteractionHistoryResponse {
  success: boolean
  filters: {
    sales_user_id?: number
    customer_id?: number
    type?: string
    channel?: string
    start_date?: string
    end_date?: string
  }
  total: number
  data: CustomerInteraction[]
  overview_metrics: InteractionOverviewMetrics
}

export interface InteractionMetrics {
  total_interactions: number
  interactions_by_type: Record<string, number>
  interactions_by_channel: Record<string, number>
  interactions_by_sales_user: Array<{
    sales_user_id: number
    total: number
  }>
  interactions_by_customer: Array<{
    customer_id: number
    total: number
  }>
  daily_breakdown: Array<{
    date: string
    total: number
  }>
}

const buildQueryFromFilters = (filters: InteractionFiltersInput = {}) => {
  const params = new URLSearchParams()

  if (filters.sales_user_id) {
    params.set('sales_user_id', String(filters.sales_user_id))
  }
  if (filters.customer_id) {
    params.set('customer_id', String(filters.customer_id))
  }
  if (filters.type) {
    params.set('type', filters.type)
  }
  if (filters.channel) {
    params.set('channel', filters.channel)
  }
  if (filters.start_date) {
    params.set('start_date', filters.start_date)
  }
  if (filters.end_date) {
    params.set('end_date', filters.end_date)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const useCustomerInteractions = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()

  const buildFormData = (input: CreateCustomerInteractionInput): FormData => {
    const formData = new FormData()
    formData.append('customer_id', String(input.customer_id))
    formData.append('sales_user_id', String(input.sales_user_id))
    formData.append('type', input.type)
    formData.append('interaction_date', input.interaction_date)

    if (input.channel) {
      formData.append('channel', input.channel)
    }

    if (input.duration_minutes != null && input.duration_minutes !== undefined) {
      formData.append('duration_minutes', String(input.duration_minutes))
    }

    if (input.subject) {
      formData.append('subject', input.subject)
    }

    if (input.detail) {
      formData.append('detail', input.detail)
    }

    if (input.follow_up_required != null) {
      formData.append('follow_up_required', input.follow_up_required ? 'true' : 'false')
    }

    if (input.follow_up_date) {
      formData.append('follow_up_date', input.follow_up_date)
    }

    if (input.uploaded_by != null && input.uploaded_by !== undefined) {
      formData.append('uploaded_by', String(input.uploaded_by))
    }

    const attachments = input.attachments || []
    attachments.slice(0, 10).forEach((file) => {
      if (file) {
        formData.append('attachments', file, file.name)
      }
    })

    return formData
  }

  const fetchInteractionsByCustomer = async (customerId: number): Promise<CustomerInteraction[]> => {
    const url = `${apiBaseUrl}/customer-interactions/customer/${customerId}`
    return await $fetch<CustomerInteraction[]>(url, {
      headers: {
        ...auth.getAuthHeaders(),
      },
    })
  }

  const createCustomerInteraction = async (
    input: CreateCustomerInteractionInput
  ): Promise<CustomerInteraction> => {
    const url = `${apiBaseUrl}/customer-interactions`
    const formData = buildFormData(input)

    return await $fetch<CustomerInteraction>(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...auth.getAuthHeaders(),
      },
    })
  }

  const fetchInteractionHistory = async (
    filters: InteractionFiltersInput = {},
  ): Promise<InteractionHistoryResponse> => {
    const url = `${apiBaseUrl}/customer-interactions${buildQueryFromFilters(filters)}`
    return await $fetch<InteractionHistoryResponse>(url, {
      headers: {
        ...auth.getAuthHeaders(),
      },
    })
  }

  const fetchInteractionMetrics = async (
    filters: InteractionFiltersInput = {},
  ): Promise<InteractionMetrics> => {
    const url = `${apiBaseUrl}/customer-interactions/metrics${buildQueryFromFilters(filters)}`
    return await $fetch<InteractionMetrics>(url, {
      headers: {
        ...auth.getAuthHeaders(),
      },
    })
  }

  return {
    fetchInteractionsByCustomer,
    createCustomerInteraction,
    fetchInteractionHistory,
    fetchInteractionMetrics,
  }
}

