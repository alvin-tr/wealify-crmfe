export interface LeadReferenceItem {
  id: number
  name: string
  code?: string | null
  description?: string | null
  order_index?: number | null
  is_final?: boolean | null
}

export interface Lead {
  id?: number
  full_name: string
  email?: string | null
  phone?: string | null
  job_title?: string | null
  company_name?: string | null
  website?: string | null
  address?: string | null
  lead_score?: number
  is_qualified?: boolean
  is_converted?: boolean
  converted_at?: string | null
  notes?: string | null
  owner_id?: number | null
  source_id?: number | null
  stage_id?: number | null
  status_id?: number | null
  created_at?: string
  updated_at?: string
  owner_name?: string | null
  stage_name?: string | null
  status_name?: string | null
  source_name?: string | null
}

export interface LeadContact {
  id?: number
  lead_id: number
  platform:
    | 'telegram'
    | 'whatsapp'
    | 'zalo'
    | 'discord'
    | 'facebook'
    | 'linkedin'
    | 'wechat'
    | 'line'
    | 'signal'
    | 'viber'
  handle: string
  is_primary?: boolean
  verified?: boolean
  note?: string | null
  created_at?: string
  updated_at?: string
}

export interface LeadAssignment {
  id?: number
  lead_id: number
  sales_user_id: number
  assigned_at?: string
  unassigned_at?: string | null
  status?: 'active' | 'transferred' | 'ended'
  note?: string | null
  sales_user_name?: string | null
}

export interface LeadInteractionAttachment {
  id?: number
  lead_interaction_id: number
  file_name?: string | null
  file_url?: string | null
  file_type?: string | null
  uploaded_at?: string
}

export interface LeadInteraction {
  id?: number
  lead_id: number
  sales_user_id: number
  lead_task_id?: number | null
  type?: 'call' | 'email' | 'meeting' | 'note' | 'other'
  summary?: string | null
  notes?: string | null
  interaction_at?: string
  created_at?: string
  attachments?: LeadInteractionAttachment[]
}

export interface CreateLeadInteractionInput {
  sales_user_id: number
  lead_task_id?: number | null
  type?: 'call' | 'email' | 'meeting' | 'note' | 'other'
  summary?: string | null
  notes?: string | null
  interaction_at?: string
  attachments?: File[]
}

export interface LeadTask {
  id?: number
  lead_id: number
  stage_id: number
  task_template_id: number
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  due_date?: string | null
  completed_at?: string | null
  task_template_name?: string | null
  task_template_description?: string | null
  stage_name?: string | null
}

export interface LeadTaskTemplate {
  id?: number
  name: string
  description?: string | null
  default_due_in_days?: number
  category?: 'follow_up' | 'verification' | 'introduction' | 'support' | 'custom'
}

export interface LeadTaskStageMap {
  id?: number
  stage_id: number
  task_template_id: number
  delay_days?: number
  task_template_name?: string | null
  task_template_description?: string | null
  stage_name?: string | null
}

export interface LeadImportReport {
  total_rows: number
  imported: number
  skipped: number
  errors: { row: number; message: string }[]
}

export interface LeadInteractionWithDetails extends LeadInteraction {
  lead_name?: string | null
  lead_email?: string | null
  lead_phone?: string | null
  sales_user_name?: string | null
  attachment_count?: number
}

export interface LeadInteractionsStatistics {
  total_interactions: number
  by_type: Record<string, number>
  with_attachments: number
  unique_leads: number
  by_period: {
    today: number
    this_week: number
    this_month: number
    this_year: number
  }
  recent_interactions: number
}

export interface LeadInteractionsResponse {
  success: boolean
  data: LeadInteractionWithDetails[]
  statistics: LeadInteractionsStatistics
  count: number
}

export interface LeadStatistics {
  total_leads: number
  assigned_leads: number
  unassigned_leads: number
  qualified_leads: number
  converted_leads: number
  leads_by_status: Record<string, number>
  leads_by_stage: Record<string, number>
  leads_by_source: Record<string, number>
  recent_leads: number
  leads_this_week: number
  leads_this_month: number
  conversion_rate: number
}

export interface LeadStatisticsResponse {
  success: boolean
  data: LeadStatistics
}

const unwrap = <T>(response: any): T => {
  if (!response) return [] as unknown as T
  if (Array.isArray(response)) return response as T
  if (typeof response === 'object' && 'data' in response) return response.data as T
  return response as T
}

export const useLeads = () => {
  const config = useRuntimeConfig()
  const auth = useAuth()
  const baseUrl = `${config.public.apiBase}/leads`

  const authorizedHeaders = () => ({
    ...auth.getAuthHeaders(),
  })

  const fetchLeads = async (): Promise<Lead[]> => {
    const response = await $fetch(baseUrl, { headers: authorizedHeaders() })
    return unwrap<Lead[]>(response)
  }

  const fetchLeadDetail = async (id: number) => {
    const response = await $fetch(`${baseUrl}/${id}`, { headers: authorizedHeaders() })
    return unwrap<{
      lead: Lead
      contacts: LeadContact[]
      assignments: LeadAssignment[]
      interactions: LeadInteraction[]
      tasks: LeadTask[]
    }>(response)
  }

  const fetchLeadStatuses = async (): Promise<LeadReferenceItem[]> => {
    const response = await $fetch(`${baseUrl}/reference/statuses`, { headers: authorizedHeaders() })
    return unwrap<LeadReferenceItem[]>(response)
  }

  const fetchLeadStages = async (): Promise<LeadReferenceItem[]> => {
    const response = await $fetch(`${baseUrl}/reference/stages`, { headers: authorizedHeaders() })
    return unwrap<LeadReferenceItem[]>(response)
  }

  const fetchLeadSources = async (): Promise<LeadReferenceItem[]> => {
    const response = await $fetch(`${baseUrl}/reference/sources`, { headers: authorizedHeaders() })
    return unwrap<LeadReferenceItem[]>(response)
  }

  const assignLeadsToSalesUser = async (payload: {
    sales_user_id: number
    lead_ids: number[]
    note?: string | null
  }): Promise<{
    success: boolean
    assigned: number
    sales_user_id: number
    lead_ids: number[]
  }> => {
    const body = {
      sales_user_id: payload.sales_user_id,
      lead_ids: payload.lead_ids,
      note: payload.note ?? null,
    }
    return await $fetch(`${baseUrl}/assign`, {
      method: 'POST',
      body,
      headers: authorizedHeaders(),
    })
  }

  const createLead = async (payload: Lead) => {
    return await $fetch(`${baseUrl}`, {
      method: 'POST',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const updateLead = async (id: number, payload: Partial<Lead>) => {
    return await $fetch(`${baseUrl}/${id}`, {
      method: 'PATCH',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const deleteLead = async (id: number) => {
    return await $fetch(`${baseUrl}/${id}`, {
      method: 'DELETE',
      headers: authorizedHeaders(),
    })
  }

  const createLeadContact = async (leadId: number, payload: Omit<LeadContact, 'lead_id'>) => {
    return await $fetch(`${baseUrl}/${leadId}/contacts`, {
      method: 'POST',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const updateLeadContact = async (leadId: number, contactId: number, payload: Partial<LeadContact>) => {
    return await $fetch(`${baseUrl}/${leadId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const deleteLeadContact = async (leadId: number, contactId: number) => {
    return await $fetch(`${baseUrl}/${leadId}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: authorizedHeaders(),
    })
  }

  const createLeadAssignment = async (leadId: number, payload: Omit<LeadAssignment, 'lead_id'>) => {
    return await $fetch(`${baseUrl}/${leadId}/assignments`, {
      method: 'POST',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const updateLeadAssignment = async (
    leadId: number,
    assignmentId: number,
    payload: Partial<Pick<LeadAssignment, 'status' | 'note' | 'unassigned_at'>>,
  ) => {
    return await $fetch(`${baseUrl}/${leadId}/assignments/${assignmentId}`, {
      method: 'PATCH',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const buildLeadInteractionFormData = (leadId: number, input: CreateLeadInteractionInput): FormData => {
    const formData = new FormData()
    
    // Required fields
    formData.append('sales_user_id', String(input.sales_user_id))
    
    // lead_task_id - always append, use 'null' string if null/undefined
    if (input.lead_task_id != null && input.lead_task_id !== undefined && input.lead_task_id !== '') {
      formData.append('lead_task_id', String(input.lead_task_id))
    } else {
      // Send empty string or 'null' to indicate null value
      formData.append('lead_task_id', '')
    }

    // Optional fields - only append if they have values
    const type = input.type || 'other'
    formData.append('type', type)

    if (input.summary && input.summary.trim()) {
      formData.append('summary', input.summary.trim())
    }

    if (input.notes && input.notes.trim()) {
      formData.append('notes', input.notes.trim())
    }

    if (input.interaction_at) {
      formData.append('interaction_at', input.interaction_at)
    }

    // Attachments - append files if any
    const attachments = input.attachments || []
    attachments.slice(0, 5).forEach((file) => {
      if (file) {
        formData.append('attachments', file, file.name)
      }
    })

    return formData
  }

  const createLeadInteraction = async (
    leadId: number,
    payload: CreateLeadInteractionInput,
  ) => {
    // Always use FormData to be consistent with backend expectations
    // Backend expects multipart/form-data for this endpoint
    const formData = buildLeadInteractionFormData(leadId, payload)
    
    // Log FormData contents for debugging
    console.log('[useLeads] Creating interaction:', {
      leadId,
      url: `${baseUrl}/${leadId}/interactions`,
      payload: {
        sales_user_id: payload.sales_user_id,
        lead_task_id: payload.lead_task_id,
        type: payload.type,
        summary: payload.summary,
        notes: payload.notes,
        interaction_at: payload.interaction_at,
        attachmentsCount: payload.attachments?.length || 0,
      },
    })
    
    try {
      // Browser will automatically set Content-Type with boundary for FormData
      // Don't manually set Content-Type header - let browser handle it
      const headers = authorizedHeaders()
      
      const response = await $fetch(`${baseUrl}/${leadId}/interactions`, {
        method: 'POST',
        body: formData,
        headers,
      })
      
      return unwrap<any>(response)
    } catch (error: any) {
      console.error('[useLeads] Error creating interaction:', error)
      console.error('[useLeads] Error details:', {
        status: error?.status,
        statusCode: error?.statusCode,
        statusText: error?.statusText,
        data: error?.data,
        message: error?.message,
      })
      throw error
    }
  }

  const deleteLeadInteraction = async (leadId: number, interactionId: number) => {
    return await $fetch(`${baseUrl}/${leadId}/interactions/${interactionId}`, {
      method: 'DELETE',
      headers: authorizedHeaders(),
    })
  }

  const addInteractionAttachment = async (
    leadId: number,
    interactionId: number,
    payload: Omit<LeadInteractionAttachment, 'lead_interaction_id'>,
  ) => {
    return await $fetch(`${baseUrl}/${leadId}/interactions/${interactionId}/attachments`, {
      method: 'POST',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const deleteInteractionAttachment = async (leadId: number, interactionId: number, attachmentId: number) => {
    return await $fetch(`${baseUrl}/${leadId}/interactions/${interactionId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: authorizedHeaders(),
    })
  }

  const createLeadTask = async (leadId: number, payload: Omit<LeadTask, 'lead_id'>) => {
    return await $fetch(`${baseUrl}/${leadId}/tasks`, {
      method: 'POST',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const updateLeadTask = async (leadId: number, taskId: number, payload: Partial<LeadTask>) => {
    return await $fetch(`${baseUrl}/${leadId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: payload,
      headers: authorizedHeaders(),
    })
  }

  const deleteLeadTask = async (leadId: number, taskId: number) => {
    return await $fetch(`${baseUrl}/${leadId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authorizedHeaders(),
    })
  }

  const fetchTaskTemplates = async (): Promise<LeadTaskTemplate[]> => {
    const response = await $fetch(`${baseUrl}/task-templates`, { headers: authorizedHeaders() })
    return unwrap<LeadTaskTemplate[]>(response)
  }

  const fetchTaskStageMapsByStage = async (stageId: number): Promise<LeadTaskStageMap[]> => {
    const response = await $fetch(`${baseUrl}/stages/${stageId}/task-maps`, { headers: authorizedHeaders() })
    return unwrap<LeadTaskStageMap[]>(response)
  }

  const importLeadsFromExcel = async (file: File): Promise<LeadImportReport> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch(`${baseUrl}/import/excel`, {
      method: 'POST',
      body: formData,
      headers: authorizedHeaders(),
    })

    return unwrap<LeadImportReport>(response)
  }

  const fetchSalesInteractions = async (params?: {
    sales_user_id?: number
    start_date?: string
    end_date?: string
  }): Promise<LeadInteractionsResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.sales_user_id) {
      queryParams.append('sales_user_id', String(params.sales_user_id))
    }
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date)
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date)
    }

    const url = `${baseUrl}/interactions/sales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await $fetch<LeadInteractionsResponse>(url, {
      headers: authorizedHeaders(),
    })

    return response
  }

  const fetchLeadStatistics = async (): Promise<LeadStatisticsResponse> => {
    const url = `${baseUrl}/statistics`
    const response = await $fetch<LeadStatisticsResponse>(url, {
      headers: authorizedHeaders(),
    })

    return response
  }

  return {
    fetchLeads,
    fetchLeadDetail,
    fetchLeadStatuses,
    fetchLeadStages,
    fetchLeadSources,
    createLead,
    updateLead,
    deleteLead,
    createLeadContact,
    updateLeadContact,
    deleteLeadContact,
    createLeadAssignment,
    updateLeadAssignment,
    createLeadInteraction,
    deleteLeadInteraction,
    addInteractionAttachment,
    deleteInteractionAttachment,
    createLeadTask,
    updateLeadTask,
    deleteLeadTask,
    fetchTaskTemplates,
    fetchTaskStageMapsByStage,
    importLeadsFromExcel,
    assignLeadsToSalesUser,
    fetchSalesInteractions,
    fetchLeadStatistics,
  }
}

