export type SalesRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type SalesRequestType = 'assign_customer'

export interface SalesRequest {
  id: number
  requester_user_id: number
  type: SalesRequestType
  status: SalesRequestStatus
  payload: {
    requested_sales_user_id: number
    customer_ids: number[]
    customer_note?: string | null
  }
  note?: string | null
  reject_reason?: string | null
  approver_user_id?: number | null
  created_at: string
  updated_at: string
  decided_at?: string | null
  requester_name?: string
  approver_name?: string
}

export interface SalesRequestsResponse {
  success: boolean
  data: SalesRequest[]
  count?: number
}

export interface CreateSalesRequestPayload {
  customer_ids: number[]
  note?: string | null
  requested_sales_user_id?: number
}

export interface CreateSalesRequestResponse {
  success: boolean
  id: number
}

export interface ApproveRejectResponse {
  success: boolean
  message: string
}

export const useSalesRequests = () => {
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

  /**
   * Sales tạo request xin assign customer
   */
  const createAssignCustomerRequest = async (
    payload: CreateSalesRequestPayload
  ): Promise<CreateSalesRequestResponse> => {
    const url = `${apiBaseUrl}/sales-requests/assign-customer`
    try {
      const response = await $fetch<CreateSalesRequestResponse>(url, {
        method: 'POST',
        body: payload,
        headers: getAuthHeaders(),
      })
      return response
    } catch (error: any) {
      console.error('[useSalesRequests] Error creating request:', error)
      throw error
    }
  }

  /**
   * Sales xem requests của mình
   */
  const fetchMyRequests = async (): Promise<SalesRequest[]> => {
    const url = `${apiBaseUrl}/sales-requests/me`
    try {
      const response = await $fetch<SalesRequestsResponse>(url, {
        headers: getAuthHeaders(),
      })
      if (response?.success && Array.isArray(response.data)) {
        return response.data
      }
      return []
    } catch (error: any) {
      console.error('[useSalesRequests] Error fetching my requests:', error)
      throw error
    }
  }

  /**
   * Admin/Manager xem tất cả requests (có thể filter theo status)
   */
  const fetchAllRequests = async (status?: SalesRequestStatus): Promise<SalesRequest[]> => {
    const params = new URLSearchParams()
    if (status) {
      params.set('status', status)
    }
    const url = `${apiBaseUrl}/sales-requests${params.toString() ? `?${params.toString()}` : ''}`
    try {
      const response = await $fetch<SalesRequestsResponse>(url, {
        headers: getAuthHeaders(),
      })
      if (response?.success && Array.isArray(response.data)) {
        return response.data
      }
      return []
    } catch (error: any) {
      console.error('[useSalesRequests] Error fetching all requests:', error)
      throw error
    }
  }

  /**
   * Admin/Manager approve request
   */
  const approveRequest = async (requestId: number): Promise<ApproveRejectResponse> => {
    const url = `${apiBaseUrl}/sales-requests/${requestId}/approve`
    try {
      const response = await $fetch<ApproveRejectResponse>(url, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      return response
    } catch (error: any) {
      console.error('[useSalesRequests] Error approving request:', error)
      throw error
    }
  }

  /**
   * Admin/Manager reject request
   */
  const rejectRequest = async (
    requestId: number,
    reason?: string
  ): Promise<ApproveRejectResponse> => {
    const url = `${apiBaseUrl}/sales-requests/${requestId}/reject`
    try {
      const response = await $fetch<ApproveRejectResponse>(url, {
        method: 'POST',
        body: { reason: reason || null },
        headers: getAuthHeaders(),
      })
      return response
    } catch (error: any) {
      console.error('[useSalesRequests] Error rejecting request:', error)
      throw error
    }
  }

  return {
    createAssignCustomerRequest,
    fetchMyRequests,
    fetchAllRequests,
    approveRequest,
    rejectRequest,
  }
}

