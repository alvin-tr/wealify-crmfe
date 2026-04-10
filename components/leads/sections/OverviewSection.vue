<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900">Overview</h3>
        <div class="flex items-center gap-2">
          <UButton
            v-if="!isEditing"
            size="sm"
            color="primary"
            variant="soft"
            icon="i-heroicons-pencil-square"
            @click="startEdit"
          >
            Edit
          </UButton>
          <template v-else>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              :disabled="saving"
              @click="cancelEdit"
            >
              Cancel
            </UButton>
            <UButton
              size="sm"
              color="primary"
              :loading="saving"
              @click="saveChanges"
            >
              Save
            </UButton>
          </template>
        </div>
      </div>
    </template>

    <div v-if="!isEditing" class="space-y-4 text-sm text-gray-700">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-xs uppercase text-gray-500">Job Title</p>
          <p>{{ lead.job_title || '—' }}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-gray-500">Website</p>
          <p>
            <a v-if="lead.website" :href="ensureProtocol(lead.website)" class="text-emerald-600 underline" target="_blank">
              {{ lead.website }}
            </a>
            <span v-else>—</span>
          </p>
        </div>
        <div>
          <p class="text-xs uppercase text-gray-500">Address</p>
          <p>{{ lead.address || '—' }}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-gray-500">Qualified</p>
          <UBadge :color="lead.is_qualified ? 'primary' : 'neutral'" variant="soft">
            {{ lead.is_qualified ? 'Qualified' : 'Not qualified' }}
          </UBadge>
        </div>
        <div>
          <p class="text-xs uppercase text-gray-500">Converted</p>
          <UBadge :color="lead.is_converted ? 'primary' : 'neutral'" variant="soft">
            {{ lead.is_converted ? 'Converted' : 'Open' }}
          </UBadge>
        </div>
        <div>
          <p class="text-xs uppercase text-gray-500">Created / Updated</p>
          <p>{{ formatDate(lead.created_at) }} · {{ formatDate(lead.updated_at) }}</p>
        </div>
      </div>
      <div>
        <p class="text-xs uppercase text-gray-500">Summary</p>
        <p class="whitespace-pre-line">{{ lead.notes || 'No summary provided yet.' }}</p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700 uppercase">Job Title</label>
          <UInput
            v-model="form.job_title"
            placeholder="Enter job title"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700 uppercase">Website</label>
          <UInput
            v-model="form.website"
            placeholder="Enter website URL"
            type="url"
          />
        </div>
        <div class="sm:col-span-2 flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700 uppercase">Address</label>
          <UInput
            v-model="form.address"
            placeholder="Enter address"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700 uppercase">Qualified</label>
          <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer h-9" @click="form.is_qualified = !form.is_qualified">
            <input
              type="checkbox"
              :checked="form.is_qualified"
              @change.stop="form.is_qualified = !form.is_qualified"
              @click.stop
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
            />
            <label class="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Mark as qualified
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700 uppercase">Converted</label>
          <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer h-9" @click="form.is_converted = !form.is_converted">
            <input
              type="checkbox"
              :checked="form.is_converted"
              @change.stop="form.is_converted = !form.is_converted"
              @click.stop
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
            />
            <label class="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Mark as converted
            </label>
          </div>
        </div>
        <div class="sm:col-span-2">
          <p class="text-xs uppercase text-gray-500">Created / Updated</p>
          <p>{{ formatDate(lead.created_at) }} · {{ formatDate(lead.updated_at) }}</p>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-xs font-medium text-gray-700 uppercase">Summary</label>
        <UTextarea
          v-model="form.notes"
          placeholder="Enter summary notes"
          :rows="4"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { Lead } from '~/composables/useLeads'
import { useLeads } from '~/composables/useLeads'

const props = defineProps<{
  lead: Lead
  leadId: number
}>()

const emit = defineEmits<{ updated: [] }>()

const { updateLead } = useLeads()
const toast = useToast()

const isEditing = ref(false)
const saving = ref(false)

const form = reactive({
  job_title: '',
  website: '',
  address: '',
  is_qualified: false,
  is_converted: false,
  notes: '',
})

const resetForm = () => {
  form.job_title = props.lead.job_title || ''
  form.website = props.lead.website || ''
  form.address = props.lead.address || ''
  form.is_qualified = props.lead.is_qualified || false
  form.is_converted = props.lead.is_converted || false
  form.notes = props.lead.notes || ''
}

const startEdit = () => {
  resetForm()
  isEditing.value = true
}

const cancelEdit = () => {
  resetForm()
  isEditing.value = false
}

const saveChanges = async () => {
  saving.value = true
  try {
    await updateLead(props.leadId, {
      job_title: form.job_title || null,
      website: form.website || null,
      address: form.address || null,
      is_qualified: form.is_qualified,
      is_converted: form.is_converted,
      notes: form.notes || null,
    })
    toast.add({
      title: 'Overview updated',
      color: 'success',
    })
    isEditing.value = false
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update overview',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    saving.value = false
  }
}

// Reset form when lead changes
watch(
  () => props.lead,
  () => {
    if (!isEditing.value) {
      resetForm()
    }
  },
  { deep: true },
)

// Initialize form
resetForm()

const ensureProtocol = (url: string) => {
  if (!url) return '#'
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

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
