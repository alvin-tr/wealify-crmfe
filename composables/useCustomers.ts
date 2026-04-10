export interface Customer {
  id?: number | string
  customer_id: string
  full_name: string
  email: string
  phone_number: string
  tier: string
  registered_at: string
  referral_code: string
  source_id?: number
  source_name?: string
  source_description?: string
  volume_last_30d?: number
  volume_last_7d?: number
  volume_last_1d?: number
  total_volume?: number
}

export interface CustomersResponse {
  success: boolean
  data: Customer[]
}

// Global cache state (singleton pattern)
const customersCache = {
  data: null as Customer[] | null,
  promise: null as Promise<Customer[]> | null,
  lastFetched: null as number | null,
  cacheTimeout: 10 * 60 * 1000, // 10 minutes cache timeout
}

export const useCustomers = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()

  const fetchCustomers = async (forceRefresh = false): Promise<Customer[]> => {
    // Check if we have valid cached data
    if (!forceRefresh && customersCache.data !== null) {
      const now = Date.now()
      const cacheAge = customersCache.lastFetched ? now - customersCache.lastFetched : Infinity

      // If cache is still valid, return cached data
      if (cacheAge < customersCache.cacheTimeout) {
        console.log('✅ [useCustomers] Returning cached data (age:', Math.round(cacheAge / 1000), 's)')
        return customersCache.data
      }
    }

    // If there's already a pending request, return that promise
    if (customersCache.promise && !forceRefresh) {
      console.log('⏳ [useCustomers] Reusing pending request')
      return customersCache.promise
    }

    // Create new fetch request
    const url = `${apiBaseUrl}/customers`
    console.log('🔵 [useCustomers] Starting fetch...', forceRefresh ? '(force refresh)' : '')
    console.log('🔵 [useCustomers] API URL:', url)

    const fetchPromise = (async () => {
      try {
        const authHeaders = auth.getAuthHeaders()
        const headers: Record<string, string> = {}
        if (authHeaders?.Authorization) {
          headers.Authorization = authHeaders.Authorization
        }

        const response = await $fetch<CustomersResponse>(url, {
          headers,
        })

        if (response && response.success) {
          const customers = response.data || []
          // Update cache
          customersCache.data = customers
          customersCache.lastFetched = Date.now()
          customersCache.promise = null
          console.log('✅ [useCustomers] Fetched and cached', customers.length, 'customers')
          return customers
        }

        throw new Error('Failed to fetch customers: Response success is false')
      } catch (error: any) {
        // Clear promise on error so we can retry
        customersCache.promise = null
        console.error('❌ [useCustomers] Error fetching customers:', error)
        throw error
      }
    })()

    // Store the promise so concurrent calls can reuse it
    customersCache.promise = fetchPromise
    return fetchPromise
  }

  // Function to invalidate cache (useful after mutations)
  const invalidateCache = () => {
    customersCache.data = null
    customersCache.lastFetched = null
    customersCache.promise = null
    console.log('🔄 [useCustomers] Cache invalidated')
  }

  // Function to get cached data without fetching
  const getCachedCustomers = (): Customer[] | null => {
    if (customersCache.data !== null) {
      const now = Date.now()
      const cacheAge = customersCache.lastFetched ? now - customersCache.lastFetched : Infinity
      if (cacheAge < customersCache.cacheTimeout) {
        return customersCache.data
      }
    }
    return null
  }

  // Function to edit existing customer
  const updateCustomer = async (id: number | string, payload: Partial<Customer>) => {
    const url = `${apiBaseUrl}/customers/${id}`
    const authHeaders = auth.getAuthHeaders()
    const headers: Record<string, string> = {}
    if (authHeaders?.Authorization) {
      headers.Authorization = authHeaders.Authorization
    }

    try {
      const response = await $fetch<any>(url, {
        method: 'PATCH',
        headers,
        body: payload
      })

      if (response && response.success) {
        invalidateCache()
        return response
      }
      throw new Error(response?.message || 'Failed to update customer')
    } catch (error: any) {
      console.error('❌ [useCustomers] Error updating customer:', error)
      throw error
    }
  }

  const fetchConversionAnalytics = async (): Promise<{ source_id: number; source_name: string; total_leads: number; won_deals: number; conversion_rate: number }[]> => {
    const url = `${apiBaseUrl}/customers/analytics/conversion-by-source`
    const authHeaders = auth.getAuthHeaders()
    const headers: Record<string, string> = {}
    if (authHeaders?.Authorization) {
      headers.Authorization = authHeaders.Authorization
    }

    try {
      const response = await $fetch<any>(url, { headers })
      if (response && response.success) {
        return response.data || []
      }
      return []
    } catch (error: any) {
      console.error('❌ [useCustomers] Error fetching analytics:', error)
      return []
    }
  }

  return {
    fetchCustomers,
    invalidateCache,
    getCachedCustomers,
    updateCustomer,
    fetchConversionAnalytics
  }
}

