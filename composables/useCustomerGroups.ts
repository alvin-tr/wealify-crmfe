export interface CustomerGroup {
  id?: number
  name: string
  description?: string | null
  owner_id?: number | null
  leader_customer_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface CustomerGroupMember {
  id?: number
  group_id: number
  customer_id: number
  assigned_at?: string
  note?: string | null
}

export interface CustomerGroupWithDetails extends CustomerGroup {
  owner_name?: string | null
  leader_customer_name?: string | null
  member_count?: number
  members?: CustomerGroupMember[]
}

export interface CustomerGroupsResponse {
  success: boolean
  data: CustomerGroupWithDetails[]
  count?: number
}

export interface CustomerGroupResponse {
  success: boolean
  data: CustomerGroupWithDetails
}

export interface CreateCustomerGroupPayload {
  name: string
  description?: string | null
  owner_id: number // Required when creating a new group
  leader_customer_id?: number | null
}

export interface UpdateCustomerGroupPayload {
  name?: string
  description?: string | null
  owner_id?: number | null
  leader_customer_id?: number | null
}

export interface AddGroupMemberPayload {
  customer_id: number
  note?: string | null
}

export interface AddGroupMembersPayload {
  customer_ids: number[]
  note?: string | null
}

export interface GroupMembersResponse {
  success: boolean
  data: CustomerGroupMember[]
  count?: number
}

export const useCustomerGroups = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()
  const baseUrl = `${apiBaseUrl}/customer-groups`

  const authorizedHeaders = () => {
    const authHeaders = auth.getAuthHeaders()
    const headers: Record<string, string> = {}
    if (authHeaders?.Authorization) {
      headers.Authorization = authHeaders.Authorization
    }
    return headers
  }

  const fetchCustomerGroups = async (): Promise<CustomerGroupWithDetails[]> => {
    const response = await $fetch<CustomerGroupsResponse>(baseUrl, {
      headers: authorizedHeaders(),
    })
    return response.data || []
  }

  const fetchCustomerGroupById = async (id: number): Promise<CustomerGroupWithDetails> => {
    const response = await $fetch<CustomerGroupResponse>(`${baseUrl}/${id}`, {
      headers: authorizedHeaders(),
    })
    return response.data
  }

  const createCustomerGroup = async (
    payload: CreateCustomerGroupPayload,
  ): Promise<{ id: number }> => {
    const response = await $fetch<{ success: boolean; data: { id: number } }>(baseUrl, {
      method: 'POST',
      headers: authorizedHeaders(),
      body: payload,
    })
    return response.data
  }

  const updateCustomerGroup = async (
    id: number,
    payload: UpdateCustomerGroupPayload,
  ): Promise<{ updated: boolean }> => {
    const response = await $fetch<{ success: boolean; data: { updated: boolean } }>(
      `${baseUrl}/${id}`,
      {
        method: 'PATCH',
        headers: authorizedHeaders(),
        body: payload,
      },
    )
    return response.data
  }

  const deleteCustomerGroup = async (id: number): Promise<{ deleted: boolean }> => {
    const response = await $fetch<{ success: boolean; data: { deleted: boolean } }>(
      `${baseUrl}/${id}`,
      {
        method: 'DELETE',
        headers: authorizedHeaders(),
      },
    )
    return response.data
  }

  const fetchGroupMembers = async (groupId: number): Promise<CustomerGroupMember[]> => {
    const response = await $fetch<GroupMembersResponse>(`${baseUrl}/${groupId}/members`, {
      headers: authorizedHeaders(),
    })
    return response.data || []
  }

  const addGroupMember = async (
    groupId: number,
    payload: AddGroupMemberPayload,
  ): Promise<{ id: number }> => {
    const response = await $fetch<{ success: boolean; data: { id: number } }>(
      `${baseUrl}/${groupId}/members`,
      {
        method: 'POST',
        headers: authorizedHeaders(),
        body: payload,
      },
    )
    return response.data
  }

  const addGroupMembers = async (
    groupId: number,
    payload: AddGroupMembersPayload,
  ): Promise<{ added: number; failed: number; customer_ids: number[]; errors: Array<{ customer_id: number; error: string }> }> => {
    const response = await $fetch<{
      success: boolean
      data: { added: number; failed: number; customer_ids: number[]; errors: Array<{ customer_id: number; error: string }> }
    }>(`${baseUrl}/${groupId}/members/bulk`, {
      method: 'POST',
      headers: authorizedHeaders(),
      body: payload,
    })
    return response.data
  }

  const removeGroupMember = async (
    groupId: number,
    customerId: number,
  ): Promise<{ deleted: boolean }> => {
    const response = await $fetch<{ success: boolean; data: { deleted: boolean } }>(
      `${baseUrl}/${groupId}/members/customer/${customerId}`,
      {
        method: 'DELETE',
        headers: authorizedHeaders(),
      },
    )
    return response.data
  }

  const removeGroupMemberById = async (memberId: number): Promise<{ deleted: boolean }> => {
    // Note: This endpoint requires groupId, but we only have memberId
    // We'll need to fetch the member first to get groupId, or use a different approach
    // For now, we'll skip this and use removeGroupMember instead
    throw new Error('removeGroupMemberById requires groupId. Use removeGroupMember instead.')
  }

  return {
    fetchCustomerGroups,
    fetchCustomerGroupById,
    createCustomerGroup,
    updateCustomerGroup,
    deleteCustomerGroup,
    fetchGroupMembers,
    addGroupMember,
    addGroupMembers,
    removeGroupMember,
  }
}

