<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Leads History</h1>
          <p class="mt-1 text-sm text-gray-500">
            Explore every recorded interaction with leads, including calls, emails, meetings, and notes.
          </p>
        </div>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
            <p class="mt-1 text-sm text-gray-500">
              Refine the timeline by sales owner, lead, interaction type, or date range.
            </p>
          </div>
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

    <div v-if="statistics" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <UCard
        v-for="summary in overviewSummary"
        :key="summary.label"
        :ui="{ body: 'flex flex-col gap-2' }"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-gray-500">{{ summary.label }}</p>
            <p class="text-2xl font-semibold text-gray-900">{{ summary.displayValue }}</p>
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

    <UCard :ui="{ body: 'space-y-6' }">
      <template #header>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Interaction timeline</h2>
            <p class="mt-1 text-sm text-gray-500">
              Showing {{ totalInteractions }} interaction{{ totalInteractions === 1 ? '' : 's' }} sorted by most recent first.
            </p>
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
          <p class="text-sm font-semibold text-gray-700">No interactions found</p>
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
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <UIcon name="i-heroicons-calendar-days" class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ group.formattedDate }}</p>
              <p class="text-xs text-gray-500">{{ group.items.length }} interaction{{ group.items.length === 1 ? '' : 's' }}</p>
            </div>
          </div>

          <div class="border-l border-gray-200 pl-6">
            <div v-for="interaction in group.items" :key="interaction.id" class="relative pb-10 last:pb-0">
              <div class="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white bg-purple-500 shadow-md"></div>
              <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-purple-200">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex items-start gap-4 flex-1">
                    <div
                      class="flex h-12 w-12 items-center justify-center rounded-xl shadow-inner"
                      :class="getInteractionMeta(interaction.type || 'other').bg"
                    >
                      <UIcon
                        :name="getInteractionMeta(interaction.type || 'other').icon"
                        class="h-6 w-6"
                        :class="getInteractionMeta(interaction.type || 'other').iconColor"
                      />
                    </div>
                    <div class="flex-1 space-y-2">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                          <p class="text-sm font-semibold text-gray-900">
                            {{ interaction.summary || formatInteractionTitle(interaction) }}
                          </p>
                          <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span class="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 font-medium text-purple-700">
                              <span
                                class="inline-flex h-2 w-2 rounded-full"
                                :class="getInteractionMeta(interaction.type || 'other').dot"
                              ></span>
                              {{ getInteractionMeta(interaction.type || 'other').label }}
                            </span>
                            <span class="flex items-center gap-1.5">
                              <UIcon name="i-heroicons-user-circle" class="h-3.5 w-3.5 text-gray-400" />
                              <span class="font-medium text-gray-700">{{ interaction.lead_name || `Lead #${interaction.lead_id}` }}</span>
                            </span>
                            <span v-if="interaction.sales_user_name" class="flex items-center gap-1.5">
                              <UIcon name="i-heroicons-user-group" class="h-3.5 w-3.5 text-blue-500" />
                              <span class="text-gray-600">{{ interaction.sales_user_name }}</span>
                            </span>
                          </div>
                        </div>
                        <UButton
                          color="primary"
                          variant="soft"
                          size="sm"
                          icon="i-heroicons-eye"
                          @click="openLeadDetail(interaction.lead_id)"
                        >
                          View Details
                        </UButton>
                      </div>

                      <p v-if="interaction.notes" class="text-sm text-gray-700 whitespace-pre-line">
                        {{ interaction.notes }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col items-start gap-2 text-xs text-gray-500 sm:items-end">
                    <span class="font-medium text-gray-700">
                      {{ formatDateTime(interaction.interaction_at || interaction.created_at || null) }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                      <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
                      Logged {{ formatRelative(interaction.created_at || null) }}
                    </span>
                  </div>
                </div>

                <div
                  v-if="interaction.attachments && interaction.attachments.length > 0"
                  class="mt-4 space-y-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Attachments
                  </p>
                  <div class="flex flex-wrap gap-3">
                    <div
                      v-for="(file, idx) in interaction.attachments"
                      :key="file.id || idx"
                      class="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm"
                    >
                      <template v-if="file.file_url && isImageAttachment({ file_url: file.file_url, file_name: file.file_name, id: file.id })">
                        <button
                          type="button"
                          class="flex items-center gap-3 text-left hover:text-purple-600 transition-colors"
                          @click="openAttachmentViewer(interaction, file)"
                          :aria-label="`Preview ${file.file_name || 'image attachment'}`"
                        >
                          <div class="h-12 w-16 overflow-hidden rounded-md border border-gray-200">
                            <img
                              :src="file.file_url"
                              :alt="file.file_name || 'Attachment preview'"
                              class="h-full w-full object-cover"
                            />
                          </div>
                          <div class="flex flex-col">
                            <span class="font-semibold text-gray-700 truncate max-w-[180px]">
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
                          v-if="file.file_url"
                          :href="file.file_url"
                          target="_blank"
                          rel="noopener"
                          class="flex items-center gap-3 hover:text-purple-600 transition-colors"
                        >
                          <div class="flex h-12 w-16 items-center justify-center rounded-md bg-gray-200">
                            <UIcon :name="getAttachmentIcon(file.file_type || null)" class="h-5 w-5 text-gray-600" />
                          </div>
                          <div class="flex flex-col">
                            <span class="font-semibold text-gray-700 truncate max-w-[180px]">
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

    <LeadDetailDrawer
      :open="selectedLeadId !== null"
      :lead-id="selectedLeadId"
      :pending="detailPending"
      :detail="leadDetail"
      :reference="reference"
      @close="selectedLeadId = null"
      @updated="handleDetailUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from '#imports'
import type { SalesUser } from '~/composables/useSalesUsers'
import type { LeadInteractionWithDetails, LeadInteractionsStatistics, LeadReferenceItem } from '~/composables/useLeads'
import { useSalesUsers } from '~/composables/useSalesUsers'
import { useLeads } from '~/composables/useLeads'
import { useImageViewer } from '~/composables/useImageViewer'
import LeadDetailDrawer from '~/components/leads/LeadDetailDrawer.vue'

definePageMeta({
  middleware: ['auth'],
})

const toast = useToast()

// Permissions
const { hasPermission } = usePermissions()
const canViewSalesUserFilter = computed(() => hasPermission('leads', 'viewSalesUserFilter'))

const { fetchSalesInteractions, fetchLeadDetail, fetchLeadStatuses, fetchLeadStages, fetchLeadSources } = useLeads()
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
  startDate: startOfRange(),
  endDate: endOfRange(),
})

const referenceLoading = ref(false)
const salesUsers = ref<SalesUser[]>([])
const historyPending = ref(false)
const allInteractions = ref<LeadInteractionWithDetails[]>([])
const statistics = ref<LeadInteractionsStatistics | null>(null)

// Lead detail drawer state
const selectedLeadId = ref<number | null>(null)
const leadDetailKey = ref('lead-detail-null')
const {
  data: leadDetail,
  pending: detailPending,
  refresh: refreshLeadDetail,
} = await useAsyncData<any>(
  leadDetailKey,
  () => (selectedLeadId.value !== null ? fetchLeadDetail(selectedLeadId.value) : Promise.resolve(null)),
)

// Reference data for LeadDetailDrawer
const {
  data: reference,
  pending: referencePending,
} = await useAsyncData(
  'leads-history-reference',
  async () => {
    const [statuses, stages, sources] = await Promise.all([
      fetchLeadStatuses(),
      fetchLeadStages(),
      fetchLeadSources(),
    ])
    return { statuses, stages, sources }
  },
  {
    lazy: true,
    default: () => ({ statuses: [], stages: [], sources: [] }),
  },
)

const interactionTypeMeta: Record<
  string,
  { label: string; icon: string; bg: string; iconColor: string; dot: string }
> = {
  call: {
    label: 'Call',
    icon: 'i-heroicons-phone-arrow-up-right',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  email: {
    label: 'Email',
    icon: 'i-heroicons-envelope-open',
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    dot: 'bg-indigo-500',
  },
  meeting: {
    label: 'Meeting',
    icon: 'i-heroicons-users',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  note: {
    label: 'Note',
    icon: 'i-heroicons-document-text',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  other: {
    label: 'Other',
    icon: 'i-heroicons-sparkles',
    bg: 'bg-gray-50',
    iconColor: 'text-gray-600',
    dot: 'bg-gray-400',
  },
}

const getInteractionMeta = (type: string) => {
  const key = (type || 'other').toLowerCase()
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
  interaction: LeadInteractionWithDetails,
  attachment: { id?: number; file_url?: string | null; file_name?: string | null },
) => {
  if (!interaction.attachments || !attachment.file_url) return
  
  // Convert to ImageAttachment format
  const images = interaction.attachments
    .filter((att) => att.file_url && isImageAttachment({ file_url: att.file_url, file_name: att.file_name, id: att.id }))
    .map((att) => ({
      id: att.id,
      file_url: att.file_url!,
      file_name: att.file_name,
    }))
  
  const targetImage = {
    id: attachment.id,
    file_url: attachment.file_url,
    file_name: attachment.file_name,
  }
  
  await openViewer(images, targetImage, attachmentGalleryRef.value)
}

const loadInteractions = async () => {
  historyPending.value = true
  try {
    const params: {
      sales_user_id?: number
      start_date?: string
      end_date?: string
    } = {}

    if (filters.salesUserId) {
      params.sales_user_id = filters.salesUserId
    }
    if (filters.startDate) {
      params.start_date = filters.startDate
    }
    if (filters.endDate) {
      params.end_date = filters.endDate
    }

    const response = await fetchSalesInteractions(params)
    
    if (response.success) {
      allInteractions.value = response.data || []
      statistics.value = response.statistics || null
    } else {
      throw new Error('Failed to fetch interactions')
    }
  } catch (error: any) {
    toast.add({
      title: 'Unable to load interactions',
      description: error?.message || 'Please try again.',
      color: 'error',
    })
    allInteractions.value = []
    statistics.value = null
  } finally {
    historyPending.value = false
  }
}

const filteredInteractions = computed(() => {
  let result = [...allInteractions.value]

  // Filter by type (client-side filter since API doesn't support it)
  if (filters.type) {
    result = result.filter((i) => i.type === filters.type)
  }

  // Data is already sorted by API, but we can re-sort if needed
  return result.sort((a, b) => {
    const dateA = new Date(a.interaction_at || a.created_at || '').getTime()
    const dateB = new Date(b.interaction_at || b.created_at || '').getTime()
    return dateB - dateA
  })
})

const totalInteractions = computed(() => filteredInteractions.value.length)

const timelineGroups = computed(() => {
  const interactions = [...filteredInteractions.value]
  if (!interactions.length) return []

  const groups = new Map<string, LeadInteractionWithDetails[]>()

  interactions.forEach((interaction) => {
    const date = interaction.interaction_at || interaction.created_at || ''
    const key = date ? date.slice(0, 10) : 'Unknown'
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(interaction)
  })

  const sortedGroups = Array.from(groups.entries())
    .map(([date, items]) => ({
      date,
      items: items.sort(
        (a, b) => new Date(b.interaction_at || b.created_at || '').getTime() - new Date(a.interaction_at || a.created_at || '').getTime(),
      ),
      formattedDate: date === 'Unknown' ? 'Unknown date' : formatReadableDate(date),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return sortedGroups
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
  'note',
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

const filtersDirty = computed(() => {
  return Boolean(
    filters.salesUserId ||
    filters.type ||
    filters.startDate !== startOfRange() ||
    filters.endDate !== endOfRange(),
  )
})

const handleFilterChange = () => {
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    if (start > end) {
      filters.endDate = filters.startDate
    }
  }
  // Reload interactions when filters change
  loadInteractions()
}

const resetFilters = () => {
  filters.salesUserId = null
  filters.type = null
  filters.startDate = startOfRange()
  filters.endDate = endOfRange()
  loadInteractions()
}

const formatInteractionTitle = (interaction: LeadInteractionWithDetails) => {
  const meta = getInteractionMeta(interaction.type || 'other')
  return meta.label
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

const overviewSummary = computed(() => {
  const stats = statistics.value
  if (!stats) return []

  return [
    {
      label: 'Total interactions',
      displayValue: formatNumber(stats.total_interactions),
      icon: 'i-heroicons-sparkles',
      accent: 'bg-purple-500',
    },
    {
      label: 'Interactions · today',
      displayValue: formatNumber(stats.by_period.today),
      icon: 'i-heroicons-bolt',
      accent: 'bg-emerald-500',
    },
    {
      label: 'Unique leads',
      displayValue: formatNumber(stats.unique_leads),
      icon: 'i-heroicons-user-group',
      accent: 'bg-blue-500',
    },
    {
      label: 'With attachments',
      displayValue: formatNumber(stats.with_attachments),
      caption: `${Math.round((stats.with_attachments / stats.total_interactions) * 100) || 0}% of total`,
      icon: 'i-heroicons-paper-clip',
      accent: 'bg-amber-500',
    },
  ]
})

const formatNumber = (value: number) => {
  return new Intl.NumberFormat().format(value || 0)
}

const openLeadDetail = (leadId: number) => {
  selectedLeadId.value = leadId
  leadDetailKey.value = `lead-detail-${leadId}`
  nextTick(() => {
    refreshLeadDetail()
  })
}

const handleDetailUpdate = async () => {
  await Promise.all([refreshLeadDetail(), loadInteractions()])
}

watch(selectedLeadId, (id) => {
  leadDetailKey.value = id !== null ? `lead-detail-${id}` : 'lead-detail-null'
})

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
  
  await loadInteractions()
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

