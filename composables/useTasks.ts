export interface Task {
  id?: number
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  status?: 'todo' | 'in_progress' | 'review' | 'done'
  created_by: number
  deadline?: string | null
  is_archived?: number
  archived_at?: string | null
  created_at?: string
  updated_at?: string
  created_by_name?: string | null
  assignees?: Array<{ user_id: number; user_name: string }>
  customers?: Array<{ customer_id: number }>
  comments_count?: number
  files_count?: number
}

export interface CreateTaskDto {
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  status?: 'todo' | 'in_progress' | 'review' | 'done'
  deadline?: string | null
  assignee_user_ids?: number[]
  customer_ids?: number[]
}

export interface UpdateTaskDto {
  title?: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  status?: 'todo' | 'in_progress' | 'review' | 'done'
  deadline?: string | null
}

export interface TaskComment {
  id?: number
  task_id: number
  user_id: number
  user_name?: string
  content?: string | null
  created_at?: string
  files?: CommentFile[]
}

export interface TaskFile {
  id?: number
  task_id: number
  url: string
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  created_at?: string
}

export interface CommentFile {
  id?: number
  comment_id: number
  url: string
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  created_at?: string
}

export interface TasksResponse {
  success: boolean
  data: Task[]
  count: number
}

export interface TaskResponse {
  success: boolean
  data: Task & {
    comments?: TaskComment[]
    files?: TaskFile[]
  }
}

export const useTasks = () => {
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

  const fetchTasks = async (filters?: {
    status?: string
    priority?: string
    assignee_user_id?: number
    customer_id?: number
    created_by?: number
    limit?: number
    offset?: number
    include_archived?: boolean
  }): Promise<Task[]> => {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.priority) params.set('priority', filters.priority)
      if (filters?.assignee_user_id) params.set('assignee_user_id', String(filters.assignee_user_id))
      if (filters?.customer_id) params.set('customer_id', String(filters.customer_id))
      if (filters?.created_by) params.set('created_by', String(filters.created_by))
      if (filters?.limit) params.set('limit', String(filters.limit))
      if (filters?.offset) params.set('offset', String(filters.offset))
      if (filters?.include_archived) params.set('include_archived', 'true')

      const url = `${apiBaseUrl}/tasks${params.toString() ? `?${params.toString()}` : ''}`
      const response = await $fetch<TasksResponse>(url, {
        headers: getAuthHeaders(),
      })

      if (response.success) {
        return response.data || []
      }
      throw new Error('Failed to fetch tasks')
    } catch (error: any) {
      console.error('[useTasks] Error fetching tasks:', error)
      throw error
    }
  }

  const fetchTaskById = async (id: number): Promise<Task & { comments?: TaskComment[]; files?: TaskFile[] }> => {
    try {
      const url = `${apiBaseUrl}/tasks/${id}`
      const response = await $fetch<TaskResponse>(url, {
        headers: getAuthHeaders(),
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to fetch task')
    } catch (error: any) {
      console.error('[useTasks] Error fetching task:', error)
      throw error
    }
  }

  const createTask = async (dto: CreateTaskDto, files?: File[]): Promise<Task> => {
    try {
      const url = `${apiBaseUrl}/tasks`
      
      // If there are files, use FormData
      if (files && files.length > 0) {
        const formData = new FormData()
        
        // Add task data fields
        formData.append('title', dto.title)
        if (dto.description) formData.append('description', dto.description)
        if (dto.priority) formData.append('priority', dto.priority)
        if (dto.status) formData.append('status', dto.status)
        if (dto.deadline) formData.append('deadline', dto.deadline)
        
        // Add arrays - NestJS expects them as separate fields with same name
        if (dto.assignee_user_ids && dto.assignee_user_ids.length > 0) {
          dto.assignee_user_ids.forEach((id) => {
            formData.append('assignee_user_ids', String(id))
          })
        }
        if (dto.customer_ids && dto.customer_ids.length > 0) {
          dto.customer_ids.forEach((id) => {
            formData.append('customer_ids', String(id))
          })
        }
        
        // Add files
        files.forEach((file) => {
          formData.append('files', file)
        })
        
        // Remove Content-Type header to let browser set it with boundary
        const headers = getAuthHeaders()
        delete (headers as any)['Content-Type']
        
        const response = await $fetch<TaskResponse>(url, {
          method: 'POST',
          headers,
          body: formData,
        })

        if (response.success) {
          return response.data
        }
        throw new Error('Failed to create task')
      } else {
        // No files, use JSON
        const response = await $fetch<TaskResponse>(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: dto,
        })

        if (response.success) {
          return response.data
        }
        throw new Error('Failed to create task')
      }
    } catch (error: any) {
      console.error('[useTasks] Error creating task:', error)
      throw error
    }
  }

  const updateTask = async (id: number, dto: UpdateTaskDto): Promise<Task> => {
    try {
      const url = `${apiBaseUrl}/tasks/${id}`
      const response = await $fetch<TaskResponse>(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: dto,
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to update task')
    } catch (error: any) {
      console.error('[useTasks] Error updating task:', error)
      throw error
    }
  }

  const archiveTask = async (id: number): Promise<boolean> => {
    try {
      const url = `${apiBaseUrl}/tasks/${id}`
      const response = await $fetch<{ success: boolean; message: string }>(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      return response.success
    } catch (error: any) {
      console.error('[useTasks] Error archiving task:', error)
      throw error
    }
  }

  const unarchiveTask = async (id: number): Promise<boolean> => {
    try {
      const url = `${apiBaseUrl}/tasks/${id}/unarchive`
      const response = await $fetch<{ success: boolean; message: string }>(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      })

      return response.success
    } catch (error: any) {
      console.error('[useTasks] Error unarchiving task:', error)
      throw error
    }
  }

  const addAssignees = async (taskId: number, userIds: number[]): Promise<{ added: number }> => {
    try {
      const url = `${apiBaseUrl}/tasks/${taskId}/assignees`
      const response = await $fetch<{ success: boolean; data: { added: number } }>(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { user_ids: userIds },
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to add assignees')
    } catch (error: any) {
      console.error('[useTasks] Error adding assignees:', error)
      throw error
    }
  }

  const removeAssignees = async (taskId: number, userIds: number[]): Promise<{ removed: number }> => {
    try {
      const url = `${apiBaseUrl}/tasks/${taskId}/assignees`
      const response = await $fetch<{ success: boolean; data: { removed: number } }>(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: { user_ids: userIds },
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to remove assignees')
    } catch (error: any) {
      console.error('[useTasks] Error removing assignees:', error)
      throw error
    }
  }

  const addCustomers = async (taskId: number, customerIds: number[]): Promise<{ added: number }> => {
    try {
      const url = `${apiBaseUrl}/tasks/${taskId}/customers`
      const response = await $fetch<{ success: boolean; data: { added: number } }>(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { customer_ids: customerIds },
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to add customers')
    } catch (error: any) {
      console.error('[useTasks] Error adding customers:', error)
      throw error
    }
  }

  const removeCustomers = async (taskId: number, customerIds: number[]): Promise<{ removed: number }> => {
    try {
      const url = `${apiBaseUrl}/tasks/${taskId}/customers`
      const response = await $fetch<{ success: boolean; data: { removed: number } }>(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: { customer_ids: customerIds },
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to remove customers')
    } catch (error: any) {
      console.error('[useTasks] Error removing customers:', error)
      throw error
    }
  }

  const addComment = async (taskId: number, content: string, files?: File[]): Promise<TaskComment> => {
    try {
      const formData = new FormData()
      formData.append('content', content || '')
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file)
        })
      }

      // Remove Content-Type header to let browser set it with boundary
      const headers = getAuthHeaders()
      delete (headers as any)['Content-Type']

      const url = `${apiBaseUrl}/tasks/${taskId}/comments`
      const response = await $fetch<{ success: boolean; data: TaskComment }>(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (response.success) {
        return response.data
      }
      throw new Error('Failed to add comment')
    } catch (error: any) {
      console.error('[useTasks] Error adding comment:', error)
      throw error
    }
  }

  const fetchComments = async (taskId: number): Promise<TaskComment[]> => {
    try {
      const url = `${apiBaseUrl}/tasks/${taskId}/comments`
      const response = await $fetch<{ success: boolean; data: TaskComment[]; count: number }>(url, {
        headers: getAuthHeaders(),
      })

      if (response.success) {
        return response.data || []
      }
      throw new Error('Failed to fetch comments')
    } catch (error: any) {
      console.error('[useTasks] Error fetching comments:', error)
      throw error
    }
  }

  const deleteComment = async (commentId: number): Promise<boolean> => {
    try {
      const url = `${apiBaseUrl}/tasks/comments/${commentId}`
      const response = await $fetch<{ success: boolean; message: string }>(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      return response.success
    } catch (error: any) {
      console.error('[useTasks] Error deleting comment:', error)
      throw error
    }
  }

  return {
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    archiveTask,
    unarchiveTask,
    addAssignees,
    removeAssignees,
    addCustomers,
    removeCustomers,
    addComment,
    fetchComments,
    deleteComment,
  }
}

