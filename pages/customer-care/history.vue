<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Customer Care History</h1>
          <p class="mt-1 text-sm text-gray-500">
            Explore every recorded interaction with powerful filters and at-a-glance metrics.
          </p>
        </div>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            <p class="mt-1 text-sm text-gray-500">
              Refine the timeline by sales owner, customer, interaction type, channel, or date range.
            </p>
          </div>
          <UButton
            icon="i-heroicons-arrow-down-tray"
            variant="soft"
            color="success"
            size="sm"
            :loading="isExporting"
            :disabled="historyPending || !historyData?.data?.length"
            aria-label="Export interactions to Excel"
            @click="exportToExcel"
          >
            Export Excel
          </UButton>
        </div>
      </template>

      <div class="flex flex-col md:flex-row md:items-start gap-1 filters-container">
        <div class="flex flex-wrap items-center gap-0.5 md:gap-1 w-full">
          <div v-if="canViewSalesUserFilter" class="filter-control">
            <UFormGroup label="Sales user" name="sales_user_id">
              <USelect
                v-model="filters.salesUserId"
                :items="salesUserItems"
                placeholder="All sales users"
                icon="i-heroicons-user-group"
                title="Filter by sales user"
                :disabled="referenceLoading || historyPending"
                @update:model-value="handleFilterChange"
              />
            </UFormGroup>
          </div>

          <div class="filter-control">
            <UFormGroup label="Interaction type" name="type">
              <USelect
                v-model="filters.type"
                :items="interactionTypeItems"
                placeholder="All types"
                icon="i-heroicons-adjustments-horizontal"
                title="Filter by interaction type"
                :disabled="historyPending"
                @update:model-value="handleFilterChange"
              />
            </UFormGroup>
          </div>

          <div class="filter-control">
            <UFormGroup label="Channel" name="channel">
              <USelect
                v-model="filters.channel"
                :items="channelItems"
                placeholder="All channels"
                icon="i-heroicons-chat-bubble-left-right"
                title="Filter by channel"
                :disabled="historyPending || !channelItems.length"
                @update:model-value="handleFilterChange"
              />
            </UFormGroup>
          </div>

          <div class="filter-control filter-control--date">
            <UFormGroup label="Start date" name="start_date">
              <UInput
                v-model="filters.startDate"
                type="date"
                icon="i-heroicons-calendar-days"
                :max="filters.endDate || undefined"
                title="Filter start date"
                :disabled="historyPending"
                @input="handleFilterChange"
              />
            </UFormGroup>
          </div>

          <div class="filter-control filter-control--date">
            <UFormGroup label="End date" name="end_date">
              <UInput
                v-model="filters.endDate"
                type="date"
                icon="i-heroicons-calendar"
                :min="filters.startDate || undefined"
                title="Filter end date"
                :disabled="historyPending"
                @input="handleFilterChange"
              />
            </UFormGroup>
          </div>

          <div class="filter-action">
            <UButton
              icon="i-heroicons-arrow-path"
              variant="soft"
              color="primary"
              size="sm"
              :disabled="!filtersDirty"
              aria-label="Reset history filters"
              @click="resetFilters"
            />
          </div>
        </div>
      </div>
    </UCard>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <UCard
        v-for="summary in overviewSummary"
        :key="summary.label"
        :ui="{ body: 'flex flex-col gap-2' }"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ summary.label }}</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ summary.displayValue }}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full"
            :class="summary.accent"
          >
            <UIcon :name="summary.icon" class="h-5 w-5 text-white" />
          </div>
        </div>
        <p v-if="summary.caption" class="text-xs text-gray-500">
          {{ summary.caption }}
        </p>
      </UCard>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">By interaction type</h3>
              <p class="mt-1 text-sm text-gray-500">Distribution of interactions across activity types.</p>
            </div>
          </div>
        </template>
        <ul class="space-y-3">
          <li
            v-for="item in metricsByType"
            :key="item.label"
            class="flex items-center justify-between rounded-md border border-gray-100 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm"
          >
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg"
                :class="item.bg"
                aria-hidden="true"
              >
                <span class="slds-icon-glyph text-[20px]" :class="item.iconClass"></span>
              </span>
              <span class="text-sm font-medium text-gray-800">{{ item.label }}</span>
            </div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.total }}</span>
          </li>
          <li v-if="!metricsByType.length" class="text-sm text-gray-500">
            No interaction data for the selected filters.
          </li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">By channel</h3>
              <p class="mt-1 text-sm text-gray-500">How interactions are distributed across channels.</p>
            </div>
          </div>
        </template>
        <ul class="space-y-3">
          <li
            v-for="item in metricsByChannel"
            :key="item.label"
            class="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 dark:bg-gray-800/50 px-4 py-2"
          >
            <div class="flex items-center gap-3">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-sm font-semibold uppercase">
                {{ item.initials }}
              </span>
              <span class="text-sm font-medium text-gray-800">{{ item.label }}</span>
            </div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.total }}</span>
          </li>
          <li v-if="!metricsByChannel.length" class="text-sm text-gray-500">
            No channel data for the selected filters.
          </li>
        </ul>
      </UCard>
    </div>

    <UCard :ui="{ body: 'space-y-6' }">
      <template #header>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Interaction timeline</h2>
            <p class="mt-1 text-sm text-gray-500">
              Showing {{ historyData?.total || 0 }} interactions sorted by most recent first.
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <UIcon name="i-heroicons-clock" class="h-4 w-4" />
            Updated {{ timelineUpdatedAt }}
          </div>
        </div>
      </template>

      <div v-if="historyPending" class="space-y-4">
        <USkeleton class="h-8 w-48" />
        <USkeleton class="h-32 w-full" />
        <USkeleton class="h-32 w-full" />
      </div>

      <div v-else-if="!timelineGroups.length" class="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <UIcon name="i-heroicons-document-magnifying-glass" class="h-12 w-12 text-gray-300" />
        <div class="space-y-1">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">No interactions found</p>
          <p class="text-sm text-gray-500">Try adjusting your filters or expanding the date range.</p>
        </div>
      </div>

      <div v-else class="space-y-12">
        <div
          v-for="group in timelineGroups"
          :key="group.date"
          class="space-y-6"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <UIcon name="i-heroicons-calendar-days" class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ group.formattedDate }}</p>
              <p class="text-xs text-gray-500">{{ group.items.length }} interaction{{ group.items.length === 1 ? '' : 's' }}</p>
            </div>
          </div>

          <div class="border-l border-gray-200 dark:border-gray-700 pl-6">
            <div v-for="interaction in group.items" :key="interaction.id" class="relative pb-10 last:pb-0">
              <div class="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-md"></div>
              <div class="rounded-xl border border-gray-100 bg-white dark:bg-gray-900 p-5 shadow-sm transition-colors hover:border-emerald-200">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex items-start gap-4">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-xl shadow-inner"
                      :class="getInteractionMeta(interaction.type).bg"
                    >
                      <span
                        class="slds-icon-glyph text-[26px]"
                        :class="[getInteractionMeta(interaction.type).iconClass, 'text-current']"
                        aria-hidden="true"
                      ></span>
                    </div>
                    <div class="space-y-2">
                      <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                          {{ interaction.subject || formatInteractionTitle(interaction) }}
                        </p>
                        <div class="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                          <span class="inline-flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                            <span
                              class="inline-flex h-2.5 w-2.5 rounded-full"
                              :class="getInteractionMeta(interaction.type).dot"
                            ></span>
                            {{ getInteractionMeta(interaction.type).label }}
                          </span>
                          <span v-if="interaction.channel">Channel: {{ interaction.channel }}</span>
                          <span v-if="interaction.duration_minutes">Duration: {{ interaction.duration_minutes }} mins</span>
                          <span
                            v-if="interaction.follow_up_required"
                            class="inline-flex items-center gap-1 text-amber-600"
                          >
                            <UIcon name="i-heroicons-flag" class="h-3.5 w-3.5" />
                            Follow-up required
                          </span>
                        </div>
                      </div>
                      <p v-if="interaction.detail" class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                        {{ interaction.detail }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col items-start gap-2 text-xs text-gray-500 sm:items-end">
                    <span class="font-medium text-gray-700 dark:text-gray-200">
                      {{ formatDateTime(interaction.interaction_date) }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:text-gray-300">
                      <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
                      Logged {{ formatRelative(interaction.created_at) }}
                    </span>
                    <span
                      v-if="interaction.follow_up_required && interaction.follow_up_date"
                      class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-600"
                    >
                      <UIcon name="i-heroicons-calendar" class="h-3.5 w-3.5" />
                      Follow-up {{ formatReadableDate(interaction.follow_up_date) }}
                    </span>
                  </div>
                </div>

                <div class="mt-4 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-user-circle" class="h-4 w-4 text-gray-400" />
                    <span class="font-medium text-gray-700 dark:text-gray-200">Sales:</span>
                    <span>{{ resolveSalesUser(interaction.sales_user_id) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-user" class="h-4 w-4 text-gray-400" />
                    <span class="font-medium text-gray-700 dark:text-gray-200">Customer:</span>
                    <span>{{ resolveCustomer(interaction.customer_id) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-signal" class="h-4 w-4 text-gray-400" />
                    <span class="font-medium text-gray-700 dark:text-gray-200">Channel:</span>
                    <span>{{ interaction.channel || '—' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-clock" class="h-4 w-4 text-gray-400" />
                    <span class="font-medium text-gray-700 dark:text-gray-200">Duration:</span>
                    <span>{{ formatDuration(interaction.duration_minutes) }}</span>
                  </div>
                </div>

                <div
                  v-if="interaction.attachments?.length"
                  class="mt-4 space-y-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Attachments
                  </p>
                  <div class="flex flex-wrap gap-3">
                    <div
                      v-for="file in interaction.attachments"
                      :key="file.id"
                      class="inline-flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 shadow-sm"
                    >
                      <template v-if="isImageAttachment(file)">
                        <button
                          type="button"
                          class="flex items-center gap-3 text-left hover:text-emerald-600 transition-colors"
                          @click="openAttachmentViewer(interaction, file)"
                          :aria-label="`Preview ${file.file_name || 'image attachment'}`"
                        >
                          <div class="h-12 w-16 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                            <img
                              :src="file.file_url"
                              :alt="file.file_name || 'Attachment preview'"
                              class="h-full w-full object-cover"
                            />
                          </div>
                          <div class="flex flex-col">
                            <span class="font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
                              {{ file.file_name || 'Image attachment' }}
                            </span>
                            <span class="text-[10px] uppercase tracking-wide text-gray-400">
                              {{ file.file_type || 'image' }}
                            </span>
                          </div>
                        </button>
                      </template>
                      <template v-else>
                        <a
                          :href="file.file_url"
                          target="_blank"
                          rel="noopener"
                          class="flex items-center gap-3 hover:text-emerald-600 transition-colors"
                        >
                          <div class="flex h-12 w-16 items-center justify-center rounded-md bg-gray-200">
                            <UIcon :name="getAttachmentIcon(file.file_type)" class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div class="flex flex-col">
                            <span class="font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
                              {{ file.file_name || 'Attachment' }}
                            </span>
                            <span class="text-[10px] uppercase tracking-wide text-gray-400">
                              {{ file.file_type || 'file' }}
                            </span>
                          </div>
                        </a>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>
    <div ref="attachmentGalleryRef" class="hidden">
      <img
        v-for="image in galleryImages"
        :key="image.src"
        :src="image.src"
        :alt="image.alt"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from '#imports'
import type { SalesUser } from '~/composables/useSalesUsers'
import type { CustomerInteraction } from '~/composables/useCustomerInteractions'
import { useSalesUsers } from '~/composables/useSalesUsers'
import { useImageViewer } from '~/composables/useImageViewer'
import {
  useCustomerInteractions,
  type InteractionFiltersInput,
  type InteractionHistoryResponse,
  type InteractionMetrics,
} from '~/composables/useCustomerInteractions'

definePageMeta({
  middleware: ['auth'],
})

const toast = useToast()

// Permissions
const { hasPermission } = usePermissions()
const canViewSalesUserFilter = computed(() => hasPermission('customerCare', 'viewSalesUserFilter'))

const { fetchInteractionHistory, fetchInteractionMetrics } = useCustomerInteractions()
const { fetchSalesUsers } = useSalesUsers()

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfRange = () => {
  const date = new Date()
  date.setDate(date.getDate() - 29)
  return formatDateInput(date)
}

const endOfRange = () => formatDateInput(new Date())

const filters = reactive({
  salesUserId: null as number | null,
  type: null as string | null,
  channel: null as string | null,
  startDate: startOfRange(),
  endDate: endOfRange(),
})

const referenceLoading = ref(false)
const isExporting = ref(false)
const salesUsers = ref<SalesUser[]>([])

const interactionTypeMeta: Record<
  string,
  { label: string; iconClass: string; bg: string; dot: string }
> = {
  call: {
    label: 'Call',
    iconClass: 'slds-icons-call',
    bg: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-500',
  },
  email: {
    label: 'Email',
    iconClass: 'slds-icons-email',
    bg: 'bg-indigo-50 text-indigo-600',
    dot: 'bg-indigo-500',
  },
  meeting: {
    label: 'Meeting',
    iconClass: 'slds-icons-custom14',
    bg: 'bg-amber-50 text-amber-600',
    dot: 'bg-amber-500',
  },
  chat: {
    label: 'Chat',
    iconClass: 'slds-icons-chat',
    bg: 'bg-sky-50 text-sky-600',
    dot: 'bg-sky-500',
  },
  sms: {
    label: 'SMS',
    iconClass: 'slds-icons-sms',
    bg: 'bg-purple-50 text-purple-600',
    dot: 'bg-purple-500',
  },
  other: {
    label: 'Other',
    iconClass: 'slds-icons-sparkles',
    bg: 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
}

const getInteractionMeta = (type: string) => {
  const key = (type || '').toLowerCase()
  return interactionTypeMeta[key] || interactionTypeMeta.other
}

// Use image viewer composable
const {
  galleryImages,
  attachmentGalleryRef,
  isViewerActive,
  isImageAttachment,
  getAttachmentIcon,
  openViewer,
} = useImageViewer()

const openAttachmentViewer = async (
  interaction: CustomerInteraction,
  attachment: CustomerInteraction['attachments'][number],
) => {
  const images = (interaction.attachments || []) as Array<CustomerInteraction['attachments'][number] & { id?: number }>
  await openViewer(images, attachment, attachmentGalleryRef.value)
}

const filterPayload = computed<InteractionFiltersInput>(() => {
  return {
    sales_user_id: filters.salesUserId ?? undefined,
    type: filters.type ?? undefined,
    channel: filters.channel ?? undefined,
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
  }
})

const metricsPayload = computed<InteractionFiltersInput>(() => ({
  sales_user_id: filterPayload.value.sales_user_id,
  start_date: filterPayload.value.start_date,
  end_date: filterPayload.value.end_date,
}))

const historyDefaults = (): InteractionHistoryResponse => ({
  success: true,
  filters: {},
  total: 0,
  data: [],
  overview_metrics: {
    customers_today: 0,
    customers_this_week: 0,
    customers_this_month: 0,
    customers_previous_month: 0,
    month_over_month_growth: null,
    new_customers_this_month: 0,
  },
})

const metricsDefaults = (): InteractionMetrics => ({
  total_interactions: 0,
  interactions_by_type: {},
  interactions_by_channel: {},
  interactions_by_sales_user: [],
  interactions_by_customer: [],
  daily_breakdown: [],
})

const {
  data: historyData,
  pending: historyPending,
  refresh: refreshHistory,
  error: historyError,
} = useLazyAsyncData(
  'customer-care-history-interactions',
  () => fetchInteractionHistory(filterPayload.value),
  {
    server: false,
    immediate: true,
    default: historyDefaults,
  },
)

const {
  data: metricsData,
  pending: metricsPending,
  refresh: refreshMetrics,
  error: metricsError,
} = useLazyAsyncData(
  'customer-care-history-metrics',
  () => fetchInteractionMetrics(metricsPayload.value),
  {
    server: false,
    immediate: true,
    default: metricsDefaults,
  },
)

watch(filterPayload, () => {
  refreshHistory()
  refreshMetrics()
}, { deep: true })

watch(historyError, (err) => {
  if (err) {
    toast.add({
      title: 'Unable to load interactions',
      description: err.message || 'Please try again.',
      color: 'error',
    })
  }
})

watch(metricsError, (err) => {
  if (err) {
    toast.add({
      title: 'Unable to load metrics',
      description: err.message || 'Please try again.',
      color: 'error',
    })
  }
})

const salesUserItems = computed(() => {
  const base = [{ label: 'All sales users', value: null }]
  const items = salesUsers.value.map((user) => ({
    label: user.full_name || `#${user.id ?? user.sales_user_id}`,
    value: user.id ?? user.sales_user_id ?? null,
  })).filter((item) => item.value !== null)
  return [...base, ...items]
})

const interactionTypeOrder: Array<keyof typeof interactionTypeMeta> = [
  'call',
  'email',
  'meeting',
  'chat',
  'sms',
  'other',
]

const interactionTypeItems = computed(() => {
  const base = [{ label: 'All types', value: null }]
  const items = interactionTypeOrder.map((value) => ({
    label: interactionTypeMeta[value].label,
    value,
  }))
  return [...base, ...items]
})

const channelItems = computed(() => {
  const channels = new Set<string>()
  for (const interaction of historyData.value?.data || []) {
    if (interaction.channel) {
      channels.add(interaction.channel)
    }
  }
  const base = [{ label: 'All channels', value: null }]
  const items = Array.from(channels).map((channel) => ({
    label: channel,
    value: channel,
  }))
  return [...base, ...items]
})

const timelineGroups = computed(() => {
  const interactions = [...(historyData.value?.data || [])]
  if (!interactions.length) return []

  const groups = new Map<string, CustomerInteraction[]>()

  interactions.forEach((interaction) => {
    const key = interaction.interaction_date
      ? interaction.interaction_date.slice(0, 10)
      : 'Unknown'
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(interaction)
  })

  const sortedGroups = Array.from(groups.entries())
    .map(([date, items]) => ({
      date,
      items: items.sort(
        (a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime(),
      ),
      formattedDate: date === 'Unknown' ? 'Unknown date' : formatReadableDate(date),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return sortedGroups
})

const timelineUpdatedAt = computed(() => {
  const date = historyData.value?.data?.[0]?.updated_at || historyData.value?.data?.[0]?.created_at
  if (!date) return 'just now'
  return formatRelative(date)
})

const overviewSummary = computed(() => {
  const metrics = historyData.value?.overview_metrics
  const totalInteractions = metricsData.value?.total_interactions ?? historyData.value?.total ?? 0
  const growth = metrics?.month_over_month_growth

  return [
    {
      label: 'Total interactions',
      displayValue: formatNumber(totalInteractions),
      icon: 'i-heroicons-sparkles',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Customers engaged · today',
      displayValue: formatNumber(metrics?.customers_today ?? 0),
      icon: 'i-heroicons-bolt',
      accent: 'bg-sky-500',
    },
    {
      label: 'New engaged customers · this month',
      displayValue: formatNumber(metrics?.new_customers_this_month ?? 0),
      icon: 'i-heroicons-user-plus',
      accent: 'bg-purple-500',
    },
    {
      label: 'Month-over-month growth',
      displayValue: growth != null ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : '—',
      caption: 'Compared to previous month',
      icon: 'i-heroicons-chart-bar',
      accent: 'bg-amber-500',
    },
  ]
})

const metricsByType = computed(() => {
  const entries = Object.entries(metricsData.value?.interactions_by_type || {})
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([rawType, total]) => {
      const meta = getInteractionMeta(rawType)
      return {
        label: meta.label,
        total,
        iconClass: `${meta.iconClass} text-current`,
        bg: meta.bg,
      }
    })
})

const metricsByChannel = computed(() => {
  const entries = Object.entries(metricsData.value?.interactions_by_channel || {})
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Only show top 5 most popular channels
    .map(([label, total]) => ({
      label: label || 'Unspecified',
      total,
      initials: (label || '—').slice(0, 2).toUpperCase(),
    }))
})

const filtersDirty = computed(() => {
  return Boolean(
    filters.salesUserId ||
    filters.type ||
    filters.channel ||
    filters.startDate !== startOfRange() ||
    filters.endDate !== endOfRange(),
  )
})

const salesUserMap = computed(() => {
  const map = new Map<number, SalesUser>()
  for (const user of salesUsers.value) {
    const id = user.id ?? user.sales_user_id
    if (id != null) {
      map.set(Number(id), user)
    }
  }
  return map
})

const resolveSalesUser = (id: number) => {
  const entry = salesUserMap.value.get(Number(id))
  return entry ? `${entry.full_name} (#${entry.staff_code ?? id})` : `Sales #${id}`
}

const resolveCustomer = (id: number) => {
  return `Customer #${id}`
}

const handleFilterChange = () => {
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    if (start > end) {
      filters.endDate = filters.startDate
    }
  }
}

const resetFilters = () => {
  filters.salesUserId = null
  filters.type = null
  filters.channel = null
  filters.startDate = startOfRange()
  filters.endDate = endOfRange()
}

const exportToExcel = async () => {
  const interactions = historyData.value?.data || []
  if (!interactions.length) {
    toast.add({
      title: 'No data',
      description: 'There are no interactions to export.',
      icon: 'i-heroicons-exclamation-circle',
      color: 'warning',
    })
    return
  }

  isExporting.value = true
  try {
    const exportData = interactions.map((i: CustomerInteraction) => ({
      'ID': i.id,
      'Type': getInteractionMeta(i.type).label,
      'Channel': i.channel || '',
      'Subject': i.subject || '',
      'Detail': i.detail || '',
      'Sales User': resolveSalesUser(i.sales_user_id),
      'Customer': resolveCustomer(i.customer_id),
      'Interaction Date': i.interaction_date ? new Date(i.interaction_date).toLocaleString() : '',
      'Duration (mins)': i.duration_minutes ?? '',
      'Follow-up Required': i.follow_up_required ? 'Yes' : 'No',
      'Follow-up Date': i.follow_up_date ? new Date(i.follow_up_date).toLocaleDateString() : '',
      'Created At': i.created_at ? new Date(i.created_at).toLocaleString() : '',
    }))

    const xlsx = await import('xlsx')
    const worksheet = xlsx.utils.json_to_sheet(exportData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Interactions')

    const dateStr = new Date().toISOString().split('T')[0]
    xlsx.writeFile(workbook, `interactions_export_${dateStr}.xlsx`)

    toast.add({
      title: 'Export Successful',
      description: `Exported ${exportData.length} interactions to Excel.`,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })
  } catch (err: any) {
    console.error('Error exporting interactions', err)
    toast.add({
      title: 'Export Failed',
      description: err.message || 'An error occurred while exporting.',
      icon: 'i-heroicons-x-circle',
      color: 'error',
    })
  } finally {
    isExporting.value = false
  }
}

const formatInteractionTitle = (interaction: CustomerInteraction) => {
  const meta = getInteractionMeta(interaction.type)
  const parts = [meta.label]
  if (interaction.channel) {
    parts.push(`via ${interaction.channel}`)
  }
  return parts.join(' ')
}

const formatLabel = (value?: string | null) => {
  if (!value) return 'Unspecified'
  return value
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

const formatDuration = (minutes?: number | null) => {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`
}

const formatReadableDate = (date: string) => {
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return 'Unknown date'
  return value.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (date?: string | null) => {
  if (!date) return 'Unknown'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return 'Unknown'
  return value.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelative = (date?: string | null) => {
  if (!date) return 'just now'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return 'just now'
  const diff = Date.now() - value.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat().format(value || 0)
}


onMounted(async () => {
  referenceLoading.value = true
  try {
    const sales = await fetchSalesUsers()
    salesUsers.value = sales || []
  } catch (error: any) {
    toast.add({
      title: 'Unable to load reference data',
      description: error?.message || 'Please refresh the page.',
      color: 'error',
    })
  } finally {
    referenceLoading.value = false
  }
})
</script>

<style scoped>
.filters-container {
  min-height: 4.5rem;
}

.filter-control {
  width: 100%;
}

.filter-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

@media (min-width: 768px) {
  .filter-control,
  .filter-control--date {
    width: 22rem;
  }

  .filter-action {
    width: auto;
  }
}
</style>
