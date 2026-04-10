<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton 
        color="neutral" 
        variant="ghost" 
        icon="i-heroicons-arrow-left"
        @click="goBack"
      >
        Back
      </UButton>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Sales User Details</h1>
        <p class="text-sm text-gray-500 mt-1">{{ salesUser?.full_name || idParam || 'Loading...' }}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-6 items-start">
      <!-- Sales User Info Card -->
      <UCard v-if="salesUser" class="h-full">
        <template #header>
          <h2 class="text-base font-semibold text-gray-900">Sales User Information</h2>
        </template>

        <div class="space-y-4 text-sm text-gray-700">
          <div class="flex items-center gap-3 pb-3 border-b border-gray-200">
            <UAvatar 
              :src="salesUser.avatar || undefined" 
              :alt="salesUser.full_name" 
              size="md" 
            />
            <div>
              <h3 class="text-base font-semibold text-gray-900">{{ salesUser.full_name }}</h3>
              <p class="text-xs text-gray-500 uppercase tracking-wide">{{ salesUser.staff_code }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
              <span class="text-gray-900">{{ salesUser.email }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Lark Email</span>
              <span class="text-gray-900">{{ salesUser.email_lark || '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</span>
              <span class="text-gray-900">{{ salesUser.phone || '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</span>
              <span class="text-gray-900">{{ salesUser.department || '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</span>
              <span class="text-gray-900">{{ salesUser.role || '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
              <UBadge :color="statusColor(salesUser.status)" variant="soft">
                {{ salesUser.status || 'active' }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Analytics Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Analytics</h2>
            <UButton 
              color="primary" 
              variant="ghost" 
              icon="i-heroicons-arrow-path"
              size="sm"
              @click="refreshIframe"
            >
              Refresh
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="iframeLoading" class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-[600px]">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p class="mt-2 text-sm text-gray-500">Loading analytics dashboard...</p>
            </div>
          </div>
          <div v-else-if="assignedCustomerIds.length === 0" class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-[600px]">
            <div class="text-center text-gray-400">
              <UIcon name="i-heroicons-chart-bar" class="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p class="text-sm font-medium">No assigned customers</p>
              <p class="text-xs mt-1">This sales user has no customers assigned yet.</p>
            </div>
          </div>
          <div v-else-if="!iframeUrl" class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-[600px]">
            <div class="text-center text-gray-400">
              <p class="text-sm">Failed to generate analytics dashboard URL</p>
            </div>
          </div>
          <div v-else class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <iframe
              :key="iframeKey"
              :src="iframeUrl"
              class="w-full h-[600px] border-0"
              frameborder="0"
              allowfullscreen
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-downloads"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SalesUser } from '~/composables/useSalesUsers'
import type { SalesUserWithCustomers } from '~/composables/useCustomerAssignments'

definePageMeta({})

const route = useRoute()
const router = useRouter()

// Get id from route params (could be numeric id or staff_code)
const idParam = computed(() => route.params.id as string)
const numericId = computed(() => {
  const value = Number(idParam.value)
  return Number.isFinite(value) && !Number.isNaN(value) ? value : null
})

// Log immediately to verify component is loading
console.log('🟢 [id].vue] Component loaded!')
console.log('🟢 [id].vue] Route path:', route.path)
console.log('🟢 [id].vue] Route params:', route.params)
console.log('🟢 [id].vue] ID:', idParam.value)

const { fetchSalesUsers } = useSalesUsers()
const { fetchSalesWithCustomers } = useCustomerAssignments()

// Simple: fetch sales users and find by staff_code (using id as staff_code)
const salesUser = ref<SalesUser | null>(null)
const salesUserWithCustomers = ref<SalesUserWithCustomers | null>(null)

const loadSalesUser = async () => {
  console.log('🟢 [id].vue] loadSalesUser, ID param:', idParam.value)
  try {
    const users = await fetchSalesUsers()
    let found: SalesUser | undefined

    if (numericId.value !== null) {
      found = users.find(
        (u: SalesUser) =>
          u.id === numericId.value || u.sales_user_id === numericId.value || Number(u.staff_code) === numericId.value
      )
    }

    if (!found) {
      found = users.find((u: SalesUser) => u.staff_code === idParam.value)
    }

    salesUser.value = found || null
    console.log('🟢 [id].vue] Found user:', salesUser.value)

    // Load sales user with customers for analytics
    if (salesUser.value) {
      await loadSalesUserWithCustomers()
    }
  } catch (err) {
    console.error('❌ [id].vue] Error fetching sales user:', err)
  }
}

const loadSalesUserWithCustomers = async () => {
  try {
    const salesWithCustomers = await fetchSalesWithCustomers()
    const salesUserId = salesUser.value?.id ?? salesUser.value?.sales_user_id
    
    if (salesUserId) {
      const found = salesWithCustomers.find(
        (s: SalesUserWithCustomers) => s.sales_user_id === salesUserId
      )
      salesUserWithCustomers.value = found || null
      console.log('🟢 [id].vue] Found sales user with customers:', salesUserWithCustomers.value)
    }
  } catch (err) {
    console.error('❌ [id].vue] Error fetching sales user with customers:', err)
  }
}

watch(idParam, () => {
  loadSalesUser()
}, { immediate: true })

// Generate embed URL dynamically
const { generateSalesAnalyticsUrl } = useEmbedUrl()
const iframeUrl = ref<string>('')
const iframeKey = ref(0)
const iframeLoading = ref(true)

// Get customer IDs from assigned customers
const assignedCustomerIds = computed(() => {
  if (!salesUserWithCustomers.value?.customers || salesUserWithCustomers.value.customers.length === 0) {
    return []
  }
  
  return salesUserWithCustomers.value.customers
    .map((assignment) => {
      const id = assignment.customer_id
      const numeric = typeof id === 'number' ? id : Number(id)
      return Number.isFinite(numeric) ? numeric : null
    })
    .filter((id): id is number => id !== null)
})

// Generate embed URL on mount
onMounted(async () => {
  console.log('🟢 [id].vue] Generating analytics embed URL...')
  await generateAnalyticsUrl()
})

const generateAnalyticsUrl = async () => {
  iframeLoading.value = true
  try {
    if (!salesUser.value) {
      console.warn('❌ [id].vue] No sales user found')
      iframeUrl.value = ''
      return
    }

    const saleUserId = salesUser.value.id ?? salesUser.value.sales_user_id
    if (!saleUserId) {
      console.warn('❌ [id].vue] No sale user ID found')
      iframeUrl.value = ''
      return
    }

    const url = await generateSalesAnalyticsUrl(saleUserId)
    if (url) {
      iframeUrl.value = url
      console.log('✅ [id].vue] Analytics embed URL generated:', url)
    } else {
      console.error('❌ [id].vue] Failed to generate analytics embed URL')
      iframeUrl.value = ''
    }
  } catch (error) {
    console.error('❌ [id].vue] Error generating analytics embed URL:', error)
    iframeUrl.value = ''
  } finally {
    iframeLoading.value = false
  }
}

const refreshIframe = async () => {
  console.log('🟢 [id].vue] Refreshing analytics iframe...')
  // Reload sales user with customers to get latest assignments
  await loadSalesUserWithCustomers()
  // Regenerate URL with updated sale user ID
  iframeKey.value++ // Force iframe reload
  await generateAnalyticsUrl()
}

// Watch for changes in sales user and regenerate URL
watch(salesUser, () => {
  if (salesUser.value) {
    generateAnalyticsUrl()
  }
}, { deep: true })

const statusColor = (s?: string) => {
  return (s || 'active').toLowerCase() === 'inactive' ? 'warning' : 'primary'
}

const goBack = () => {
  router.push('/sales-users')
}
</script>
