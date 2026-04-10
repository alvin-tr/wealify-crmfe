<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Log Interaction</h3>
          <UButton
            size="sm"
            color="primary"
            icon="i-heroicons-plus"
            :loading="submitting"
            @click="createInteraction"
          >
            Save
          </UButton>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <USelect
          v-model="form.type"
          :items="interactionTypes"
          placeholder="Interaction type"
        />
        <UInput
          v-model="form.summary"
          placeholder="Summary"
        />
        <UInput
          v-model="form.interaction_at"
          type="datetime-local"
          placeholder="Interaction time"
        />
        <UInput
          v-model="form.notes"
          placeholder="Detailed notes"
        />
      </div>
      <div class="mt-4 space-y-3">
        <h4 class="text-xs uppercase text-gray-500">Attachments (optional)</h4>
        <div v-for="(attachment, index) in form.attachments" :key="index" class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <UInput v-model="attachment.file_name" placeholder="Display name" />
          <UInput v-model="attachment.file_url" placeholder="https://…" />
          <div class="flex items-center gap-2">
            <UInput v-model="attachment.file_type" placeholder="Type (image, pdf…)" />
            <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="removeAttachment(index)" />
          </div>
        </div>
        <UButton size="xs" icon="i-heroicons-paper-clip" variant="ghost" @click="addAttachment">
          Add attachment
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-sm font-semibold text-gray-900">Interaction History</h3>
      </template>

      <div v-if="!items.length" class="py-10 text-center text-sm text-gray-500">
        No interactions have been logged yet.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="interaction in sortedInteractions"
          :key="interaction.id"
          class="rounded-lg border border-gray-200 p-4 text-sm text-gray-700"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-gray-900 capitalize">{{ interaction.type || 'interaction' }}</p>
              <p class="text-xs text-gray-500">
                {{ formatDate(interaction.interaction_at || interaction.created_at) }} · Owner #{{ interaction.sales_user_id }}
              </p>
            </div>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="removeInteraction(interaction.id!)"
            />
          </div>

          <div class="mt-2 space-y-2">
            <p v-if="interaction.summary" class="font-medium text-gray-800">{{ interaction.summary }}</p>
            <p class="text-sm text-gray-600 whitespace-pre-line">{{ interaction.notes || 'No notes added.' }}</p>
          </div>

          <div v-if="interaction.attachments?.length" class="mt-3 flex flex-wrap gap-2">
            <a
              v-for="attachment in interaction.attachments"
              :key="attachment.id"
              :href="attachment.file_url || '#'"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 hover:border-emerald-400"
            >
              <UIcon name="i-heroicons-paper-clip" class="h-4 w-4" />
              <span class="truncate max-w-[160px]">{{ attachment.file_name || attachment.file_url }}</span>
            </a>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useLeads, type LeadInteraction, type LeadInteractionAttachment, type LeadAssignment } from '~/composables/useLeads'

const props = defineProps<{
  leadId: number
  items: LeadInteraction[]
  assignments?: LeadAssignment[]
}>()

const emit = defineEmits<{ updated: [] }>()

const { createLeadInteraction, deleteLeadInteraction, fetchLeadDetail } = useLeads()
const toast = useToast()
const auth = useAuth()

// Fetch assignments if not provided
const assignments = ref<LeadAssignment[]>(props.assignments || [])
if (!props.assignments || props.assignments.length === 0) {
  fetchLeadDetail(props.leadId).then((detail) => {
    assignments.value = detail.assignments || []
  }).catch((error) => {
    console.error('[InteractionsSection] Failed to fetch lead detail:', error)
  })
}

// Get active assignment sales_user_id
const activeAssignmentSalesUserId = computed(() => {
  // Try to get from assignments (either from props or fetched)
  const assignmentsList = assignments.value.length > 0 ? assignments.value : (props.assignments || [])
  if (assignmentsList.length > 0) {
    const activeAssignment = assignmentsList.find(
      (assignment) => assignment.status === 'active' && !assignment.unassigned_at
    )
    if (activeAssignment) {
      return activeAssignment.sales_user_id
    }
  }
  return null
})

const interactionTypes = [
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Note', value: 'note' },
  { label: 'Other', value: 'other' },
]

const form = reactive({
  type: 'call',
  summary: '',
  notes: '',
  interaction_at: new Date().toISOString().slice(0, 16),
  attachments: [] as Array<Omit<LeadInteractionAttachment, 'lead_interaction_id'>>,
})

const submitting = ref(false)

const addAttachment = () => {
  form.attachments.push({
    file_name: '',
    file_url: '',
    file_type: '',
  })
}

const removeAttachment = (index: number) => {
  form.attachments.splice(index, 1)
}

const resetForm = () => {
  form.type = 'call'
  form.summary = ''
  form.notes = ''
  form.interaction_at = new Date().toISOString().slice(0, 16)
  form.attachments = []
}

const createInteraction = async () => {
  submitting.value = true
  try {
    // Get sales_user_id from active assignment, fallback to auth user id
    const salesUserId = activeAssignmentSalesUserId.value ?? auth.user.value?.id ?? 0
    
    if (!salesUserId || salesUserId === 0) {
      toast.add({
        title: 'Cannot create interaction',
        description: 'Lead must be assigned to a sales user before logging interactions.',
        color: 'error',
      })
      return
    }

    await createLeadInteraction(props.leadId, {
      sales_user_id: salesUserId,
      type: form.type as LeadInteraction['type'],
      summary: form.summary || null,
      notes: form.notes || null,
      interaction_at: form.interaction_at ? new Date(form.interaction_at).toISOString() : undefined,
      attachments: form.attachments
        .filter((attachment) => attachment.file_url)
        .map((attachment) => ({
          file_name: attachment.file_name || null,
          file_url: attachment.file_url,
          file_type: attachment.file_type || null,
        })),
    })
    resetForm()
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to create interaction',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const removeInteraction = async (interactionId: number) => {
  try {
    await deleteLeadInteraction(props.leadId, interactionId)
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete interaction',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

const sortedInteractions = computed(() => {
  return [...props.items].sort((a, b) => {
    const dateA = new Date(a.interaction_at || a.created_at || '').getTime()
    const dateB = new Date(b.interaction_at || b.created_at || '').getTime()
    return dateB - dateA
  })
})

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
</script>
