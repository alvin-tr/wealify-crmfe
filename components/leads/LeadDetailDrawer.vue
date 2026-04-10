<template>
  <USlideover
    id="lead-detail-drawer"
    v-model:open="drawerOpen"
    :dismissible="!isViewerActive"
    @close:prevent="handleDrawerClosePrevented"
    @update:open="onDrawerUpdate"
    side="right"
    size="xl"
    :ui="{ content: 'max-w-6xl w-full' }"
  >
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="text-xs uppercase text-gray-500">Lead</p>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ lead?.full_name || '—' }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ lead?.company_name || 'No company specified' }}
          </p>
        </div>
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-heroicons-x-mark"
          @click="emit('close')"
        />
      </div>
    </template>

    <template #body>
      <div class="relative min-h-[400px]">
        <!-- Loading Overlay - chỉ hiển thị khi đang update, không ảnh hưởng đến initial loading -->
        <Transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="updatingStatus || updatingStage || updatingSource"
            class="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              <p class="text-sm font-medium text-gray-700">
                {{ updatingStatus ? 'Updating status...' : updatingStage ? 'Updating stage...' : 'Updating source...' }}
              </p>
            </div>
          </div>
        </Transition>

        <!-- Content - luôn hiển thị -->
        <div v-if="pending && !lead" class="flex items-center justify-center py-20 text-gray-500">
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600"></div>
            <span>Loading lead details...</span>
          </div>
        </div>

        <div v-else-if="!lead" class="py-12 text-center text-sm text-gray-500">
          Select a lead to view details.
        </div>

        <div v-else class="space-y-6">
          <UCard>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p class="text-xs text-gray-500 uppercase">Email</p>
              <p>{{ lead.email || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase">Phone</p>
              <p>{{ lead.phone || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase">Owner</p>
              <p>{{ lead.owner_name || 'Unassigned' }}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs text-gray-500 uppercase mb-2">Status</p>
              <div class="flex items-center gap-2">
                <USelect
                  v-model="localStatusId"
                  :items="statusOptions"
                  placeholder="Select status"
                  icon="i-heroicons-flag"
                  :disabled="updatingStatus || updatingStage || updatingSource"
                  class="w-full max-w-md"
                  @update:model-value="updateStatus"
                />
              </div>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs text-gray-500 uppercase mb-2">Stage</p>
              <div class="flex items-center gap-2">
                <USelect
                  v-model="localStageId"
                  :items="stageOptions"
                  placeholder="Select stage"
                  icon="i-heroicons-chart-bar"
                  :disabled="updatingStage || updatingStatus"
                  class="w-full max-w-md"
                  @update:model-value="updateStage"
                />
              </div>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs text-gray-500 uppercase mb-2">Source</p>
              <USelect
                v-model="localSourceId"
                :items="sourceOptions"
                placeholder="Select source"
                icon="i-heroicons-magnifying-glass"
                :disabled="updatingSource || updatingStatus || updatingStage"
                class="w-full max-w-md"
                @update:model-value="updateSource"
              />
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase">Lead score</p>
              <p>{{ lead.lead_score ?? '—' }}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs text-gray-500 uppercase">Notes</p>
              <p>{{ lead.notes || 'No notes yet.' }}</p>
            </div>
          </div>
        </UCard>

        <UTabs v-model="activeTab" :items="tabs" class="w-full" />

        <div v-if="activeTab === 'contacts'">
          <ContactsSection
            v-if="leadId !== null"
            :lead-id="leadId"
            :items="contacts"
            @updated="emitUpdated"
          />
        </div>

        <div v-else-if="activeTab === 'tasks'">
          <TasksSection
            v-if="leadId !== null"
            :lead-id="leadId"
            :items="tasks"
            :interactions="interactions"
            :current-stage-id="lead?.stage_id ?? null"
            @updated="emitUpdated"
          />
        </div>

        <div v-else>
          <OverviewSection
            v-if="leadId !== null"
            :lead="lead"
            :lead-id="leadId"
            @updated="emitUpdated"
          />
        </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Lead, LeadContact, LeadInteraction, LeadTask, LeadReferenceItem } from '~/composables/useLeads'
import { useLeads } from '~/composables/useLeads'
import { useImageViewer } from '~/composables/useImageViewer'
import ContactsSection from './sections/ContactsSection.vue'
import TasksSection from './sections/TasksSection.vue'
import OverviewSection from './sections/OverviewSection.vue'

const props = defineProps<{
  open: boolean
  leadId: number | null
  detail: {
    lead: Lead
    contacts: LeadContact[]
    assignments: any[]
    interactions: LeadInteraction[]
    tasks: LeadTask[]
  } | null
  pending: boolean
  reference: {
    statuses: LeadReferenceItem[]
    stages: LeadReferenceItem[]
    sources: LeadReferenceItem[]
  } | null
}>()

const emit = defineEmits<{ close: []; updated: []; 'update:open': [boolean] }>()

const drawerOpen = ref(props.open)
const { isViewerActive } = useImageViewer()

watch(
  () => props.open,
  (value) => {
    drawerOpen.value = value
  },
)

watch(drawerOpen, (value) => {
  // Block closing the drawer if the image viewer is currently active
  if (!value && isViewerActive?.value) {
    drawerOpen.value = true
    return
  }
  emit('update:open', value)
  if (!value) emit('close')
})

const onDrawerUpdate = (value: boolean) => {
  // Prevent close from overlay click or ESC while viewer is active
  if (!value && isViewerActive?.value) {
    // Ignore the close request
    return
  }
  drawerOpen.value = value
}

const handleDrawerClosePrevented = () => {
  // No-op: keep drawer open while viewer is active
}

const { updateLead } = useLeads()
const toast = useToast()

const lead = computed(() => props.detail?.lead || null)
const contacts = computed(() => props.detail?.contacts || [])
const interactions = computed(() => props.detail?.interactions || [])
const tasks = computed(() => props.detail?.tasks || [])

const localStatusId = ref<number | undefined>(undefined)
const localStageId = ref<number | undefined>(undefined)
const localSourceId = ref<number | undefined>(undefined)
const updatingStatus = ref(false)
const updatingStage = ref(false)
const updatingSource = ref(false)

watch(
  () => lead.value?.status_id,
  (value) => {
    localStatusId.value = value ?? undefined
  },
  { immediate: true },
)

watch(
  () => lead.value?.stage_id,
  (value) => {
    localStageId.value = value ?? undefined
  },
  { immediate: true },
)

watch(
  () => lead.value?.source_id,
  (value) => {
    localSourceId.value = value ?? undefined
  },
  { immediate: true },
)

const statusOptions = computed(() =>
  (props.reference?.statuses || []).map((item) => ({ label: item.name, value: item.id })),
)

const stageOptions = computed(() =>
  (props.reference?.stages || []).map((item) => ({ label: item.name, value: item.id })),
)

const sourceOptions = computed(() =>
  (props.reference?.sources || []).map((item) => ({ label: item.name, value: item.id })),
)

const updateStatus = async (newStatusId: number | undefined) => {
  if (!props.leadId || updatingStatus.value) return
  
  if (newStatusId === lead.value?.status_id) return

  updatingStatus.value = true
  try {
    await updateLead(props.leadId, { status_id: newStatusId })
    toast.add({
      title: 'Status updated',
      color: 'success',
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update status',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
    // Revert local value on error
    localStatusId.value = lead.value?.status_id ?? undefined
  } finally {
    updatingStatus.value = false
  }
}

const updateStage = async (newStageId: number | undefined) => {
  if (!props.leadId || updatingStage.value) return
  
  if (newStageId === lead.value?.stage_id) return

  updatingStage.value = true
  try {
    const result: any = await updateLead(props.leadId, { stage_id: newStageId })
    const tasksCreated = result?.data?.tasks_created ?? 0
    toast.add({
      title: 'Stage updated',
      description: tasksCreated > 0 
        ? `${tasksCreated} task(s) created automatically for this stage`
        : 'Stage has been updated successfully',
      color: 'success',
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update stage',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
    // Revert local value on error
    localStageId.value = lead.value?.stage_id ?? undefined
  } finally {
    updatingStage.value = false
  }
}

const updateSource = async (newSourceId: number | undefined) => {
  if (!props.leadId || updatingSource.value) return
  
  if (newSourceId === lead.value?.source_id) return

  updatingSource.value = true
  try {
    await updateLead(props.leadId, { source_id: newSourceId })
    toast.add({
      title: 'Source updated',
      color: 'success',
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update source',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
    // Revert local value on error
    localSourceId.value = lead.value?.source_id ?? undefined
  } finally {
    updatingSource.value = false
  }
}

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Contacts', value: 'contacts' },
  { label: 'Tasks', value: 'tasks' },
]

const activeTab = ref('overview')

watch(
  () => props.leadId,
  (id) => {
    if (id !== null && id !== undefined) {
      activeTab.value = 'overview'
    }
  },
)

const emitUpdated = () => emit('updated')
</script>
