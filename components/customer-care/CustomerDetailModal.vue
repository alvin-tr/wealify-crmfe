<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ content: 'w-[95vw] max-w-[1100px] xl:max-w-[1400px] h-[90vh]' }"
    title="Customer Detail"
    @update:open="(val) => $emit('update:open', val)"
  >
    <template #body>
      <div v-if="customer" class="grid h-full gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <div class="space-y-6 overflow-y-auto pr-2">
          <UCard>
            <div class="space-y-4 text-sm text-gray-700">
              <div>
                <p class="text-xs uppercase text-gray-500">Full name</p>
                <p class="text-base font-semibold text-gray-900">{{ customer.full_name }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Customer ID</p>
                <p class="font-mono text-sm text-gray-800">{{ customer.customer_id }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Email</p>
                <p>{{ customer.email || '—' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Phone</p>
                <p>{{ customer.phone_number || '—' }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Tier</p>
                <UBadge variant="soft" color="primary">{{ customer.tier || '—' }}</UBadge>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Registered at</p>
                <p>{{ formatDate(customer.registered_at) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase text-gray-500">Referral code</p>
                <p class="font-mono text-sm text-gray-800">{{ customer.referral_code || '—' }}</p>
              </div>
              <div class="border-t border-gray-200 pt-3">
                <p class="text-xs uppercase text-gray-500 mb-2">Acquisition Source</p>
                <div v-if="customer.source_name" class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UBadge variant="soft" color="success" size="sm">{{ customer.source_name }}</UBadge>
                  </div>
                  <p v-if="customer.source_description" class="text-xs text-gray-500 leading-relaxed">
                    {{ customer.source_description }}
                  </p>
                </div>
                <p v-else class="text-sm text-gray-400">—</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="space-y-3">
              <p class="text-xs uppercase text-gray-500">Current sales owner</p>
              <div v-if="salesUserInfo?.currentSalesUser" class="flex items-center gap-2">
                <UAvatar
                  :src="salesUserInfo.currentSalesUser.avatar"
                  :alt="salesUserInfo.currentSalesUser.full_name"
                  size="sm"
                />
                <div class="text-sm text-gray-700">
                  <p class="font-semibold text-gray-900">{{ salesUserInfo.currentSalesUser.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ salesUserInfo.currentSalesUser.staff_code }}</p>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400">Unassigned</p>
              <div class="text-sm text-gray-500 space-y-1">
                <p v-if="salesUserInfo?.assignmentDate">Assigned on {{ salesUserInfo.assignmentDate }}</p>
                <p v-if="salesUserInfo?.assignmentNote" class="text-xs text-gray-400 italic">
                  "{{ salesUserInfo.assignmentNote }}"
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <div class="flex flex-col h-full space-y-4 overflow-hidden">
          <UTabs v-model="activeTab" :items="tabs" />
          <div v-if="activeTab === 'analytics'" class="flex-1 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
            <div v-if="loading" class="flex h-full items-center justify-center text-gray-500 px-4 py-12">
              <div class="flex items-center gap-3">
                <div class="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600"></div>
                <span>Loading dashboard…</span>
              </div>
            </div>
            <div v-else-if="error" class="h-full flex items-center justify-center text-sm text-red-600 px-4 text-center">
              {{ error }}
            </div>
            <iframe
              v-else-if="embedUrl"
              :src="embedUrl"
              class="w-full h-full border-0"
              allowtransparency="true"
              allowfullscreen
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-downloads"
            />
            <div v-else class="h-full flex items-center justify-center text-sm text-gray-400 px-4 py-12">
              No dashboard available.
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">
        Select a customer to view details.
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-end">
        <UButton variant="ghost" color="neutral" @click="handleClose">Close</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Customer } from '~/composables/useCustomers'

interface SalesUserInfo {
  currentSalesUser?: {
    full_name: string
    staff_code: string
    avatar?: string | null
  } | null
  assignmentDate?: string | null
  assignmentNote?: string | null
}

interface Props {
  open: boolean
  customer: Customer | null
  salesUserInfo?: SalesUserInfo | null
  customerNumericId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  salesUserInfo: null,
  customerNumericId: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})

const activeTab = ref<'analytics'>('analytics')
const tabs = [
  { label: 'Analytics', value: 'analytics' },
]

const embedUrl = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

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

const { generateCustomerAnalyticsUrl } = useEmbedUrl()

const loadCustomerEmbed = async (customerId: number) => {
  loading.value = true
  error.value = null
  embedUrl.value = null
  try {
    console.log('[CustomerDetailModal] Generating embed URL for customer:', customerId)
    
    const url = await generateCustomerAnalyticsUrl({
      dashboard: 75,
      customerId,
    })

    if (url) {
      embedUrl.value = url
    } else {
      error.value = 'Unable to generate customer insights embed.'
    }
  } catch (err: any) {
    console.error('[CustomerDetailModal] Error:', err)
    error.value = err?.message || 'Failed to generate embedded dashboard URL.'
  } finally {
    loading.value = false
  }
}

watch(() => props.open, (open) => {
  if (open && props.customerNumericId) {
    activeTab.value = 'analytics'
    loadCustomerEmbed(props.customerNumericId)
  } else if (!open) {
    embedUrl.value = null
    loading.value = false
    error.value = null
  }
})

watch(() => props.customerNumericId, (customerId) => {
  if (props.open && customerId) {
    loadCustomerEmbed(customerId)
  }
})

const handleClose = () => {
  emit('close')
  emit('update:open', false)
}
</script>







