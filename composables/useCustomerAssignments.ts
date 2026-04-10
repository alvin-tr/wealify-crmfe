import type { Customer } from './useCustomers'

export interface CustomerAssignment {
  customer_id: string | number
  assigned_at: string
  note?: string | null
  follow_up_required?: boolean | null
  follow_up_date?: string | null
  customer?: Customer & { id?: number | string }
}

export interface SalesUserWithCustomers {
  sales_user_id: number
  staff_code: string
  full_name: string
  email: string
  email_lark: string
  avatar?: string
  phone?: string
  department?: string
  customers: CustomerAssignment[]
  total_customers: number
}

export interface SalesWithCustomersResponse {
  success: boolean
  data: SalesUserWithCustomers[]
  total_sales: number
  total_customers: number
}

export interface AssignCustomersPayload {
  sales_user_id: number
  customer_ids: string[]
  note?: string | null
}

export interface AssignOrTransferCustomersPayload {
  target_sales_user_id: number
  customer_ids: number[]
  note?: string | null
}

export interface AssignOrTransferCustomersResult {
  success: boolean
  target_sales_user_id: number
  customer_ids: number[]
  newly_assigned: number
  transferred: number
  skipped: number
  details: {
    customer_id: number
    action: 'assigned' | 'transferred' | 'skipped'
    previous_sales_user_id: number | null
  }[]
}

export const useCustomerAssignments = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()

  const getAuthHeaders = (): Record<string, string> => {
    const raw = auth?.getAuthHeaders?.() ?? {}
    return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string' && value.length > 0) {
        acc[key] = value
      }
      return acc
    }, {})
  }

  const fetchSalesWithCustomers = async (): Promise<SalesUserWithCustomers[]> => {
    const url = `${apiBaseUrl}/customer-assignments/sales-with-customers`
    try {
      const response = await $fetch<SalesWithCustomersResponse>(url, {
        headers: getAuthHeaders(),
      })
      if (response && response.success) {
        return response.data || []
      }
      throw new Error('Failed to fetch sales with customers: Response success is false')
    } catch (error: any) {
      console.error('[useCustomerAssignments] Error fetching sales with customers:', error)
      throw error
    }
  }

  const assignCustomers = async (payload: AssignCustomersPayload) => {
    const url = `${apiBaseUrl}/customer-assignments/assign`
    try {
      const normalizedPayload: AssignCustomersPayload = {
        ...payload,
        customer_ids: (payload.customer_ids || []).map((id) => String(id)),
      }

      return await $fetch(url, {
        method: 'POST',
        body: normalizedPayload,
        headers: getAuthHeaders(),
      })
    } catch (error: any) {
      console.error('[useCustomerAssignments] Error assigning customers:', error)
      if (error?.status === 404) {
        console.error('[useCustomerAssignments] Assign endpoint returned 404. Payload:', payload)
      }
      throw error
    }
  }

  const assignOrTransferCustomers = async (
    payload: AssignOrTransferCustomersPayload,
  ): Promise<AssignOrTransferCustomersResult> => {
    const url = `${apiBaseUrl}/customer-assignments/assign-or-transfer`
    try {
      const normalizedCustomerIds = Array.from(
        new Set(
          (payload.customer_ids || [])
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      )

      if (!normalizedCustomerIds.length) {
        throw new Error('customer_ids must contain at least one valid numeric id')
      }

      const response = await $fetch<AssignOrTransferCustomersResult>(url, {
        method: 'POST',
        body: {
          target_sales_user_id: payload.target_sales_user_id,
          customer_ids: normalizedCustomerIds,
          note: typeof payload.note === 'string' && payload.note.trim().length ? payload.note.trim() : null,
        },
        headers: getAuthHeaders(),
      })

      if (!response?.success) {
        throw new Error('Failed to assign or transfer customers')
      }

      return response
    } catch (error) {
      console.error('[useCustomerAssignments] Error assign-or-transfer customers:', error)
      throw error
    }
  }

  const transferAllCustomers = async (payload: {
    from_sales_user_id: number
    to_sales_user_id: number
    note?: string | null
  }): Promise<{
    success: boolean
    transferred: number
    from_sales_user_id: number
    to_sales_user_id: number
  }> => {
    const url = `${apiBaseUrl}/customer-assignments/transfer-all`
    try {
      if (!Number.isInteger(payload.from_sales_user_id) || payload.from_sales_user_id <= 0) {
        throw new Error('from_sales_user_id must be a valid positive integer')
      }
      if (!Number.isInteger(payload.to_sales_user_id) || payload.to_sales_user_id <= 0) {
        throw new Error('to_sales_user_id must be a valid positive integer')
      }

      const response = await $fetch<{
        success: boolean
        transferred: number
        from_sales_user_id: number
        to_sales_user_id: number
      }>(url, {
        method: 'POST',
        body: {
          from_sales_user_id: payload.from_sales_user_id,
          to_sales_user_id: payload.to_sales_user_id,
          note: typeof payload.note === 'string' && payload.note.trim().length ? payload.note.trim() : null,
        },
        headers: getAuthHeaders(),
      })

      if (!response?.success) {
        throw new Error('Failed to bulk transfer customers')
      }

      return response
    } catch (error) {
      console.error('[useCustomerAssignments] Error in transferAllCustomers:', error)
      throw error
    }
  }

  const updateSingleAssignmentNote = async (payload: {
    sales_user_id: number
    customer_id: number
    note?: string | null
  }): Promise<{
    success: boolean
    sales_user_id: number
    customer_id: number
    updated: boolean
  }> => {
    const url = `${apiBaseUrl}/customer-assignments/note`
    try {
      // Ensure values are proper integers
      const salesUserId = Number(payload.sales_user_id)
      const customerId = Number(payload.customer_id)

      if (!Number.isInteger(salesUserId) || salesUserId <= 0) {
        throw new Error('sales_user_id must be a positive integer')
      }

      if (!Number.isInteger(customerId) || customerId <= 0) {
        throw new Error('customer_id must be a positive integer')
      }

      const response = await $fetch<{
        success: boolean
        sales_user_id: number
        customer_id: number
        updated: boolean
      }>(url, {
        method: 'PUT',
        body: {
          sales_user_id: salesUserId,
          customer_id: customerId,
          note: typeof payload.note === 'string' && payload.note.trim().length ? payload.note.trim() : null,
        },
        headers: getAuthHeaders(),
      })

      if (!response?.success) {
        throw new Error('Failed to update assignment note')
      }

      return response
    } catch (error) {
      console.error('[useCustomerAssignments] Error updating assignment note:', error)
      throw error
    }
  }

  return {
    fetchSalesWithCustomers,
    assignCustomers,
    assignOrTransferCustomers,
    transferAllCustomers,
    updateSingleAssignmentNote,
  }
}

