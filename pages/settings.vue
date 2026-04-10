<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <p class="text-sm text-gray-500 mt-1">
          Configure application preferences and manage internal user accounts.
        </p>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Workspace Settings</h2>
            <p class="text-sm text-gray-500">Switch between general preferences and user management tools.</p>
          </div>
        </div>
      </template>

      <UTabs v-model="activeTab" :items="tabItems" class="w-full" />

      <div class="mt-6">
        <div v-if="activeTab === 'general'" class="space-y-4">
          <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 class="text-base font-semibold text-gray-800">General preferences</h3>
            <p class="mt-2 text-sm text-gray-500">
              This area is reserved for upcoming configuration options such as notification preferences,
              integrations, and workspace defaults.
            </p>
            <p class="mt-4 text-sm text-gray-400">
              Have suggestions? Let the product team know and we can prioritise the settings that matter most
              to your workflow.
            </p>
          </div>
        </div>

        <div v-else-if="activeTab === 'monitoring'" class="space-y-6">
          <div class="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-700">
            <p class="font-medium">Monitoring automation</p>
            <p class="mt-1 text-sky-600/80">
              Trigger back-office jobs to refresh transactional summaries or evaluate active monitoring rules
              whenever manual intervention is needed.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UCard>
              <template #header>
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold text-gray-900">Refresh summary data</h3>
                    <p class="mt-1 text-sm text-gray-500">
                      Rebuild the transaction summaries for every customer. Recommended after large data imports.
                    </p>
                  </div>
                  <UBadge variant="soft" color="info">POST /monitoring/refresh-summary</UBadge>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <p class="text-sm text-gray-600">
                  This job recalculates 7-day transaction counts, volumes, and recent activity markers stored in
                  the monitoring tables.
                </p>
                <div class="flex items-center justify-end">
                  <UButton
                    color="primary"
                    icon="i-heroicons-arrow-path"
                    :loading="monitoringLoading.refreshSummary"
                    :disabled="monitoringLoading.refreshSummary"
                    @click="triggerRefreshSummary"
                  >
                    Refresh summary
                  </UButton>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold text-gray-900">Run monitoring rules</h3>
                    <p class="mt-1 text-sm text-gray-500">
                      Evaluate all active rules, create new alerts, and resolve records that no longer match.
                    </p>
                  </div>
                  <UBadge variant="soft" color="success">POST /monitoring/run-rules</UBadge>
                </div>
              </template>

              <div class="flex flex-col gap-4">
                <p class="text-sm text-gray-600">
                  Use this to synchronise alerts after changing rule definitions or noticing mismatched statuses.
                </p>
                <div class="flex items-center justify-end">
                  <UButton
                    color="success"
                    icon="i-heroicons-play"
                    :loading="monitoringLoading.runRules"
                    :disabled="monitoringLoading.runRules"
                    @click="triggerRunRules"
                  >
                    Run rules
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div v-else-if="activeTab === 'users'" class="space-y-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-gray-900">Registered Users</h3>
                <UButton color="neutral" icon="i-heroicons-arrow-path" size="sm" @click="loadUsers" :loading="loadingUsers">Refresh</UButton>
              </div>
            </template>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Username</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Role</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Department</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Staff Code</th>
                    <th class="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                  <tr v-if="loadingUsers">
                    <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">Loading users...</td>
                  </tr>
                  <tr v-else-if="usersList.length === 0">
                    <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500">No registered users found.</td>
                  </tr>
                  <tr v-for="user in usersList" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{{ user.full_name }}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ user.username }}</td>
                    <td class="px-4 py-3 text-sm capitalize text-gray-700 dark:text-gray-300">{{ user.role }}</td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ user.sales_user?.department || '-' }}</td>
                    <td class="px-4 py-3 text-sm font-mono text-gray-500">{{ user.sales_user?.staff_code || '-' }}</td>
                    <td class="px-4 py-3 text-sm">
                      <UBadge :color="user.status === 'active' ? 'success' : user.status === 'locked' ? 'error' : 'neutral'" variant="subtle">
                        {{ user.status }}
                      </UBadge>
                    </td>
                    <td class="px-4 py-3 text-sm text-right">
                      <UButton color="neutral" variant="ghost" icon="i-heroicons-pencil-square" size="sm" @click="openEditModal(user)" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>

          <UDivider class="my-6" />

          <div class="rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <p class="font-medium">Create new CRM users</p>
            <p class="mt-1 text-emerald-600/80 dark:text-emerald-400/80">
              Only administrators can create accounts. New users will receive access immediately after the account is
              saved.
            </p>
          </div>

          <form class="space-y-6" @submit.prevent="handleCreateUser">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
              <div class="form-field form-field--compact">
                <label class="form-label" for="create-user-full-name">Full name</label>
                <UInput
                  id="create-user-full-name"
                  v-model="createUserForm.full_name"
                  placeholder="Nguyen Van A"
                  icon="i-heroicons-identification"
                  size="lg"
                  :disabled="isCreating"
                  :class="['form-input-plain', formError ? 'form-input-plain--error' : '']"
                />
              </div>

              <div class="form-field form-field--compact">
                <label class="form-label" for="create-user-username">Username</label>
                <UInput
                  id="create-user-username"
                  v-model="createUserForm.username"
                  placeholder="username"
                  icon="i-heroicons-user-circle"
                  size="lg"
                  autocomplete="username"
                  :disabled="isCreating"
                  :class="['form-input-plain', formError ? 'form-input-plain--error' : '']"
                />
              </div>

              <div class="form-field form-field--compact">
                <label class="form-label" for="create-user-password">Password</label>
                <UInput
                  id="create-user-password"
                  v-model="createUserForm.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  placeholder="Choose a strong password"
                  icon="i-heroicons-key"
                  size="lg"
                  autocomplete="new-password"
                  :disabled="isCreating"
                  :class="['form-input-plain', formError ? 'form-input-plain--error' : '']"
                  :ui="{ trailing: 'pe-1' }"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="passwordVisible ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                      @click="passwordVisible = !passwordVisible"
                    />
                  </template>
                </UInput>
              </div>

              <div class="form-field form-field--compact">
                <label class="form-label" for="create-user-confirm-password">Confirm password</label>
                <UInput
                  id="create-user-confirm-password"
                  v-model="createUserForm.confirmPassword"
                  :type="confirmPasswordVisible ? 'text' : 'password'"
                  placeholder="Re-enter password"
                  icon="i-heroicons-lock-closed"
                  size="lg"
                  autocomplete="new-password"
                  :disabled="isCreating"
                  :class="['form-input-plain', formError ? 'form-input-plain--error' : '']"
                  :ui="{ trailing: 'pe-1' }"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="confirmPasswordVisible ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                      :aria-label="confirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'"
                      @click="confirmPasswordVisible = !confirmPasswordVisible"
                    />
                  </template>
                </UInput>
                <p
                  v-if="createUserForm.confirmPassword.length > 0 && createUserForm.confirmPassword !== createUserForm.password"
                  class="text-xs text-red-500 mt-1"
                >
                  Passwords do not match.
                </p>
              </div>

              <div class="form-field form-field--compact">
                <label class="form-label" for="create-user-role">Role</label>
                <USelectMenu
                  id="create-user-role"
                  v-model="createUserForm.role"
                  :items="roleOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Select role"
                  class="w-full"
                  :disabled="isCreating || auth?.user?.value?.role !== 'admin'"
                />
                <p class="text-xs text-gray-400 mt-1">
                  Determines available features after login.
                </p>
              </div>

              <div class="form-field form-field--compact">
                <label class="form-label" for="create-user-status">Status</label>
                <USelectMenu
                  id="create-user-status"
                  v-model="createUserForm.status"
                  :items="statusOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Select status"
                  class="w-full"
                  :disabled="isCreating || auth?.user?.value?.role !== 'admin'"
                />
              </div>

              <div class="form-field form-field--compact md:col-span-2">
                <label class="form-label" for="create-user-avatar">Avatar URL</label>
                <UInput
                  id="create-user-avatar"
                  v-model="createUserForm.avatar"
                  placeholder="https://cdn.company.com/users/avatar.png"
                  icon="i-heroicons-photo"
                  size="lg"
                  :disabled="isCreating"
                  :class="['form-input-plain', formError ? 'form-input-plain--error' : '']"
                />
              </div>
            </div>

            <div v-if="formError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {{ formError }}
            </div>

            <div class="flex items-center justify-end gap-3">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                :disabled="isCreating"
                @click="resetCreateUserForm"
              >
                Reset
              </UButton>
              <UButton
                type="submit"
                color="primary"
                icon="i-heroicons-user-plus"
                :loading="isCreating"
                :disabled="!canCreateUser || isCreating"
              >
                Create user
              </UButton>
            </div>
          </form>
        </div>

        <div v-else-if="activeTab === 'server-logs'" class="space-y-6">
          <!-- System Info Panel -->
          <div class="grid gap-4 md:grid-cols-4">
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <div class="text-xs font-medium text-gray-400 uppercase tracking-wider">Uptime</div>
              <div class="mt-1 text-lg font-bold text-gray-900">{{ systemInfo?.server?.uptimeFormatted || '—' }}</div>
              <div class="text-xs text-gray-400 mt-0.5">since {{ systemInfo?.server?.startedAt ? new Date(systemInfo.server.startedAt).toLocaleString('vi-VN') : '—' }}</div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <div class="text-xs font-medium text-gray-400 uppercase tracking-wider">Memory (Heap)</div>
              <div class="mt-1 text-lg font-bold text-gray-900">{{ systemInfo?.memory?.heapUsed || '—' }}</div>
              <div class="text-xs text-gray-400 mt-0.5">of {{ systemInfo?.memory?.heapTotal || '—' }} total</div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <div class="text-xs font-medium text-gray-400 uppercase tracking-wider">Database</div>
              <div class="mt-1 text-lg font-bold" :class="systemInfo?.database?.status === 'connected' ? 'text-emerald-600' : 'text-red-600'">{{ systemInfo?.database?.status || '—' }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ systemInfo?.database?.latencyMs || 0 }}ms latency</div>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <div class="text-xs font-medium text-gray-400 uppercase tracking-wider">Auto-Assign</div>
              <div class="mt-1 text-lg font-bold" :class="systemInfo?.autoAssign?.featureEnabled ? 'text-emerald-600' : 'text-gray-400'">{{ systemInfo?.autoAssign?.featureEnabled ? 'ON' : 'OFF' }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ systemInfo?.autoAssign?.acceptingUsersCount || 0 }} sales accepting</div>
            </div>
          </div>

          <!-- Log Viewer Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1.5">
              <button v-for="lvl in logLevels" :key="lvl.value"
                class="px-2.5 py-1 text-xs font-semibold rounded-full border transition-all"
                :class="activeLogLevels.includes(lvl.value) ? lvl.activeClass : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300'"
                @click="toggleLogLevel(lvl.value)"
              >
                {{ lvl.label }}
              </button>
            </div>
            <div class="flex-1 min-w-[180px]">
              <UInput v-model="logSearchQuery" placeholder="Search logs..." icon="i-heroicons-magnifying-glass" size="sm" class="w-full" />
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full" :class="sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'"></span>
                <span class="text-xs text-gray-500">{{ sseConnected ? 'Live' : 'Disconnected' }}</span>
              </div>
              <UButton size="xs" :color="autoScroll ? 'primary' : 'neutral'" variant="soft" @click="autoScroll = !autoScroll">
                {{ autoScroll ? '⬇ Auto-scroll' : '⏸ Paused' }}
              </UButton>
              <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-trash" @click="clearLogs" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-arrow-path" @click="loadSystemInfo" :loading="loadingSystemInfo" />
            </div>
          </div>

          <!-- Terminal -->
          <div ref="terminalRef" class="terminal-container" @scroll="handleTerminalScroll">
            <div v-if="filteredLogs.length === 0" class="terminal-empty">
              <span class="text-gray-500">{{ logEntries.length === 0 ? 'Waiting for logs...' : 'No logs match current filters' }}</span>
            </div>
            <div v-for="entry in filteredLogs" :key="entry.id" class="terminal-line" :class="'terminal-line--' + entry.level.toLowerCase()">
              <span class="terminal-time">{{ formatLogTime(entry.timestamp) }}</span>
              <span class="terminal-level" :class="'terminal-level--' + entry.level.toLowerCase()">{{ entry.level.padEnd(5) }}</span>
              <span class="terminal-context">[{{ entry.context }}]</span>
              <span class="terminal-msg">{{ entry.message }}</span>
            </div>
          </div>
          <div class="text-xs text-gray-400 text-right">{{ filteredLogs.length }} / {{ logEntries.length }} entries</div>
        </div>
      </div>
    </UCard>

    <!-- Edit User Modal -->
    <UModal v-model:open="showEditModal">
      <template #body>
        <div class="space-y-4">
          <div class="font-semibold text-lg text-gray-900 pb-2 border-b border-gray-100">Edit User: <span class="text-primary-600">{{ editForm.username }}</span></div>
          
          <div class="form-field form-field--compact" style="max-width:100%">
            <label class="form-label">Full name</label>
            <UInput v-model="editForm.full_name" class="form-input-plain" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-field form-field--compact" style="max-width:100%">
              <label class="form-label">Role</label>
              <USelectMenu v-model="editForm.role" :items="roleOptions" :disabled="auth?.user?.value?.role !== 'admin'" class="w-full" label-key="label" value-key="value" />
            </div>
            <div class="form-field form-field--compact" style="max-width:100%">
              <label class="form-label">Status</label>
              <USelectMenu v-model="editForm.status" :items="statusOptions" :disabled="auth?.user?.value?.role !== 'admin'" class="w-full" label-key="label" value-key="value" />
            </div>
          </div>
          <div class="form-field form-field--compact" style="max-width:100%">
            <label class="form-label">Reset Password (optional)</label>
            <UInput v-model="editForm.password" type="password" placeholder="Leave empty to keep current password" class="form-input-plain" />
          </div>
          
          <UDivider label="Sales Information" class="my-4" />
          
          <div class="grid grid-cols-2 gap-4">
            <div class="form-field form-field--compact" style="max-width:100%">
              <label class="form-label">Staff Code</label>
              <UInput v-model="editForm.sales_staff_code" class="form-input-plain" />
            </div>
            <div class="form-field form-field--compact" style="max-width:100%">
              <label class="form-label">Department</label>
              <UInput v-model="editForm.sales_department" class="form-input-plain" :disabled="auth?.user?.value?.role !== 'admin'" />
            </div>
          </div>
          <div class="form-field form-field--compact" style="max-width:100%">
            <label class="form-label">Phone</label>
            <UInput v-model="editForm.sales_phone" class="form-input-plain" />
          </div>
          <div v-if="editFormError" class="text-xs text-red-500 mt-2">{{ editFormError }}</div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showEditModal = false">Cancel</UButton>
          <UButton color="primary" :loading="isEditing" @click="submitEditUser">Save Changes</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

const tabItems = computed(() => {
  const items = [
    {
      label: 'General',
      value: 'general',
      icon: 'i-heroicons-cog-6-tooth',
    },
    {
      label: 'Monitoring',
      value: 'monitoring',
      icon: 'i-heroicons-presentation-chart-line',
    },
    {
      label: 'User management',
      value: 'users',
      icon: 'i-heroicons-user-group',
    },
  ]
  // Server Logs tab — admin only
  if (auth?.user?.value?.role === 'admin') {
    items.push({
      label: 'Server Logs',
      value: 'server-logs',
      icon: 'i-heroicons-command-line',
    })
  }
  return items
})

const activeTab = ref<'general' | 'monitoring' | 'users' | 'server-logs'>('users')

const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
const auth = useAuth()
const toast = useToast()

const monitoringLoading = reactive({
  refreshSummary: false,
  runRules: false,
})

const callMonitoringEndpoint = async (
  endpoint: string,
  key: keyof typeof monitoringLoading,
  successMessage: string,
) => {
  if (monitoringLoading[key]) return

  try {
    monitoringLoading[key] = true
    await $fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: (auth?.getAuthHeaders?.() ?? {}) as unknown as HeadersInit,
    })

    toast.add({
      title: 'Request sent',
      description: successMessage,
      color: 'primary',
    })
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Request failed. Please try again.'
    toast.add({
      title: 'Monitoring request failed',
      description: message,
      color: 'error',
    })
  } finally {
    monitoringLoading[key] = false
  }
}

const triggerRefreshSummary = () =>
  callMonitoringEndpoint(
    '/monitoring/refresh-summary',
    'refreshSummary',
    'Transaction summaries are being refreshed.',
  )

const triggerRunRules = () =>
  callMonitoringEndpoint('/monitoring/run-rules', 'runRules', 'Monitoring rules are running now.')

const roleOptions = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Sales Manager', value: 'sales_manager' },
  { label: 'Sales', value: 'sales' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Customer Support', value: 'customer_support' },
  { label: 'Other', value: 'other' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Locked', value: 'locked' },
]

const createUserForm = reactive({
  full_name: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: roleOptions[2].value,
  status: statusOptions[0].value,
  avatar: '',
})

const formError = ref('')
const isCreating = ref(false)
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

const { fetchUsers, createUser, updateUser } = useUsers()

const usersList = ref<any[]>([])
const loadingUsers = ref(false)

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    usersList.value = await fetchUsers()
  } catch (e: any) {
    toast.add({ title: 'Error loading users', description: e.message, color: 'error' })
  } finally {
    loadingUsers.value = false
  }
}

watch(activeTab, (val) => {
  if (val === 'users' && usersList.value.length === 0) {
    loadUsers()
  }
}, { immediate: true })

const userColumns = [
  { key: 'full_name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'role', label: 'Role' },
  { key: 'sales_user.department', label: 'Department' },
  { key: 'sales_user.staff_code', label: 'Staff Code' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' }
] as any[]

const showEditModal = ref(false)
const isEditing = ref(false)
const editFormError = ref('')
const editForm = reactive({
  id: 0,
  username: '',
  full_name: '',
  role: 'sales',
  status: 'active',
  password: '',
  sales_staff_code: '',
  sales_department: '',
  sales_phone: ''
})

const openEditModal = (row: any) => {
  editForm.id = row.id
  editForm.username = row.username
  editForm.full_name = row.full_name
  editForm.role = row.role as any
  editForm.status = row.status as any
  editForm.password = ''
  editForm.sales_staff_code = row.sales_user?.staff_code || ''
  editForm.sales_department = row.sales_user?.department || ''
  editForm.sales_phone = row.sales_user?.phone || ''
  editFormError.value = ''
  showEditModal.value = true
}

const submitEditUser = async () => {
  try {
    isEditing.value = true
    editFormError.value = ''
    const payload: any = {
      full_name: editForm.full_name.trim(),
      role: editForm.role as any,
      status: editForm.status as any,
      sales_staff_code: editForm.sales_staff_code.trim() || null,
      sales_department: editForm.sales_department.trim() || null,
      sales_phone: editForm.sales_phone.trim() || null,
    }
    if (editForm.password.trim()) {
      if (editForm.password.length < 6) {
        editFormError.value = 'Password must be at least 6 characters'
        isEditing.value = false
        return
      }
      payload.password = editForm.password
    }

    await updateUser(editForm.id, payload)
    toast.add({ title: 'User updated', description: `${editForm.full_name} has been updated.`, color: 'primary' })
    showEditModal.value = false
    loadUsers() // Refresh list
  } catch (e: any) {
    editFormError.value = e?.data?.message || e?.message || 'Failed to update user'
  } finally {
    isEditing.value = false
  }
}

const canCreateUser = computed(() => {
  return (
    createUserForm.full_name.trim().length > 0 &&
    createUserForm.username.trim().length > 0 &&
    createUserForm.password.trim().length >= 6 &&
    createUserForm.password === createUserForm.confirmPassword
  )
})

const resetCreateUserForm = () => {
  createUserForm.full_name = ''
  createUserForm.username = ''
  createUserForm.password = ''
  createUserForm.confirmPassword = ''
  createUserForm.role = roleOptions[2].value
  createUserForm.status = statusOptions[0].value
  createUserForm.avatar = ''
  formError.value = ''
}

const handleCreateUser = async () => {
  if (createUserForm.username.trim().length < 3) {
    formError.value = 'Username must be at least 3 characters long.'
    return
  }

  if (createUserForm.password.length < 6) {
    formError.value = 'Password must be at least 6 characters long.'
    return
  }

  if (createUserForm.password !== createUserForm.confirmPassword) {
    formError.value = 'Passwords do not match.'
    return
  }

  formError.value = ''

  try {
    isCreating.value = true
    await createUser({
      username: createUserForm.username.trim(),
      full_name: createUserForm.full_name.trim(),
      password: createUserForm.password,
      role: createUserForm.role as any,
      status: createUserForm.status as any,
      avatar: createUserForm.avatar?.trim() ? createUserForm.avatar.trim() : undefined,
    })

    toast.add({
      title: 'User created',
      description: `${createUserForm.full_name} can now access the CRM.`,
      color: 'primary',
    })

    resetCreateUserForm()
    loadUsers() // Refresh the users list automatically
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      'Unable to create the user. Please try again later.'
    formError.value = message
  } finally {
    isCreating.value = false
  }
}

// ===== Server Logs Tab =====
interface LogEntry {
  id: number
  timestamp: string
  level: string
  context: string
  message: string
}

const logEntries = ref<LogEntry[]>([])
const logSearchQuery = ref('')
const autoScroll = ref(true)
const sseConnected = ref(false)
const terminalRef = ref<HTMLElement | null>(null)
const loadingSystemInfo = ref(false)
const systemInfo = ref<any>(null)
let eventSource: EventSource | null = null

const logLevels = [
  { label: 'LOG', value: 'LOG', activeClass: 'border-emerald-400 text-emerald-700 bg-emerald-50' },
  { label: 'WARN', value: 'WARN', activeClass: 'border-amber-400 text-amber-700 bg-amber-50' },
  { label: 'ERROR', value: 'ERROR', activeClass: 'border-red-400 text-red-700 bg-red-50' },
  { label: 'DEBUG', value: 'DEBUG', activeClass: 'border-blue-400 text-blue-700 bg-blue-50' },
  { label: 'VERBOSE', value: 'VERBOSE', activeClass: 'border-purple-400 text-purple-700 bg-purple-50' },
]

const activeLogLevels = ref<string[]>(['LOG', 'WARN', 'ERROR'])

const toggleLogLevel = (level: string) => {
  const idx = activeLogLevels.value.indexOf(level)
  if (idx >= 0) {
    activeLogLevels.value.splice(idx, 1)
  } else {
    activeLogLevels.value.push(level)
  }
}

const filteredLogs = computed(() => {
  return logEntries.value.filter(entry => {
    if (!activeLogLevels.value.includes(entry.level)) return false
    if (logSearchQuery.value.trim()) {
      const q = logSearchQuery.value.toLowerCase()
      return entry.message.toLowerCase().includes(q) ||
        entry.context.toLowerCase().includes(q)
    }
    return true
  })
})

const formatLogTime = (ts: string) => {
  const d = new Date(ts)
  return d.toLocaleTimeString('vi-VN', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

const clearLogs = () => {
  logEntries.value = []
}

const handleTerminalScroll = () => {
  if (!terminalRef.value) return
  const el = terminalRef.value
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  // If user scrolls up, pause auto-scroll
  if (!atBottom && autoScroll.value) {
    autoScroll.value = false
  }
}

const scrollToBottom = () => {
  if (autoScroll.value && terminalRef.value) {
    nextTick(() => {
      terminalRef.value!.scrollTop = terminalRef.value!.scrollHeight
    })
  }
}

const connectSSE = () => {
  if (eventSource) {
    eventSource.close()
  }
  // EventSource can't send custom headers — pass token as query param
  const token = auth?.token?.value || ''
  const url = `${apiBaseUrl}/server-logs/stream${token ? '?token=' + encodeURIComponent(token) : ''}`
  eventSource = new EventSource(url)

  eventSource.addEventListener('log', (event: any) => {
    try {
      const entry: LogEntry = JSON.parse(event.data)
      logEntries.value.push(entry)
      // Trim to 1000
      if (logEntries.value.length > 1000) {
        logEntries.value = logEntries.value.slice(-1000)
      }
      scrollToBottom()
    } catch {}
  })

  eventSource.onopen = () => {
    sseConnected.value = true
  }

  eventSource.onerror = () => {
    sseConnected.value = false
    // Auto-reconnect after 3s
    setTimeout(() => {
      if (activeTab.value === 'server-logs') {
        connectSSE()
      }
    }, 3000)
  }
}

const disconnectSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
    sseConnected.value = false
  }
}

const loadHistory = async () => {
  try {
    const data: any = await $fetch(`${apiBaseUrl}/server-logs/history`, {
      headers: (auth?.getAuthHeaders?.() ?? {}) as unknown as HeadersInit,
    })
    if (data?.entries) {
      logEntries.value = data.entries
      scrollToBottom()
    }
  } catch {}
}

const loadSystemInfo = async () => {
  loadingSystemInfo.value = true
  try {
    systemInfo.value = await $fetch(`${apiBaseUrl}/server-logs/system-info`, {
      headers: (auth?.getAuthHeaders?.() ?? {}) as unknown as HeadersInit,
    })
  } catch {}
  loadingSystemInfo.value = false
}

// Connect SSE when tab activates, disconnect when leaving
watch(activeTab, (val, oldVal) => {
  if (val === 'server-logs') {
    loadHistory()
    loadSystemInfo()
    connectSSE()
  } else if (oldVal === 'server-logs') {
    disconnectSSE()
  }
})

onUnmounted(() => {
  disconnectSSE()
})
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;
}

.form-field--compact {
  width: 100%;
  max-width: 360px;
}

.form-label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #374151;
}

.form-input-plain :deep(.n-input) {
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.form-input-plain :deep(.n-input__input-el) {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #111827;
}

.form-input-plain :deep(.n-input__placeholder) {
  color: #9ca3af;
}

.form-input-plain :deep(.n-input):hover {
  border-color: #34d399;
}

.form-input-plain :deep(.n-input:not(.n-input--disabled):focus-within) {
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.form-input-plain--error :deep(.n-input) {
  border-color: #fca5a5 !important;
  background-color: rgba(254, 226, 226, 0.4);
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.18);
}

.form-input-plain--error :deep(.n-input:not(.n-input--disabled):focus-within) {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.25);
}

.form-input-plain :deep(.n-input .n-input__trail) {
  padding-right: 0.25rem;
}

/* ===== Server Logs Terminal ===== */
.terminal-container {
  background: #0d1117;
  border-radius: 0.75rem;
  border: 1px solid #21262d;
  padding: 1rem;
  height: 520px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  scrollbar-width: thin;
  scrollbar-color: #30363d #0d1117;
}

.terminal-container::-webkit-scrollbar {
  width: 6px;
}
.terminal-container::-webkit-scrollbar-track {
  background: #0d1117;
}
.terminal-container::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}

.terminal-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-style: italic;
}

.terminal-line {
  display: flex;
  gap: 0.5rem;
  padding: 1px 0;
  border-bottom: 1px solid rgba(48, 54, 61, 0.3);
}

.terminal-line:hover {
  background: rgba(56, 139, 253, 0.08);
}

.terminal-time {
  color: #484f58;
  flex-shrink: 0;
  min-width: 90px;
}

.terminal-level {
  font-weight: 700;
  flex-shrink: 0;
  min-width: 55px;
}

.terminal-level--log { color: #3fb950; }
.terminal-level--warn { color: #d29922; }
.terminal-level--error { color: #f85149; }
.terminal-level--debug { color: #58a6ff; }
.terminal-level--verbose { color: #bc8cff; }
.terminal-level--fatal { color: #ff7b72; font-weight: 900; }

.terminal-context {
  color: #8b949e;
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal-msg {
  color: #c9d1d9;
  word-break: break-all;
}

.terminal-line--error .terminal-msg {
  color: #ffa198;
}
.terminal-line--warn .terminal-msg {
  color: #e3b341;
}
</style>


