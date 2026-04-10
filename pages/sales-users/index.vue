<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Sales Users</h1>
        <p class="text-sm text-gray-500 mt-1">Manage your sales team</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="openAddModal">Add Sale</UButton>
    </div>

    <!-- Card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <UInput v-model="search" placeholder="Search sales users..." icon="i-heroicons-magnifying-glass" class="w-72" />
        </div>
      </template>

      <div v-if="pending" class="flex items-center justify-center py-12 text-gray-500">
        Loading sales users...
      </div>
      <div v-else-if="error" class="py-12 text-center">
        <p class="text-red-600">Error loading: {{ error.message }}</p>
        <UButton color="primary" variant="soft" class="mt-2" @click="refresh()">Retry</UButton>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 dark:border-gray-800">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Avatar</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Staff Code</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Full Name</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Lark Email</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Department</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Nhận Số</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr v-for="u in paginatedSalesUsers" :key="u.id ?? u.staff_code" class="hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3">
                <UAvatar :src="u.avatar || undefined" :alt="u.full_name" size="sm" />
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white dark:text-gray-100">{{ u.staff_code }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white dark:text-gray-100">{{ u.full_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">{{ u.email }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">{{ u.email_lark }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">{{ u.phone || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 dark:text-gray-200 capitalize">{{ u.department || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 dark:text-gray-200 capitalize">{{ u.role || '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center">
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full"
                    :class="statusMeta(u.status).background"
                    :title="statusMeta(u.status).label"
                  >
                    <UIcon :name="statusMeta(u.status).icon" class="w-5 h-5" :class="statusMeta(u.status).color" />
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center" v-if="(u.status || 'active').toLowerCase() === 'active'">
                  <USwitch
                    :model-value="!!u.is_accepting_customers"
                    color="primary"
                    :disabled="!['admin', 'sales_manager'].includes(auth?.user?.value?.role || '')"
                    @update:model-value="(val: boolean) => handleToggleAccepting(u, val)"
                  />
                  <span class="ml-2 text-xs" :class="u.is_accepting_customers ? 'text-emerald-600' : 'text-gray-400'">
                    {{ u.is_accepting_customers ? 'ON' : 'OFF' }}
                  </span>
                </div>
                <div v-else class="text-xs text-gray-400 italic">N/A</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="['admin', 'sales_manager'].includes(auth?.user?.value?.role || '')"
                    variant="soft"
                    color="primary"
                    size="xs"
                    class="inline-flex items-center gap-2"
                    icon="i-heroicons-pencil-square"
                    @click.stop="openEditModal(u)"
                  >
                    Edit
                  </UButton>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    class="inline-flex items-center gap-2"
                    @click.stop="handleViewDetail(u)"
                  >
                    <UIcon name="i-heroicons-eye" class="w-4 h-4" />
                    View Detail
                  </UButton>
                  <UButton
                    v-if="['admin'].includes(auth?.user?.value?.role || '')"
                    variant="soft"
                    color="warning"
                    size="xs"
                    class="inline-flex items-center gap-2"
                    icon="i-heroicons-arrows-right-left"
                    @click.stop="openTransferModal(u)"
                  >
                    Transfer
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filtered.length === 0" class="py-12 text-center text-gray-500">No sales users found</div>
      </div>

      <!-- Pagination -->
      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <!-- Left: Items per page and info -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 dark:text-gray-300">Items per page:</span>
              <select
                v-model.number="itemsPerPage"
                @change="currentPage = 1"
                class="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to 
              <span class="font-medium">{{ endIndex }}</span> of 
              <span class="font-medium">{{ filtered.length }}</span> sales users
            </div>
          </div>

          <!-- Right: Pagination controls -->
          <div class="flex items-center gap-3">
            <!-- First/Previous buttons -->
            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-double-left"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
                size="sm"
                class="hidden sm:flex"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-left"
                :disabled="currentPage === 1"
                @click="previousPage"
                size="sm"
              />
            </div>

            <!-- Page numbers -->
            <div class="flex items-center gap-1">
              <template v-if="totalPages <= 7">
                <UButton
                  v-for="page in totalPages"
                  :key="page"
                  :color="page === currentPage ? 'primary' : 'neutral'"
                  :variant="page === currentPage ? 'solid' : 'ghost'"
                  @click="goToPage(page)"
                  size="sm"
                  class="min-w-[2.5rem]"
                >
                  {{ page }}
                </UButton>
              </template>
              <template v-else>
                <!-- First page -->
                <UButton
                  :color="currentPage === 1 ? 'primary' : 'neutral'"
                  :variant="currentPage === 1 ? 'solid' : 'ghost'"
                  @click="goToPage(1)"
                  size="sm"
                  class="min-w-[2.5rem]"
                >
                  1
                </UButton>

                <!-- Ellipsis before current range -->
                <span v-if="visiblePages[0] > 2" class="px-2 text-gray-400">...</span>

                <!-- Visible page range -->
                <UButton
                  v-for="page in visiblePages"
                  :key="page"
                  :color="page === currentPage ? 'primary' : 'neutral'"
                  :variant="page === currentPage ? 'solid' : 'ghost'"
                  @click="goToPage(page)"
                  size="sm"
                  class="min-w-[2.5rem]"
                >
                  {{ page }}
                </UButton>

                <!-- Ellipsis after current range -->
                <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="px-2 text-gray-400">...</span>

                <!-- Last page -->
                <UButton
                  v-if="totalPages > 1"
                  :color="currentPage === totalPages ? 'primary' : 'neutral'"
                  :variant="currentPage === totalPages ? 'solid' : 'ghost'"
                  @click="goToPage(totalPages)"
                  size="sm"
                  class="min-w-[2.5rem]"
                >
                  {{ totalPages }}
                </UButton>
              </template>
            </div>

            <!-- Next/Last buttons -->
            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-right"
                :disabled="currentPage === totalPages"
                @click="nextPage"
                size="sm"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-double-right"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
                size="sm"
                class="hidden sm:flex"
              />
            </div>

            <!-- Jump to page (optional) -->
            <div v-if="totalPages > 10" class="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-300">Go to:</span>
              <UInput
                v-model.number="jumpToPage"
                type="number"
                :min="1"
                :max="totalPages"
                class="w-16"
                @keyup.enter="jumpToPageHandler"
              />
            </div>
          </div>
        </div>
      </template>
    </UCard>
  </div>

  <!-- Add Sale Modal -->
  <UModal v-model:open="isAddOpen" title="Add Sales User">
    <template #body>
      <form @submit.prevent="onSubmit" class="space-y-4">
        <div class="space-y-3">
          <USelect
            v-model="selectedUserId"
            :items="userSelectOptions"
            label="CRM User"
            title="CRM User"
            placeholder="Select a CRM user to create a sales profile"
            searchable
            :clearable="false"
            :loading="usersPending"
            :disabled="usersPending || !!usersError"
          />
          <p class="text-xs text-gray-500">
            Selecting a CRM user is required — we’ll prefill the available information and lock anything already managed elsewhere.
          </p>
          <p v-if="usersError" class="text-xs text-red-500">
            Failed to load users: {{ usersError.message || 'unknown error' }}
          </p>
          <p v-else-if="!usersPending && userSelectOptions.length === 0" class="text-xs text-gray-400">
            No available users without sales profiles. Create a new user first or clear an existing assignment.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-staff-code">Staff Code</label>
            <UInput 
              id="add-sales-staff-code"
              v-model="form.staff_code" 
              title="Staff Code"
              placeholder="e.g. NV0109" 
              icon="i-heroicons-identification" 
              required 
              :disabled="saving"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-full-name">Full Name</label>
            <UInput 
              id="add-sales-full-name"
              v-model="form.full_name" 
              title="Full Name"
              placeholder="e.g. Trần Đình Thắng" 
              icon="i-heroicons-user" 
              required 
              :disabled="saving || lockedFields.full_name"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-email">Email</label>
            <UInput 
              id="add-sales-email"
              v-model="form.email" 
              type="email" 
              title="Email"
              placeholder="name@company.com" 
              icon="i-heroicons-envelope" 
              required 
              :disabled="saving || lockedFields.email"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-email-lark">Lark Email</label>
            <UInput 
              id="add-sales-email-lark"
              v-model="form.email_lark" 
              type="email" 
              title="Lark Email"
              placeholder="name@wealify.com" 
              icon="i-heroicons-envelope-open" 
              :disabled="saving"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-phone">Phone</label>
            <UInput 
              id="add-sales-phone"
              v-model="form.phone" 
              title="Phone"
              placeholder="e.g. +84 93 123 4567" 
              icon="i-heroicons-phone" 
              :disabled="saving || lockedFields.phone"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-department">Department</label>
            <USelectMenu 
              id="add-sales-department"
              v-model="form.department" 
              title="Department"
              :items="departmentOptions"
              label-key="label"
              value-key="value"
              placeholder="Select department"
              icon="i-heroicons-building-office"
              required
              class="w-full"
              :disabled="saving || lockedFields.department"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-role">Role</label>
            <USelectMenu 
              id="add-sales-role"
              v-model="form.role" 
              title="Role"
              :items="roleOptions"
              label-key="label"
              value-key="value"
              placeholder="Select role"
              icon="i-heroicons-briefcase"
              required
              class="w-full"
              :disabled="saving || lockedFields.role"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200" for="add-sales-status">Status</label>
            <USelectMenu 
              id="add-sales-status"
              v-model="form.status" 
              title="Status"
              :items="statusOptions"
              label-key="label"
              value-key="value"
              placeholder="Select status"
              icon="i-heroicons-sparkles"
              class="w-full"
              :disabled="saving || lockedFields.status"
            />
          </div>
        </div>
      </form>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-end gap-2">
        <UButton 
          color="neutral" 
          variant="ghost" 
          @click="close"
        >
          Cancel
        </UButton>
        <UButton 
          color="primary" 
          @click="onSubmit" 
          :loading="saving" 
          :disabled="!canSubmit"
        >
          Save
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Edit Sales User Modal -->
  <UModal v-model:open="showEditModal" title="Edit Sales Profile">
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Staff Code</label>
            <UInput v-model="editForm.staff_code" icon="i-heroicons-identification" required />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Full Name</label>
            <UInput v-model="editForm.full_name" icon="i-heroicons-user" required />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <UInput v-model="editForm.email" type="email" icon="i-heroicons-envelope" required />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Lark Email</label>
            <UInput v-model="editForm.email_lark" type="email" icon="i-heroicons-envelope-open" />
          </div>
          <div class="flex flex-col gap-2 col-span-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Phone</label>
            <UInput v-model="editForm.phone" icon="i-heroicons-phone" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Department</label>
            <USelectMenu v-model="editForm.department" :items="departmentOptions" label-key="label" value-key="value" :disabled="auth?.user?.value?.role !== 'admin'" icon="i-heroicons-building-office" class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Role</label>
            <USelectMenu v-model="editForm.role" :items="roleOptions" label-key="label" value-key="value" :disabled="auth?.user?.value?.role !== 'admin'" icon="i-heroicons-briefcase" class="w-full" />
          </div>
          <div class="flex flex-col gap-2 col-span-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
            <USelectMenu v-model="editForm.status" :items="statusOptions" label-key="label" value-key="value" :disabled="auth?.user?.value?.role !== 'admin'" icon="i-heroicons-sparkles" class="w-full" />
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-end gap-3">
        <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
        <UButton color="primary" :loading="isEditing" @click="submitEditSalesUser" :disabled="!canSubmitEdit">Save Changes</UButton>
      </div>
    </template>
  </UModal>

  <!-- Transfer Customers Modal -->
  <UModal v-model:open="showTransferModal" title="Bulk Transfer Customers">
    <template #body>
      <div class="space-y-4">
        <div class="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-md border border-amber-200 dark:border-amber-800">
          <p class="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Warning: This action will instantly migrate ALL currently active customers from 
            <span class="font-bold">{{ transferForm.from_user?.full_name || 'this agent' }}</span> 
            to another selected Sales User. This action cannot be easily undone.
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Destination Sales Agent</label>
          <USelectMenu 
            v-model="transferForm.to_sales_user_id" 
            :items="availableTransferTargets" 
            label-key="label" 
            value-key="value" 
            placeholder="Select a destination agent"
            icon="i-heroicons-user-group" 
            class="w-full" 
            searchable
          />
        </div>
        
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Transfer Note (Optional)</label>
          <UInput 
            v-model="transferForm.note" 
            placeholder="e.g. Mass migration due to agent leaving" 
            icon="i-heroicons-document-text" 
          />
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-end gap-3">
        <UButton color="neutral" variant="ghost" @click="close" :disabled="isTransferring">Cancel</UButton>
        <UButton 
          color="warning" 
          :loading="isTransferring" 
          @click="submitTransferAll" 
          :disabled="!transferForm.to_sales_user_id"
        >
          Confirm Transfer All
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { SalesUser } from '~/composables/useSalesUsers'

const auth = useAuth()
const { fetchSalesUsers, createSalesUser, updateSalesUser, toggleAccepting } = useSalesUsers()
const { transferAllCustomers } = useCustomerAssignments()
const { fetchUsers } = useUsers()
const search = ref('')
const isAddOpen = ref(false)
const saving = ref(false)
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)
const departmentOptions = [
  { label: 'Sales', value: 'sales' },
  { label: 'Telesale', value: 'telesale' },
  { label: 'CSKH', value: 'cskh' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Admin', value: 'admin' }
]

const roleOptions = [
  { label: 'Sales Representative', value: 'sales_rep' },
  { label: 'Sales Lead', value: 'sales_lead' },
  { label: 'Manager', value: 'manager' },
  { label: 'Support', value: 'support' }
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'On Leave', value: 'on_leave' }
]

const {
  data: usersDirectory,
  pending: usersPending,
  error: usersError,
  refresh: refreshUsers,
} = await useAsyncData('users-with-sales-info', () => fetchUsers(), {
  default: () => [],
})

const selectableUsers = computed(() => {
  return (usersDirectory.value || []).filter((user) => !user.sales_user)
})

const userSelectOptions = computed(() =>
  selectableUsers.value.map((user) => ({
    label: `${user.full_name} (${user.username})`,
    value: user.id,
  })),
)

const selectedUserId = ref<number | undefined>(undefined)
const selectedUser = computed(() => {
  if (selectedUserId.value === undefined) return null
  return selectableUsers.value.find((user) => user.id === selectedUserId.value) || null
})

const lockedFields = reactive({
  full_name: false,
  email: false,
  phone: false,
  department: false,
  role: false,
  status: false,
})
const currentPage = ref(1)
const itemsPerPage = ref(10)
const jumpToPage = ref<number | null>(null)

const { data: sales, pending, error, refresh } = await useAsyncData(
  'sales-users',
  () => fetchSalesUsers(),
  { default: () => [] }
)

const filtered = computed(() => {
  const list = sales.value || []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((u: SalesUser) =>
    [u.staff_code, u.full_name, u.email, u.email_lark, u.phone, u.department, u.role, u.status]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  )
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filtered.value.length / itemsPerPage.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage.value, filtered.value.length)
})

const paginatedSalesUsers = computed(() => {
  return filtered.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(2, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value - 1, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(2, end - maxVisible + 1)
  }

  // Only show pages if there are more than 7 total pages
  if (totalPages.value > 7) {
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  } else {
    for (let i = 2; i <= totalPages.value - 1; i++) {
      pages.push(i)
    }
  }
  return pages
})

const router = useRouter()

const statusMeta = (s?: string) => {
  const key = (s || 'active').toLowerCase()

  switch (key) {
    case 'inactive':
      return {
        label: 'Inactive',
        icon: 'i-heroicons-no-symbol',
        background: 'bg-amber-100',
        color: 'text-amber-600'
      }
    case 'on_leave':
      return {
        label: 'On Leave',
        icon: 'i-heroicons-clock',
        background: 'bg-blue-100',
        color: 'text-blue-600'
      }
    case 'active':
    default:
      return {
        label: 'Active',
        icon: 'i-heroicons-check-circle',
        background: 'bg-emerald-100',
        color: 'text-emerald-600'
      }
  }
}

const form = reactive<SalesUser>({
  user_id: null,
  staff_code: '',
  full_name: '',
  email: '',
  email_lark: '',
  phone: '',
  department: 'sales',
  role: 'sales_rep',
  status: 'active',
})

watch(
  selectedUser,
  (user) => {
    form.user_id = null
    form.full_name = ''
    form.email = ''
    form.phone = ''
    form.department = 'sales'
    form.role = 'sales_rep'
    form.status = 'active'
    lockedFields.full_name = false
    lockedFields.email = false
    lockedFields.phone = false
    lockedFields.department = false
    lockedFields.role = false
    lockedFields.status = false
    passwordVisible.value = false
    confirmPasswordVisible.value = false

    if (!user) {
      return
    }

    form.user_id = user.id

    if (user.full_name) {
      form.full_name = user.full_name
      lockedFields.full_name = true
    }

    const derivedEmail = user.email ?? user.sales_user?.email ?? null
    if (derivedEmail) {
      form.email = derivedEmail
      lockedFields.email = true
    }

    const derivedPhone = user.phone ?? user.sales_user?.phone ?? null
    if (derivedPhone) {
      form.phone = derivedPhone
      lockedFields.phone = true
    }

    const derivedDepartment = user.sales_user?.department ?? null
    if (derivedDepartment) {
      form.department = derivedDepartment as SalesUser['department']
      lockedFields.department = true
    }

    const derivedRole = user.sales_user?.role ?? null
    if (derivedRole) {
      form.role = derivedRole as SalesUser['role']
      lockedFields.role = true
    }

    const derivedStatus = user.sales_user?.status ?? null
    if (derivedStatus) {
      form.status = derivedStatus as SalesUser['status']
      lockedFields.status = true
    }
  },
  { immediate: true },
)

const openAddModal = () => {
  isAddOpen.value = true
  refreshUsers()
}

const handleViewDetail = (user: SalesUser) => {
  if (!user) return

  const targetId = user.id ?? user.sales_user_id ?? user.staff_code

  if (!targetId) {
    toast.add({
      title: 'Unable to open detail',
      description: 'Sales user id is not available',
      color: 'error',
    })
    return
  }

  router.push(`/sales-users/${targetId}`)
}

const handleToggleAccepting = async (user: SalesUser, isAccepting: boolean) => {
  if (!user.id) return
  try {
    const originalValue = user.is_accepting_customers // inside try block
    user.is_accepting_customers = isAccepting ? 1 : 0
    await toggleAccepting(user.id, isAccepting)
    toast.add({
      title: 'Status Updated',
      description: `${user.full_name} is now ${isAccepting ? 'ACCEPTING' : 'NOT ACCEPTING'} new customers.`,
      color: 'success',
    })
  } catch (e: any) {
    // Revert UI on failure
    user.is_accepting_customers = !isAccepting ? 1 : 0
    toast.add({
      title: 'Update failed',
      description: e?.message || 'Failed to update accepting status',
      color: 'error',
    })
  }
}

const resetForm = () => {
  selectedUserId.value = undefined
  form.user_id = null
  form.staff_code = ''
  form.full_name = ''
  form.email = ''
  form.email_lark = ''
  form.phone = ''
  form.department = 'sales'
  form.role = 'sales_rep'
  form.status = 'active'
  lockedFields.full_name = false
  lockedFields.email = false
  lockedFields.phone = false
  lockedFields.department = false
  lockedFields.role = false
  lockedFields.status = false
  passwordVisible.value = false
  confirmPasswordVisible.value = false
}

const toast = useToast()

const onSubmit = async () => {
  try {
    saving.value = true
    await createSalesUser({ ...form })
    toast.add({ title: 'Sales user created', color: 'primary' })
    isAddOpen.value = false
    resetForm()
    await Promise.all([refresh(), refreshUsers()])
  } catch (e: any) {
    toast.add({ title: 'Failed to create sales user', description: e?.message || 'Unknown error', color: 'error' })
  } finally {
    saving.value = false
  }
}

const showEditModal = ref(false)
const isEditing = ref(false)
const editForm = reactive<Partial<SalesUser>>({})

const openEditModal = (user: SalesUser) => {
  Object.assign(editForm, user)
  showEditModal.value = true
}

const canSubmitEdit = computed(() => {
  return (
    !!editForm.staff_code?.trim() &&
    !!editForm.full_name?.trim() &&
    !!editForm.email?.trim() &&
    !!editForm.department
  )
})

// === Transfer All Feature ===
const showTransferModal = ref(false)
const isTransferring = ref(false)
const transferForm = reactive({
  from_user: null as SalesUser | null,
  to_sales_user_id: undefined as number | undefined,
  note: ''
})

const availableTransferTargets = computed(() => {
  const currentId = transferForm.from_user?.id ?? transferForm.from_user?.sales_user_id
  return (sales.value || [])
    .filter(u => {
      const uId = u.id ?? u.sales_user_id
      return uId !== currentId
    })
    .map(u => ({
      label: `${u.full_name} (${u.staff_code}) - ${u.department}`,
      value: u.id ?? u.sales_user_id
    }))
})

const openTransferModal = (user: SalesUser) => {
  transferForm.from_user = user
  transferForm.to_sales_user_id = undefined
  transferForm.note = 'Bulk transfer by Admin'
  showTransferModal.value = true
}

const submitTransferAll = async () => {
  const fromId = transferForm.from_user?.id ?? transferForm.from_user?.sales_user_id
  if (!fromId || !transferForm.to_sales_user_id) return
  
  try {
    isTransferring.value = true
    const result = await transferAllCustomers({
      from_sales_user_id: fromId,
      to_sales_user_id: transferForm.to_sales_user_id,
      note: transferForm.note
    })
    
    toast.add({
      title: 'Bulk Transfer Complete',
      description: `Successfully migrated ${result.transferred} customers to the new agent.`,
      color: 'success'
    })
    showTransferModal.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Transfer Failed',
      description: error?.message || 'Failed to bulk transfer customers.',
      color: 'error'
    })
  } finally {
    isTransferring.value = false
  }
}


const submitEditSalesUser = async () => {
  if (!editForm.id) return
  try {
    isEditing.value = true
    await updateSalesUser(editForm.id, {
      staff_code: editForm.staff_code,
      full_name: editForm.full_name,
      email: editForm.email,
      email_lark: editForm.email_lark || null,
      phone: editForm.phone || null,
      department: editForm.department,
      role: editForm.role,
      status: editForm.status
    })
    toast.add({ title: 'Profile updated', description: `${editForm.full_name} has been updated.`, color: 'success' })
    showEditModal.value = false
    refresh()
  } catch (e: any) {
    toast.add({ title: 'Update failed', description: e?.message || 'Failed to update sales user', color: 'error' })
  } finally {
    isEditing.value = false
  }
}

// Reset form when modal closes
watch(isAddOpen, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// Watch search query to reset page
watch(search, () => {
  currentPage.value = 1
})

// Watch itemsPerPage to reset to page 1
watch(itemsPerPage, () => {
  currentPage.value = 1
})

// Pagination functions
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const jumpToPageHandler = () => {
  if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
    goToPage(jumpToPage.value)
    jumpToPage.value = null
  }
}

const canSubmit = computed(() => {
  return (
    selectedUserId.value !== undefined &&
    form.user_id !== null &&
    !!form.staff_code?.trim() &&
    !!form.full_name?.trim() &&
    !!form.email?.trim() &&
    !!form.department &&
    !!form.role
  )
})
</script>

