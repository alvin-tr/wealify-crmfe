export interface Notification {
  id: number
  title: string
  message?: string | null
  type?: string | null
  payload?: any
  created_at: string
  seen: number
  seen_at: string | null
}

export interface NotificationsResponse {
  success: boolean
  data: Notification[]
  count: number
  unread_count: number
}

export interface UnreadCountResponse {
  success: boolean
  data: {
    unread_count: number
  }
}

export const useNotifications = () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const pusherChannel = ref<any>(null)
  const pusher = ref<any>(null)
  const onNotificationCallback = ref<((notification: Notification) => void) | null>(null)

  const getAuthHeaders = (): Record<string, string> => {
    const raw = auth?.getAuthHeaders?.() ?? {}
    return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string' && value.length > 0) {
        acc[key] = value
      }
      return acc
    }, {})
  }

  const fetchNotifications = async (options?: {
    seen?: boolean
    limit?: number
    offset?: number
  }): Promise<Notification[]> => {
    try {
      loading.value = true
      const userId = auth.user.value?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const params = new URLSearchParams()
      if (options?.seen !== undefined) {
        params.set('seen', options.seen ? 'true' : 'false')
      }
      if (options?.limit) {
        params.set('limit', String(options.limit))
      }
      if (options?.offset) {
        params.set('offset', String(options.offset))
      }

      const url = `${apiBaseUrl}/notifications${params.toString() ? `?${params.toString()}` : ''}`
      const response = await $fetch<NotificationsResponse>(url, {
        headers: getAuthHeaders(),
      })

      if (response.success) {
        notifications.value = response.data || []
        unreadCount.value = response.unread_count || 0
        return notifications.value
      }
      throw new Error('Failed to fetch notifications')
    } catch (error: any) {
      console.error('[useNotifications] Error fetching notifications:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchUnreadCount = async (): Promise<number> => {
    try {
      const userId = auth.user.value?.id
      if (!userId) {
        return 0
      }

      const url = `${apiBaseUrl}/notifications/unread-count`
      const response = await $fetch<UnreadCountResponse>(url, {
        headers: getAuthHeaders(),
      })

      if (response.success) {
        unreadCount.value = response.data.unread_count || 0
        return unreadCount.value
      }
      return 0
    } catch (error: any) {
      console.error('[useNotifications] Error fetching unread count:', error)
      return 0
    }
  }

  const markAsSeen = async (notificationId: number): Promise<boolean> => {
    try {
      const userId = auth.user.value?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const url = `${apiBaseUrl}/notifications/${notificationId}/seen`
      const response = await $fetch<{ success: boolean; message: string }>(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })

      if (response.success) {
        // Update local state
        const notification = notifications.value.find((n) => n.id === notificationId)
        if (notification) {
          notification.seen = 1
          notification.seen_at = new Date().toISOString()
          if (unreadCount.value > 0) {
            unreadCount.value--
          }
        }
        return true
      }
      return false
    } catch (error: any) {
      console.error('[useNotifications] Error marking notification as seen:', error)
      throw error
    }
  }

  const markAllAsSeen = async (): Promise<number> => {
    try {
      const userId = auth.user.value?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const url = `${apiBaseUrl}/notifications/mark-all-seen`
      const response = await $fetch<{ success: boolean; data: { marked_count: number }; message: string }>(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })

      if (response.success) {
        const markedCount = response.data.marked_count || 0
        // Update local state
        notifications.value.forEach((notification) => {
          if (notification.seen === 0) {
            notification.seen = 1
            notification.seen_at = new Date().toISOString()
          }
        })
        unreadCount.value = 0
        return markedCount
      }
      return 0
    } catch (error: any) {
      console.error('[useNotifications] Error marking all as seen:', error)
      throw error
    }
  }

  const deleteNotification = async (notificationId: number): Promise<boolean> => {
    try {
      const userId = auth.user.value?.id
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const url = `${apiBaseUrl}/notifications/${notificationId}`
      const response = await $fetch<{ success: boolean; message: string }>(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (response.success) {
        // Remove from local state
        const index = notifications.value.findIndex((n) => n.id === notificationId)
        if (index !== -1) {
          const notification = notifications.value[index]
          if (notification.seen === 0 && unreadCount.value > 0) {
            unreadCount.value--
          }
          notifications.value.splice(index, 1)
        }
        return true
      }
      return false
    } catch (error: any) {
      console.error('[useNotifications] Error deleting notification:', error)
      throw error
    }
  }

  const initializePusher = async () => {
    try {
      // Disconnect existing connection if any
      if (pusher.value) {
        console.log('[useNotifications] Disconnecting existing Pusher connection')
        disconnectPusher()
      }

      const userId = auth.user.value?.id
      if (!userId) {
        console.warn('[useNotifications] Cannot initialize Pusher: user not authenticated')
        return
      }

      // Dynamically import pusher-js
      const Pusher = (await import('pusher-js')).default

      const pusherKey = config.public.pusherKey
      const pusherCluster = config.public.pusherCluster || 'ap1'

      if (!pusherKey) {
        console.warn('[useNotifications] Pusher key not configured. Real-time notifications will be disabled.')
        return
      }

      console.log('[useNotifications] Initializing Pusher with key:', pusherKey?.substring(0, 10) + '...', 'cluster:', pusherCluster)
      console.log('[useNotifications] API Base URL:', apiBaseUrl)
      
      // Use /pusher/auth endpoint (requires authentication via TokenAuthGuard)
      // Backend will extract user_id from authenticated user
      const authEndpointUrl = `${apiBaseUrl}/pusher/auth`
      console.log('[useNotifications] Auth endpoint URL:', authEndpointUrl)
      console.log('[useNotifications] User ID:', userId)
      console.log('[useNotifications] Auth headers:', getAuthHeaders())

      // Pusher auth config - backend will get user_id from authenticated user via TokenAuthGuard
      const authHeaders = getAuthHeaders()
      pusher.value = new Pusher(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: authEndpointUrl,
        auth: {
          headers: authHeaders,
        },
        enabledTransports: ['ws', 'wss'],
      })

      console.log('[useNotifications] Pusher instance created:', pusher.value)

      // Handle Pusher connection events
      pusher.value.connection.bind('connected', () => {
        console.log('[useNotifications] ✅ Pusher connected successfully')
        console.log('[useNotifications] Pusher connection state:', pusher.value.connection.state)
        console.log('[useNotifications] Pusher socket ID:', pusher.value.connection.socket_id)
      })

      pusher.value.connection.bind('disconnected', () => {
        console.log('[useNotifications] ⚠️ Pusher disconnected')
      })

      pusher.value.connection.bind('error', (error: any) => {
        console.error('[useNotifications] ❌ Pusher connection error:', error)
        console.error('[useNotifications] Error details:', JSON.stringify(error, null, 2))
      })

      pusher.value.connection.bind('state_change', (states: any) => {
        console.log('[useNotifications] 🔄 Pusher state changed:', states.previous, '->', states.current)
      })

      const channelName = `private-user-${userId}`
      console.log('[useNotifications] 📡 Subscribing to channel:', channelName)
      console.log('[useNotifications] ⚠️ IMPORTANT: Backend should trigger to channel:', channelName)

      pusherChannel.value = pusher.value.subscribe(channelName)
      console.log('[useNotifications] Channel subscription initiated, channel object:', pusherChannel.value)
      console.log('[useNotifications] Channel name from object:', pusherChannel.value?.name)

      // Wait for subscription to be successful
      pusherChannel.value.bind('pusher:subscription_succeeded', () => {
        console.log('[useNotifications] ✅ Successfully subscribed to channel:', channelName)
        console.log('[useNotifications] Channel subscription state:', pusherChannel.value.subscribed)
        console.log('[useNotifications] Channel name:', pusherChannel.value.name)
        console.log('[useNotifications] ✅ Ready to receive notifications on channel:', channelName)
      })

      pusherChannel.value.bind('pusher:subscription_error', (error: any) => {
        console.error('[useNotifications] ❌ Subscription error:', error)
        console.error('[useNotifications] Subscription error details:', JSON.stringify(error, null, 2))
        console.error('[useNotifications] Failed to subscribe to channel:', channelName)
      })

      // Bind to notification event
      pusherChannel.value.bind('notification', (data: Notification) => {
        console.log('[useNotifications] 🔔 Received real-time notification:', data)
        console.log('[useNotifications] Notification received on channel:', pusherChannel.value?.name)
        
        // Check if notification already exists (avoid duplicates)
        const existingIndex = notifications.value.findIndex((n) => n.id === data.id)
        if (existingIndex === -1) {
          // Add new notification to the beginning of the list
          notifications.value.unshift({
            ...data,
            seen: 0,
            seen_at: null,
          })
          // Increment unread count
          unreadCount.value++
          
          // Call callback if provided (for showing toast in component)
          if (onNotificationCallback.value) {
            try {
              onNotificationCallback.value(data)
            } catch (error) {
              console.error('[useNotifications] Error in notification callback:', error)
            }
          }
        } else {
          console.log('[useNotifications] Notification already exists, skipping duplicate')
        }
      })

      console.log('[useNotifications] Pusher initialized and subscribed to channel:', channelName)
    } catch (error: any) {
      console.error('[useNotifications] Error initializing Pusher:', error)
      console.error('[useNotifications] Error stack:', error?.stack)
    }
  }

  const disconnectPusher = () => {
    if (pusherChannel.value) {
      pusherChannel.value.unbind_all()
      pusherChannel.value.unsubscribe()
      pusherChannel.value = null
    }
    if (pusher.value) {
      pusher.value.disconnect()
      pusher.value = null
    }
  }

  const setOnNotificationCallback = (callback: (notification: Notification) => void) => {
    onNotificationCallback.value = callback
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    fetchNotifications,
    fetchUnreadCount,
    markAsSeen,
    markAllAsSeen,
    deleteNotification,
    initializePusher,
    disconnectPusher,
    setOnNotificationCallback,
  }
}

