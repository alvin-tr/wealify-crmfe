<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Sales Requests</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ isAdminOrManager ? 'Manage and review sales requests' : 'Request customer assignments' }}
        </p>
      </div>
      <UButton
        v-if="!isAdminOrManager"
        color="primary"
        icon="i-heroicons-plus"
        @click="openCreateRequestModal"
      >
        New Request
      </UButton>
    </div>

    <!-- Tabs -->
    <div v-if="isAdminOrManager" class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
          ]"
        >
          {{ tab.label }}
          <UBadge
            v-if="tab.count !== undefined && tab.count > 0"
            :color="tab.id === 'pending' ? 'warning' : 'neutral'"
            variant="soft"
            class="ml-2"
          >
            {{ tab.count }}
          </UBadge>
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Loading requests...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-12 text-center">
      <p class="text-red-600">Error loading requests: {{ error.message }}</p>
      <UButton color="primary" variant="soft" @click="refresh" class="mt-4">
        Retry
      </UButton>
    </div>

    <!-- Requests List -->
    <UCard v-else-if="displayedRequests.length > 0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ID
              </th>
              <th v-if="isAdminOrManager" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Requester
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customers
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Note
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th v-if="isAdminOrManager" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Approver
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created At
              </th>
              <th v-if="isAdminOrManager" class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="request in displayedRequests"
              :key="request.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-4 text-sm font-mono text-gray-900">
                #{{ request.id }}
              </td>
              <td v-if="isAdminOrManager" class="px-4 py-4 text-sm text-gray-900">
                {{ request.requester_name || `User #${request.requester_user_id}` }}
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium text-gray-900">
                    {{ request.payload.customer_ids.length }} customer(s)
                  </span>
                  <button
                    v-if="request.payload.customer_ids.length > 0"
                    class="text-xs text-primary-600 hover:text-primary-800 text-left"
                    @click="openCustomersDetailModal(request)"
                  >
                    View details
                  </button>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 max-w-xs">
                <div class="truncate" :title="request.note || request.payload.customer_note || ''">
                  {{ request.note || request.payload.customer_note || '—' }}
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-col gap-1">
                  <UBadge
                    :color="getStatusColor(request.status)"
                    variant="soft"
                  >
                    {{ request.status }}
                  </UBadge>
                  <p v-if="request.status === 'rejected' && request.reject_reason" class="text-xs text-gray-500 italic mt-1">
                    "{{ request.reject_reason }}"
                  </p>
                </div>
              </td>
              <td v-if="isAdminOrManager" class="px-4 py-4 text-sm text-gray-600">
                {{ request.approver_name || (request.approver_user_id ? `User #${request.approver_user_id}` : '—') }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ formatDate(request.created_at) }}
              </td>
              <td v-if="isAdminOrManager" class="px-4 py-4">
                <div v-if="request.status === 'pending'" class="flex items-center gap-2">
                  <UButton
                    size="xs"
                    color="primary"
                    variant="soft"
                    icon="i-heroicons-check"
                    @click="openApproveModal(request)"
                  >
                    Approve
                  </UButton>
                  <UButton
                    size="xs"
                    color="error"
                    variant="soft"
                    icon="i-heroicons-x-mark"
                    @click="openRejectModal(request)"
                  >
                    Reject
                  </UButton>
                </div>
                <span v-else class="text-xs text-gray-400">
                  {{ request.decided_at ? formatDate(request.decided_at) : '—' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Empty State -->
    <UCard v-else>
      <div class="py-12 text-center text-gray-500">
        <div class="flex flex-col items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-300" />
          <p class="text-sm font-medium text-gray-700">
            {{ isAdminOrManager 
              ? (activeTab === 'pending' ? 'No pending requests' : 'No requests found')
              : 'No requests yet' 
            }}
          </p>
          <p class="text-xs text-gray-500">
            {{ isAdminOrManager 
              ? 'All requests have been processed.'
              : 'Create your first request to get started.'
            }}
          </p>
          <UButton
            v-if="!isAdminOrManager"
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateRequestModal"
            class="mt-2"
          >
            Create Request
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Create Request Modal -->
    <UModal v-model:open="isCreateRequestModalOpen" title="Create Assignment Request" size="lg">
      <template #body>
        <div class="space-y-6">
          <div>
            <p class="text-sm text-gray-600 mb-4">
              Select customers you want to request assignment for:
            </p>
            <UInput
              v-model="createRequestSearchQuery"
              placeholder="Search customers..."
              icon="i-heroicons-magnifying-glass"
              class="mb-4"
            />
            <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-white">
              <div v-if="createRequestCustomersLoading" class="py-4 text-center text-gray-500">
                Loading customers...
              </div>
              <div v-else-if="filteredCustomersForRequest.length === 0" class="py-4 text-center text-gray-400 text-sm">
                {{ createRequestSearchQuery ? 'No customers found' : 'Start typing to search customers' }}
              </div>
              <div v-else class="divide-y divide-gray-200">
                <div
                  v-for="customer in filteredCustomersForRequest"
                  :key="customer.customer_id"
                  class="flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      :id="`customer-${customer.customer_id}`"
                      :checked="selectedCustomersForRequest.includes(customer.customer_id)"
                      @change="toggleCustomerForRequest(customer.customer_id)"
                      class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label
                      :for="`customer-${customer.customer_id}`"
                      class="flex-1 cursor-pointer"
                    >
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ customer.full_name }}</p>
                        <p class="text-xs text-gray-500">{{ customer.email }} · {{ customer.customer_id }}</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="selectedCustomersForRequest.length > 0" class="mt-3 p-3 bg-primary-50 rounded-md">
              <p class="text-sm font-medium text-primary-700">
                {{ selectedCustomersForRequest.length }} customer(s) selected
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Note <span class="text-gray-400">(optional)</span>
            </label>
            <UTextarea
              v-model="createRequestNote"
              placeholder="Explain why you want these customers assigned to you..."
              :rows="4"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="creatingRequest"
            :disabled="selectedCustomersForRequest.length === 0"
            @click="handleCreateRequest"
          >
            Create Request
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Approve Modal -->
    <UModal v-model:open="isApproveModalOpen" title="Approve Request">
      <template #body>
        <div v-if="requestToApprove" class="space-y-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to approve this request?
          </p>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div class="text-sm">
              <span class="font-medium text-gray-700">Requester:</span>
              <span class="ml-2 text-gray-900">{{ requestToApprove.requester_name || `User #${requestToApprove.requester_user_id}` }}</span>
            </div>
            <div class="text-sm">
              <span class="font-medium text-gray-700">Customers:</span>
              <span class="ml-2 text-gray-900">{{ requestToApprove.payload.customer_ids.length }} customer(s)</span>
            </div>
            <div v-if="requestToApprove.note || requestToApprove.payload.customer_note" class="text-sm">
              <span class="font-medium text-gray-700">Note:</span>
              <p class="mt-1 text-gray-600">{{ requestToApprove.note || requestToApprove.payload.customer_note }}</p>
            </div>
          </div>
          <div class="rounded-lg border border-primary-200 bg-primary-50 p-3">
            <p class="text-sm text-primary-700">
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 inline mr-1" />
              Approving this request will automatically assign {{ requestToApprove.payload.customer_ids.length }} customer(s) to the requester.
            </p>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="approving"
            @click="handleApprove"
          >
            Approve
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Reject Modal -->
    <UModal v-model:open="isRejectModalOpen" title="Reject Request">
      <template #body>
        <div v-if="requestToReject" class="space-y-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to reject this request?
          </p>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div class="text-sm">
              <span class="font-medium text-gray-700">Requester:</span>
              <span class="ml-2 text-gray-900">{{ requestToReject.requester_name || `User #${requestToReject.requester_user_id}` }}</span>
            </div>
            <div class="text-sm">
              <span class="font-medium text-gray-700">Customers:</span>
              <span class="ml-2 text-gray-900">{{ requestToReject.payload.customer_ids.length }} customer(s)</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span class="text-gray-400">(optional)</span>
            </label>
            <UTextarea
              v-model="rejectReason"
              placeholder="Explain why this request is being rejected..."
              :rows="4"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="error"
            :loading="rejecting"
            @click="handleReject"
          >
            Reject
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Customers Detail Modal -->
    <UModal v-model:open="isCustomersDetailModalOpen" title="Requested Customers" size="xl">
      <template #body>
        <div v-if="selectedRequestForDetail" class="space-y-4">
          <div v-if="customersDetailLoading" class="py-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading customer details...</p>
          </div>
          <div v-else class="max-h-[600px] overflow-y-auto space-y-4">
            <div
              v-for="customerId in selectedRequestForDetail.payload.customer_ids"
              :key="customerId"
              class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Left Column -->
                <div class="space-y-3">
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer ID</label>
                    <p class="mt-1 text-sm font-mono text-gray-900">{{ getCustomerDetailInfo(customerId).customer_id || customerId }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p class="mt-1 text-sm font-medium text-gray-900">{{ getCustomerDetailInfo(customerId).name || '—' }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <p class="mt-1 text-sm text-gray-600">{{ getCustomerDetailInfo(customerId).email || '—' }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                    <p class="mt-1 text-sm text-gray-600">{{ getCustomerDetailInfo(customerId).phone || '—' }}</p>
                  </div>
                </div>
                
                <!-- Right Column -->
                <div class="space-y-3">
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</label>
                    <p class="mt-1">
                      <UBadge 
                        :color="getTierColor(getCustomerDetailInfo(customerId).tier)" 
                        variant="soft"
                        size="sm"
                      >
                        {{ getCustomerDetailInfo(customerId).tier || '—' }}
                      </UBadge>
                    </p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered At</label>
                    <p class="mt-1 text-sm text-gray-600">
                      {{ getCustomerDetailInfo(customerId).registered_at ? formatDate(getCustomerDetailInfo(customerId).registered_at!) : '—' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Referral Code</label>
                    <p class="mt-1 text-sm font-mono text-gray-600">{{ getCustomerDetailInfo(customerId).referral_code || '—' }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Internal ID</label>
                    <p class="mt-1 text-sm font-mono text-gray-500">{{ getCustomerDetailInfo(customerId).id || '—' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!customersDetailLoading && selectedRequestForDetail.payload.customer_ids.length === 0" class="py-8 text-center text-gray-500">
            <p class="text-sm">No customers found</p>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-500">
            {{ selectedRequestForDetail ? `${selectedRequestForDetail.payload.customer_ids.length} customer(s)` : '' }}
          </p>
          <UButton color="neutral" variant="ghost" @click="close">Close</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { SalesRequest } from '~/composables/useSalesRequests'
import type { Customer } from '~/composables/useCustomers'
import { useSalesRequests } from '~/composables/useSalesRequests'
import { useCustomers } from '~/composables/useCustomers'

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()
const auth = useAuth()

// Check if user is admin or sales_manager
const isAdminOrManager = computed(() => {
  const role = auth.user.value?.role
  return role === 'admin' || role === 'sales_manager'
})

// Tabs for admin/manager
const activeTab = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')
const tabs = computed(() => {
  if (!isAdminOrManager.value) return []
  
  const allCount = allRequests.value.length
  const pendingCount = allRequests.value.filter(r => r.status === 'pending').length
  const approvedCount = allRequests.value.filter(r => r.status === 'approved').length
  const rejectedCount = allRequests.value.filter(r => r.status === 'rejected').length
  
  return [
    { id: 'pending' as const, label: 'Pending', count: pendingCount },
    { id: 'approved' as const, label: 'Approved', count: approvedCount },
    { id: 'rejected' as const, label: 'Rejected', count: rejectedCount },
    { id: 'all' as const, label: 'All', count: allCount },
  ]
})

// Fetch requests
const {
  fetchMyRequests,
  fetchAllRequests,
  createAssignCustomerRequest,
  approveRequest,
  rejectRequest,
} = useSalesRequests()

// My requests (for sales)
const {
  data: myRequests,
  pending: myRequestsPending,
  error: myRequestsError,
  refresh: refreshMyRequests,
} = useAsyncData('my-sales-requests', () => fetchMyRequests(), {
  default: () => [],
  lazy: true,
  server: false,
})

// All requests (for admin/manager)
const {
  data: allRequests,
  pending: allRequestsPending,
  error: allRequestsError,
  refresh: refreshAllRequests,
} = useAsyncData(
  'all-sales-requests',
  () => fetchAllRequests(),
  {
    default: () => [],
    lazy: true,
    server: false,
  }
)

// Watch activeTab to refresh when changed
watch(activeTab, () => {
  if (isAdminOrManager.value) {
    refreshAllRequests()
  }
})

// Computed for displayed requests
const displayedRequests = computed(() => {
  if (isAdminOrManager.value) {
    if (activeTab.value === 'all') {
      return allRequests.value
    }
    return allRequests.value.filter(r => r.status === activeTab.value)
  }
  return myRequests.value
})

const pending = computed(() => isAdminOrManager.value ? allRequestsPending.value : myRequestsPending.value)
const error = computed(() => isAdminOrManager.value ? allRequestsError.value : myRequestsError.value)

const refresh = () => {
  if (isAdminOrManager.value) {
    refreshAllRequests()
  } else {
    refreshMyRequests()
  }
}

// Create Request Modal
const isCreateRequestModalOpen = ref(false)
const selectedCustomersForRequest = ref<string[]>([])
const createRequestNote = ref('')
const createRequestSearchQuery = ref('')
const createRequestCustomersLoading = ref(false)
const createRequestCustomers = ref<Customer[]>([])
const creatingRequest = ref(false)

// Fetch customers for create request
const { fetchCustomers, getCachedCustomers } = useCustomers()

const filteredCustomersForRequest = computed(() => {
  if (!createRequestSearchQuery.value.trim() || createRequestSearchQuery.value.trim().length < 2) {
    return []
  }
  const query = createRequestSearchQuery.value.toLowerCase()
  return createRequestCustomers.value
    .filter((customer) =>
      customer.full_name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.customer_id.toLowerCase().includes(query)
    )
    .slice(0, 50)
})

const toggleCustomerForRequest = (customerId: string) => {
  const index = selectedCustomersForRequest.value.indexOf(customerId)
  if (index > -1) {
    selectedCustomersForRequest.value.splice(index, 1)
  } else {
    selectedCustomersForRequest.value.push(customerId)
  }
}

const openCreateRequestModal = async () => {
  selectedCustomersForRequest.value = []
  createRequestNote.value = ''
  createRequestSearchQuery.value = ''
  isCreateRequestModalOpen.value = true
  
  // Load customers from cache or fetch
  const cached = getCachedCustomers()
  if (cached && cached.length > 0) {
    createRequestCustomers.value = cached
  } else if (createRequestCustomers.value.length === 0) {
    createRequestCustomersLoading.value = true
    try {
      const customers = await fetchCustomers()
      createRequestCustomers.value = customers
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      createRequestCustomersLoading.value = false
    }
  }
}

const handleCreateRequest = async () => {
  if (selectedCustomersForRequest.value.length === 0) {
    toast.add({
      title: 'No customers selected',
      description: 'Please select at least one customer.',
      color: 'warning',
    })
    return
  }

  try {
    creatingRequest.value = true
    // Convert customer_id (string) to id (number) for API
    const customerIds = selectedCustomersForRequest.value
      .map((customerId) => {
        const customer = createRequestCustomers.value.find((c) => c.customer_id === customerId)
        return customer?.id ? Number(customer.id) : null
      })
      .filter((id): id is number => id !== null)
    
    if (customerIds.length === 0) {
      creatingRequest.value = false
      toast.add({
        title: 'Invalid customers',
        description: 'Could not find valid customer IDs.',
        color: 'error',
      })
      return
    }

    await createAssignCustomerRequest({
      customer_ids: customerIds,
      note: createRequestNote.value.trim() || null,
    })
    
    toast.add({
      title: 'Request created',
      description: `Successfully created request for ${selectedCustomersForRequest.value.length} customer(s).`,
      color: 'primary',
    })
    
    isCreateRequestModalOpen.value = false
    selectedCustomersForRequest.value = []
    createRequestNote.value = ''
    await refreshMyRequests()
  } catch (error: any) {
    toast.add({
      title: 'Failed to create request',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    creatingRequest.value = false
  }
}

// Approve/Reject
const isApproveModalOpen = ref(false)
const isRejectModalOpen = ref(false)
const requestToApprove = ref<SalesRequest | null>(null)
const requestToReject = ref<SalesRequest | null>(null)
const approving = ref(false)
const rejecting = ref(false)
const rejectReason = ref('')

const openApproveModal = (request: SalesRequest) => {
  requestToApprove.value = request
  isApproveModalOpen.value = true
}

const openRejectModal = (request: SalesRequest) => {
  requestToReject.value = request
  rejectReason.value = ''
  isRejectModalOpen.value = true
}

const handleApprove = async () => {
  if (!requestToApprove.value) return

  try {
    approving.value = true
    await approveRequest(requestToApprove.value.id)
    
    toast.add({
      title: 'Request approved',
      description: 'The request has been approved and customers have been assigned.',
      color: 'primary',
    })
    
    isApproveModalOpen.value = false
    requestToApprove.value = null
    await refreshAllRequests()
  } catch (error: any) {
    toast.add({
      title: 'Failed to approve request',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    approving.value = false
  }
}

const handleReject = async () => {
  if (!requestToReject.value) return

  try {
    rejecting.value = true
    await rejectRequest(requestToReject.value.id, rejectReason.value.trim() || undefined)
    
    toast.add({
      title: 'Request rejected',
      description: 'The request has been rejected.',
      color: 'primary',
    })
    
    isRejectModalOpen.value = false
    requestToReject.value = null
    rejectReason.value = ''
    await refreshAllRequests()
  } catch (error: any) {
    toast.add({
      title: 'Failed to reject request',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    rejecting.value = false
  }
}

// Customers Detail Modal
const isCustomersDetailModalOpen = ref(false)
const selectedRequestForDetail = ref<SalesRequest | null>(null)
const customersDetailLoading = ref(false)
const customersDetailList = ref<Customer[]>([])

const openCustomersDetailModal = async (request: SalesRequest) => {
  selectedRequestForDetail.value = request
  isCustomersDetailModalOpen.value = true
  
  // Load customers if not already loaded
  if (customersDetailList.value.length === 0) {
    customersDetailLoading.value = true
    try {
      const cached = getCachedCustomers()
      if (cached && cached.length > 0) {
        customersDetailList.value = cached
      } else {
        customersDetailList.value = await fetchCustomers()
      }
    } catch (error) {
      console.error('Error loading customers for detail:', error)
    } finally {
      customersDetailLoading.value = false
    }
  }
}

// Get customer info helper (for old usage)
const customersMap = computed(() => {
  const map = new Map<number, Customer>()
  for (const customer of createRequestCustomers.value) {
    const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
    if (Number.isFinite(numericId)) {
      map.set(numericId, customer)
    }
  }
  return map
})

const getCustomerInfo = (customerId: number) => {
  const customer = customersMap.value.get(customerId)
  if (!customer) {
    return { name: null, email: null, phone: null }
  }
  return {
    name: customer.full_name,
    email: customer.email,
    phone: customer.phone_number || null,
  }
}

// Get customer detail info (for detail modal)
const customersDetailMap = computed(() => {
  const map = new Map<number, Customer>()
  for (const customer of customersDetailList.value) {
    const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
    if (Number.isFinite(numericId)) {
      map.set(numericId, customer)
    }
  }
  return map
})

const getCustomerDetailInfo = (customerId: number) => {
  const customer = customersDetailMap.value.get(customerId)
  if (!customer) {
    return {
      id: null,
      customer_id: null,
      name: null,
      email: null,
      phone: null,
      tier: null,
      registered_at: null,
      referral_code: null,
    }
  }
  return {
    id: customer.id,
    customer_id: customer.customer_id,
    name: customer.full_name,
    email: customer.email,
    phone: customer.phone_number || null,
    tier: customer.tier || null,
    registered_at: customer.registered_at || null,
    referral_code: customer.referral_code || null,
  }
}

// Get tier color
const getTierColor = (tier: string | null) => {
  if (!tier) return 'neutral'
  const tierLower = tier.toLowerCase()
  if (tierLower.includes('vip') || tierLower.includes('gold')) return 'primary'
  if (tierLower.includes('silver')) return 'neutral'
  if (tierLower.includes('bronze')) return 'warning'
  return 'neutral'
}

// Status color helper
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'primary'
    case 'rejected':
      return 'error'
    case 'cancelled':
      return 'neutral'
    default:
      return 'neutral'
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

