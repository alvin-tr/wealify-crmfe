<template>
  <header :class="['h-16 flex items-center px-6 border-b shadow-sm transition-colors duration-300', isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200']">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2" aria-label="Breadcrumb">
      <ol class="flex items-center gap-2">
        <li
          v-for="(item, index) in breadcrumbItems"
          :key="`${item.path || 'current'}-${index}`"
          class="flex items-center gap-2"
        >
          <NuxtLink
            v-if="index < breadcrumbItems.length - 1 && item.path"
            :to="item.path"
            class="text-sm font-medium transition-colors"
            :class="isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'"
          >
            {{ item.label }}
          </NuxtLink>
          <span
            v-else
            :class="['text-sm font-semibold', isDark ? 'text-gray-100' : 'text-gray-900']"
          >
            {{ item.label }}
          </span>
          <UIcon
            v-if="index < breadcrumbItems.length - 1"
            name="i-heroicons-chevron-right"
            class="h-4 w-4 text-gray-400"
          />
        </li>
      </ol>
    </nav>
    <div class="ml-auto flex items-center gap-4">
      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        :class="['p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600']"
        :title="isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'"
      >
        <span v-if="isDark" class="text-lg">☀️</span>
        <span v-else class="text-lg">🌙</span>
      </button>
      <!-- Notifications -->
      <nav v-if="auth.user.value" class="relative">
        <div
          ref="notificationButtonRef"
          class="relative cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
          @click="toggleNotifications"
        >
          <UIcon name="i-heroicons-bell" class="h-6 w-6 text-gray-600" />
          <UBadge
            v-if="unreadCount > 0"
            :label="unreadCount > 99 ? '99+' : String(unreadCount)"
            color="error"
            variant="solid"
            class="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-semibold px-1"
          />
        </div>

        <!-- Notifications Dropdown -->
        <div
          ref="notificationDropdownRef"
          class="notifications-dropdown absolute top-[calc(100%+16px)] right-0 w-[380px] max-h-[500px] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] z-50 transition-all duration-300 rounded-lg overflow-hidden"
          :class="{
            'opacity-0 -translate-y-2.5 invisible': !isNotificationsOpen,
            'opacity-100 translate-y-0 visible': isNotificationsOpen,
          }"
        >
          <!-- Dropdown Arrow -->
          <div class="menu-arrow absolute -top-2.5 right-6 w-5 h-5 bg-white transform rotate-45 -z-10"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
            <div class="flex items-center gap-2">
              <UButton
                v-if="unreadCount > 0"
                variant="ghost"
                color="primary"
                size="xs"
                @click="handleMarkAllAsSeen"
                :loading="markingAllAsSeen"
              >
                Mark all as read
              </UButton>
            </div>
          </div>

          <!-- Notifications List -->
          <div class="max-h-[400px] overflow-y-auto">
            <div v-if="notificationsLoading" class="flex items-center justify-center py-8">
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <span>Loading notifications...</span>
              </div>
            </div>
            <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
              <UIcon name="i-heroicons-bell-slash" class="h-12 w-12 text-gray-300 mb-2" />
              <p class="text-sm font-medium text-gray-700">No notifications</p>
              <p class="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                :class="{ 'bg-blue-50': notification.seen === 0 }"
                @click="handleNotificationClick(notification)"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                    :class="notification.seen === 0 ? 'bg-primary-500' : 'bg-transparent'"
                  ></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-sm font-semibold text-gray-900" :class="{ 'font-bold': notification.seen === 0 }">
                        {{ notification.title }}
                      </p>
                      <UButton
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        icon="i-heroicons-x-mark"
                        class="flex-shrink-0"
                        @click.stop="handleDeleteNotification(notification.id)"
                      />
                    </div>
                    <p v-if="notification.message" class="text-sm text-gray-600 mt-1 line-clamp-2">
                      {{ notification.message }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formatRelativeTime(notification.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Profile Section -->
      <nav v-if="auth.user.value" class="relative">
        <!-- Profile Section -->
        <div
          ref="userMenuButtonRef"
          class="profile flex items-center justify-end gap-3 cursor-pointer"
          @click="isUserMenuOpen = !isUserMenuOpen"
        >
          <div class="user flex flex-col text-right">
            <h3 class="text-base font-semibold text-gray-900 leading-none mb-1">{{ auth.user.value.full_name }}</h3>
            <p class="text-sm text-gray-600 leading-none opacity-60">{{ `@${auth.user.value.username || auth.user.value.role?.toLowerCase() || 'user'}` }}</p>
          </div>
          <div class="img-box relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <img
              v-if="auth.user.value.avatar"
              :src="auth.user.value.avatar"
              :alt="auth.user.value.full_name"
              class="absolute top-0 left-0 w-full h-full object-cover"
            />
            <div
              v-else
              class="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold"
            >
              {{ getInitials(auth.user.value.full_name) }}
            </div>
          </div>
        </div>

        <!-- Dropdown Menu -->
        <div
          ref="userMenuRef"
          class="menu absolute top-[calc(100%+24px)] right-4 w-[200px] min-h-[100px] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] z-50 transition-all duration-300"
          :class="{
            'opacity-0 -translate-y-2.5 invisible': !isUserMenuOpen,
            'opacity-100 translate-y-0 visible': isUserMenuOpen,
          }"
        >
          <!-- Tooltip Arrow -->
          <div class="menu-arrow absolute -top-2.5 right-[14px] w-5 h-5 bg-white transform rotate-45 -z-10"></div>
          
          <!-- Menu Items -->
          <ul class="relative flex flex-col z-10 bg-white">
            <li v-if="auth.user.value?.role === 'sales'" class="hover:bg-gray-100">
              <button
                type="button"
                class="menu-link w-full flex items-center py-[15px] px-5 gap-1.5 text-gray-900 no-underline"
                @click="handleUpdateContactClick"
              >
                <span class="slds-icon-glyph slds-icons-contact text-xl" aria-hidden="true"></span>
                <span>Update Contact</span>
              </button>
            </li>
            <li class="hover:bg-gray-100">
              <button
                type="button"
                class="menu-link w-full flex items-center py-[15px] px-5 gap-1.5 text-gray-900 no-underline"
                @click="handleChangePasswordClick"
              >
                <span class="slds-icon-glyph slds-icons-key text-xl" aria-hidden="true"></span>
                <span>Change Password</span>
              </button>
            </li>
            <li class="hover:bg-gray-100">
              <button
                type="button"
                class="menu-link w-full flex items-center py-[15px] px-5 gap-1.5 no-underline"
                @click="handleLogout"
              >
                <span 
                  class="slds-icon-glyph slds-icons-logout text-xl" 
                  style="color: #dc2626; --icon-color: #dc2626;"
                  aria-hidden="true"
                ></span>
                <span class="text-red-600">Sign Out</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Change Password Modal -->
      <UModal v-model:open="isChangePasswordOpen" title="Change Password">
        <template #body>
          <form class="space-y-4" @submit.prevent="handleChangePasswordSubmit">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Current Password</label>
              <UInput
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="Enter current password"
                icon="i-heroicons-lock-closed"
                required
                :disabled="changingPassword"
                :error="!!passwordErrors.oldPassword"
                @input="passwordErrors.oldPassword = ''"
              />
              <p v-if="passwordErrors.oldPassword" class="text-xs text-red-600">{{ passwordErrors.oldPassword }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">New Password</label>
              <UInput
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="Enter new password"
                icon="i-heroicons-key"
                required
                :disabled="changingPassword"
                :error="!!passwordErrors.newPassword"
                @blur="validatePasswords"
                @input="validatePasswords"
              />
              <p v-if="passwordErrors.newPassword" class="text-xs text-red-600">{{ passwordErrors.newPassword }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Confirm New Password</label>
              <UInput
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirm new password"
                icon="i-heroicons-key"
                required
                :disabled="changingPassword"
                :error="!!passwordErrors.confirmPassword"
                @blur="validatePasswords"
                @input="validatePasswords"
              />
              <p v-if="passwordErrors.confirmPassword" class="text-xs text-red-600">{{ passwordErrors.confirmPassword }}</p>
            </div>
          </form>
        </template>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="changingPassword"
              @click="isChangePasswordOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="changingPassword"
              @click="handleChangePasswordSubmit"
            >
              Change Password
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Update Contact Modal -->
      <UModal v-model:open="isUpdateContactOpen" title="Update Contact">
        <template #body>
          <form class="space-y-4" @submit.prevent="handleUpdateContactSubmit">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Phone</label>
              <UInput
                v-model="contactForm.phone"
                type="tel"
                placeholder="Enter phone number"
                icon="i-heroicons-phone"
                :disabled="updatingContact"
                :error="!!contactErrors.phone"
                @input="contactErrors.phone = ''"
              />
              <p v-if="contactErrors.phone" class="text-xs text-red-600">{{ contactErrors.phone }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Telegram</label>
              <UInput
                v-model="contactForm.telegram"
                type="text"
                placeholder="Enter telegram username"
                icon="i-heroicons-chat-bubble-left-right"
                :disabled="updatingContact"
                :error="!!contactErrors.telegram"
                @input="contactErrors.telegram = ''"
              />
              <p v-if="contactErrors.telegram" class="text-xs text-red-600">{{ contactErrors.telegram }}</p>
            </div>
          </form>
        </template>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="updatingContact"
              @click="isUpdateContactOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="updatingContact"
              @click="handleUpdateContactSubmit"
            >
              Update Contact
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { Notification } from '~/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const toast = useToast()
const { isDark, toggleTheme } = useTheme()

const isUserMenuOpen = ref(false)
const isChangePasswordOpen = ref(false)
const isUpdateContactOpen = ref(false)
const changingPassword = ref(false)
const updatingContact = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const userMenuButtonRef = ref<HTMLElement | null>(null)

// Notifications
const {
  notifications,
  unreadCount,
  loading: notificationsLoading,
  fetchNotifications,
  fetchUnreadCount,
  markAsSeen,
  markAllAsSeen,
  deleteNotification,
  initializePusher,
  disconnectPusher,
  setOnNotificationCallback,
} = useNotifications()

const isNotificationsOpen = ref(false)
const notificationButtonRef = ref<HTMLElement | null>(null)
const notificationDropdownRef = ref<HTMLElement | null>(null)
const markingAllAsSeen = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordErrors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const contactForm = reactive({
  phone: '',
  telegram: '',
})

const contactErrors = reactive({
  phone: '',
  telegram: '',
})

const config = useRuntimeConfig()

// Path to label mapping
const pathLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/groups': 'Groups',
  '/leads': 'Leads',
  '/leads/history': 'History',
  '/customer-care': 'Customer Care',
  '/customer-care/monitoring': 'Monitoring',
  '/customer-care/history': 'History',
  '/tasks': 'Tasks',
  '/sales-users': 'Sales Users',
  '/settings': 'Settings',
}

// Helper to format segment to label
const formatSegment = (segment: string): string => {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Generate breadcrumb items from current route
const breadcrumbItems = computed(() => {
  const items: Array<{ label: string; path: string | null }> = []
  const currentPath = route.path

  // If we're on dashboard, return only Dashboard
  if (currentPath === '/') {
    return [{ label: 'Dashboard', path: null }]
  }

  // Split path into segments
  const segments = currentPath.split('/').filter(Boolean)
  
  // Build breadcrumb by accumulating path segments
  let accumulatedPath = ''
  
  for (let i = 0; i < segments.length; i++) {
    accumulatedPath += `/${segments[i]}`
    
    // Check if we have a label for this exact path
    let label = pathLabels[accumulatedPath]
    
    // If no exact match, try to handle dynamic routes
    if (!label) {
      // Handle dynamic routes like /sales-users/[id]
      if (accumulatedPath.startsWith('/sales-users/') && accumulatedPath !== '/sales-users') {
        // Check if we can get the name from route params or query
        const userId = route.params.id || segments[i]
        label = `User #${userId}`
      } else {
        // Fallback: format the segment
        label = formatSegment(segments[i])
      }
    }
    
    // Determine if this is the last item (current page)
    const isLast = i === segments.length - 1
    
    items.push({
      label,
      path: isLast ? null : accumulatedPath, // Last item is not clickable
    })
  }

  return items
})

const handleChangePasswordClick = () => {
  isUserMenuOpen.value = false
  isChangePasswordOpen.value = true
}

const handleUpdateContactClick = async () => {
  isUserMenuOpen.value = false
  
  // Fetch current sales user info to populate form
  try {
    const { fetchSalesUsers } = useSalesUsers()
    const salesUsers = await fetchSalesUsers()
    const currentUser = auth.user.value
    
    if (!currentUser) {
      toast.add({
        title: 'Error',
        description: 'User not found',
        color: 'error',
      })
      return
    }
    
    // Find sales user that matches current user's id
    const salesUser = salesUsers.find(
      (u: any) => u.user_id === currentUser.id
    )
    
    if (!salesUser) {
      toast.add({
        title: 'Error',
        description: 'Sales user not found',
        color: 'error',
      })
      return
    }
    
    // Populate form with current values
    contactForm.phone = salesUser.phone || ''
    contactForm.telegram = salesUser.telegram || ''
    contactErrors.phone = ''
    contactErrors.telegram = ''
    
    isUpdateContactOpen.value = true
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to load contact information',
      color: 'error',
    })
  }
}

const getInitials = (name: string): string => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const handleLogout = async () => {
  await auth.logout()
  await router.push('/login')
}

const validatePasswords = () => {
  // Use nextTick to ensure v-model has updated
  nextTick(() => {
    // Clear previous errors
    passwordErrors.newPassword = ''
    passwordErrors.confirmPassword = ''

    const newPassword = String(passwordForm.newPassword || '').trim()
    const confirmPassword = String(passwordForm.confirmPassword || '').trim()

    // Debug logging (can remove later)
    if (newPassword && confirmPassword) {
      console.log('Password validation:', {
        newPassword: `"${newPassword}"`,
        confirmPassword: `"${confirmPassword}"`,
        newLength: newPassword.length,
        confirmLength: confirmPassword.length,
        match: newPassword === confirmPassword,
        charCodes: {
          new: newPassword.split('').map(c => c.charCodeAt(0)),
          confirm: confirmPassword.split('').map(c => c.charCodeAt(0)),
        }
      })
    }

    // Validate new password length
    if (newPassword && newPassword.length < 6) {
      passwordErrors.newPassword = 'Password must be at least 6 characters'
      return
    }

    // Only validate password match if both fields have values
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        passwordErrors.confirmPassword = 'Passwords do not match'
      } else {
        // Clear error if passwords match
        passwordErrors.confirmPassword = ''
      }
    }
  })
}

const handleChangePasswordSubmit = async () => {
  // Reset errors
  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''

  // Trim values to remove any whitespace
  const oldPassword = passwordForm.oldPassword?.trim() || ''
  const newPassword = passwordForm.newPassword?.trim() || ''
  const confirmPassword = passwordForm.confirmPassword?.trim() || ''

  // Validate required fields
  if (!oldPassword || !newPassword || !confirmPassword) {
    if (!oldPassword) {
      passwordErrors.oldPassword = 'Current password is required'
    }
    if (!newPassword) {
      passwordErrors.newPassword = 'New password is required'
    }
    if (!confirmPassword) {
      passwordErrors.confirmPassword = 'Please confirm your new password'
    }
    toast.add({
      title: 'All fields required',
      description: 'Please fill in all password fields',
      color: 'error',
    })
    return
  }

  // Validate password length
  if (newPassword.length < 6) {
    passwordErrors.newPassword = 'Password must be at least 6 characters'
    toast.add({
      title: 'Password too short',
      description: 'Password must be at least 6 characters',
      color: 'error',
    })
    return
  }

  // Validate password match (use trimmed values and strict comparison)
  // Debug logging
  console.log('Submit validation:', {
    newPassword: `"${newPassword}"`,
    confirmPassword: `"${confirmPassword}"`,
    newLength: newPassword.length,
    confirmLength: confirmPassword.length,
    match: newPassword === confirmPassword,
    newPasswordCharCodes: newPassword.split('').map((c, i) => `${i}:${c.charCodeAt(0)}(${c})`).join(', '),
    confirmPasswordCharCodes: confirmPassword.split('').map((c, i) => `${i}:${c.charCodeAt(0)}(${c})`).join(', '),
  })

  if (newPassword !== confirmPassword) {
    passwordErrors.confirmPassword = 'Passwords do not match'
    toast.add({
      title: 'Password mismatch',
      description: `New password and confirm password do not match. Length: ${newPassword.length} vs ${confirmPassword.length}`,
      color: 'error',
    })
    return
  }

  changingPassword.value = true
  try {
    const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
    const url = `${apiBaseUrl}/auth/change-password`

    const authHeaders = auth.getAuthHeaders()
    const headers: Record<string, string> = {}
    if (authHeaders.Authorization) {
      headers.Authorization = authHeaders.Authorization
    }

    const response = await $fetch<{
      success: boolean
      message: string
    }>(url, {
      method: 'POST',
      body: {
        current_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      headers,
    })

    if (response.success) {
      toast.add({
        title: 'Password changed',
        description: response.message || 'Your password has been updated successfully',
        color: 'success',
      })
      // Reset form and close modal
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      passwordErrors.oldPassword = ''
      passwordErrors.newPassword = ''
      passwordErrors.confirmPassword = ''
      isChangePasswordOpen.value = false
    } else {
      throw new Error(response.message || 'Failed to change password')
    }
  } catch (error: any) {
    const errorMessage = error?.data?.message || error?.message || 'Unknown error'
    
    // Check if error is related to current password
    if (errorMessage.toLowerCase().includes('current password') || errorMessage.toLowerCase().includes('incorrect')) {
      passwordErrors.oldPassword = errorMessage
    }
    
    toast.add({
      title: 'Failed to change password',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    changingPassword.value = false
  }
}

const handleUpdateContactSubmit = async () => {
  // Reset errors
  contactErrors.phone = ''
  contactErrors.telegram = ''

  // Get sales_user_id
  try {
    const { fetchSalesUsers } = useSalesUsers()
    const salesUsers = await fetchSalesUsers()
    const currentUser = auth.user.value
    
    if (!currentUser) {
      toast.add({
        title: 'Error',
        description: 'User not found',
        color: 'error',
      })
      return
    }
    
    // Find sales user that matches current user's id
    const salesUser = salesUsers.find(
      (u: any) => u.user_id === currentUser.id
    )
    
    if (!salesUser) {
      toast.add({
        title: 'Error',
        description: 'Sales user not found',
        color: 'error',
      })
      return
    }
    
    const salesUserId = salesUser.sales_user_id ?? salesUser.id
    if (!salesUserId) {
      toast.add({
        title: 'Error',
        description: 'Sales user ID not found',
        color: 'error',
      })
      return
    }

    updatingContact.value = true
    
    const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
    const url = `${apiBaseUrl}/customer-assignments/sales-user/contact?sales_user_id=${salesUserId}`

    const authHeaders = auth.getAuthHeaders()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authHeaders.Authorization) {
      headers.Authorization = authHeaders.Authorization
    }

    const response = await $fetch<{
      success: boolean
      message: string
    }>(url, {
      method: 'PUT',
      body: {
        phone: contactForm.phone.trim() || null,
        telegram: contactForm.telegram.trim() || null,
      },
      headers,
    })

    if (response.success) {
      toast.add({
        title: 'Contact updated',
        description: response.message || 'Your contact information has been updated successfully',
        color: 'success',
      })
      // Close modal
      isUpdateContactOpen.value = false
    } else {
      throw new Error(response.message || 'Failed to update contact')
    }
  } catch (error: any) {
    const errorMessage = error?.data?.message || error?.message || 'Unknown error'
    
    // Check if error is related to specific fields
    if (errorMessage.toLowerCase().includes('phone')) {
      contactErrors.phone = errorMessage
    } else if (errorMessage.toLowerCase().includes('telegram')) {
      contactErrors.telegram = errorMessage
    }
    
    toast.add({
      title: 'Failed to update contact',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    updatingContact.value = false
  }
}

// Reset form when modal closes
watch(isChangePasswordOpen, (isOpen) => {
  if (!isOpen) {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordErrors.oldPassword = ''
    passwordErrors.newPassword = ''
    passwordErrors.confirmPassword = ''
  }
})

watch(isUpdateContactOpen, (isOpen) => {
  if (!isOpen) {
    contactForm.phone = ''
    contactForm.telegram = ''
    contactErrors.phone = ''
    contactErrors.telegram = ''
  }
})

const toggleNotifications = () => {
  isNotificationsOpen.value = !isNotificationsOpen.value
  if (isNotificationsOpen.value && notifications.value.length === 0) {
    fetchNotifications({ limit: 20 })
  }
  // Close user menu when opening notifications
  if (isNotificationsOpen.value) {
    isUserMenuOpen.value = false
  }
}

const handleNotificationClick = async (notification: Notification) => {
  if (notification.seen === 0) {
    try {
      await markAsSeen(notification.id)
    } catch (error: any) {
      console.error('[HeaderBar] Error marking notification as seen:', error)
    }
  }
  // Close dropdown after click
  isNotificationsOpen.value = false

  // Navigate based on notification type and payload
  const payload = notification.payload
  if (notification.type === 'customer_assigned' && payload?.customer_ids?.length) {
    // Deep-link to the first assigned customer's detail page
    const firstCustomerId = payload.customer_ids[0]
    await router.push(`/customers?customer_id=${firstCustomerId}`)
  } else if (payload?.link_url) {
    // Generic deep-link: any notification with a link_url payload
    await router.push(payload.link_url)
  }
}

const handleMarkAllAsSeen = async () => {
  if (unreadCount.value === 0) return
  markingAllAsSeen.value = true
  try {
    await markAllAsSeen()
    toast.add({
      title: 'All notifications marked as read',
      color: 'success',
    })
  } catch (error: any) {
    toast.add({
      title: 'Failed to mark all as read',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    markingAllAsSeen.value = false
  }
}

const handleDeleteNotification = async (notificationId: number) => {
  try {
    await deleteNotification(notificationId)
    toast.add({
      title: 'Notification deleted',
      color: 'success',
    })
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete notification',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '—'
  
  // Backend trả về thời gian UTC nhưng không có timezone info (ví dụ: "2025-11-21 10:47:54")
  // Fix cứng: Cộng thêm 7 giờ (GMT+7) vào thời gian từ backend
  const TIMEZONE_OFFSET_HOURS = 7
  const TIMEZONE_OFFSET_MS = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
  
  let date: Date
  
  if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
    // ISO format with timezone - parse và cộng thêm 7 giờ
    date = new Date(dateString)
    date = new Date(date.getTime() + TIMEZONE_OFFSET_MS)
  } else if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    // MySQL datetime format without timezone (e.g., "2025-11-21 10:47:54")
    // Parse như UTC và cộng thêm 7 giờ
    const utcDate = new Date(dateString.replace(' ', 'T') + 'Z')
    date = new Date(utcDate.getTime() + TIMEZONE_OFFSET_MS)
  } else {
    // Try to parse as-is và cộng thêm 7 giờ
    date = new Date(dateString)
    date = new Date(date.getTime() + TIMEZONE_OFFSET_MS)
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('[formatRelativeTime] Invalid date string:', dateString)
    return '—'
  }
  
  // Use local time for comparison
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

// Handle click outside to close menus
const handleClickOutside = (event: MouseEvent) => {
  // Close user menu
  if (
    isUserMenuOpen.value &&
    userMenuRef.value &&
    userMenuButtonRef.value &&
    !userMenuRef.value.contains(event.target as Node) &&
    !userMenuButtonRef.value.contains(event.target as Node)
  ) {
    isUserMenuOpen.value = false
  }

  // Close notifications dropdown
  if (
    isNotificationsOpen.value &&
    notificationDropdownRef.value &&
    notificationButtonRef.value &&
    !notificationDropdownRef.value.contains(event.target as Node) &&
    !notificationButtonRef.value.contains(event.target as Node)
  ) {
    isNotificationsOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  // Set callback for real-time notifications
  setOnNotificationCallback((notification: Notification) => {
    // Show toast notification (only if not in background)
    if (typeof window !== 'undefined' && document.visibilityState === 'visible') {
      toast.add({
        title: notification.title,
        description: notification.message || '',
        color: 'primary',
      })
    }
  })
  
  // Initialize notifications
  if (auth.user.value?.id) {
    const userId = auth.user.value.id
    console.log('[HeaderBar] Initializing notifications for user ID:', userId)
    console.log('[HeaderBar] User object:', auth.user.value)
    console.log('[HeaderBar] ⚠️ IMPORTANT: Will subscribe to channel: private-user-' + userId)
    await fetchUnreadCount()
    console.log('[HeaderBar] Calling initializePusher...')
    await initializePusher()
    console.log('[HeaderBar] initializePusher completed')
  } else {
    console.warn('[HeaderBar] User not authenticated, skipping Pusher initialization')
    console.warn('[HeaderBar] auth.user.value:', auth.user.value)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  disconnectPusher()
})

// Watch for auth changes
watch(() => auth.user.value?.id, async (userId, oldUserId) => {
  // Only reinitialize if userId actually changed
  if (userId && userId !== oldUserId) {
    console.log('[HeaderBar] User ID changed, reinitializing notifications:', oldUserId, '->', userId)
    await fetchUnreadCount()
    await initializePusher()
  } else if (!userId && oldUserId) {
    console.log('[HeaderBar] User logged out, disconnecting Pusher')
    disconnectPusher()
    // Clear notifications by fetching empty list (or just let it clear on next login)
    // notifications and unreadCount are readonly, so we can't directly modify them
    // They will be cleared when component unmounts or when new user logs in
  }
}, { immediate: false })
</script>

<style scoped>
.menu-link .slds-icons-logout::before {
  color: #dc2626 !important;
}

.notifications-dropdown {
  border: 1px solid #e5e7eb;
}

.notification-item {
  transition: background-color 0.15s ease;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
