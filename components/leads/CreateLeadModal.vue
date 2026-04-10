<template>
  <UModal
    v-model:open="modalOpen"
    :dismissible="!submitting"
    title="Create lead"
    size="xl"
    :ui="{ content: 'max-w-4xl w-full', body: 'p-0' }"
  >
    <template #body>
      <form class="px-6 py-6" @submit.prevent="submit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">
              Full name <span class="text-red-500">*</span>
            </label>
            <UInput 
              v-model="form.full_name" 
              placeholder="Enter full name" 
              icon="i-heroicons-user"
              required 
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Company</label>
            <UInput 
              v-model="form.company_name" 
              placeholder="Enter company name" 
              icon="i-heroicons-building-office"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Email</label>
            <UInput 
              v-model="form.email" 
              type="email" 
              placeholder="Enter email address" 
              icon="i-heroicons-envelope"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Phone</label>
            <UInput 
              v-model="form.phone" 
              placeholder="Enter phone number" 
              icon="i-heroicons-phone"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Status</label>
            <USelect 
              v-model="form.status_id" 
              :items="statusOptions" 
              placeholder="Select status"
              icon="i-heroicons-flag"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Stage</label>
            <USelect 
              v-model="form.stage_id" 
              :items="stageOptions" 
              placeholder="Select stage"
              icon="i-heroicons-chart-bar"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Source</label>
            <USelect 
              v-model="form.source_id" 
              :items="sourceOptions" 
              placeholder="Select source"
              icon="i-heroicons-magnifying-glass"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Lead score</label>
            <UInput 
              v-model="form.lead_score" 
              type="number" 
              placeholder="Enter lead score" 
              icon="i-heroicons-star"
            />
          </div>
        </div>
        
        <div class="mt-5 flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">Internal notes</label>
          <UTextarea 
            v-model="form.notes" 
            min-rows="3" 
            placeholder="Enter internal notes" 
            icon="i-heroicons-pencil-square"
            class="w-full"
          />
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex items-center justify-end gap-2 px-6 pb-6">
        <UButton variant="ghost" color="neutral" :disabled="submitting" @click="emit('update:open', false)">
          Cancel
        </UButton>
        <UButton color="primary" :loading="submitting" @click="submit">
          Create
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import { useLeads } from '~/composables/useLeads'
import type { LeadReferenceItem } from '~/composables/useLeads'

const props = defineProps<{
  open: boolean
  reference: { statuses: LeadReferenceItem[]; stages: LeadReferenceItem[]; sources: LeadReferenceItem[] } | null
}>()

const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()

const { createLead } = useLeads()
const toast = useToast()

const form = reactive({
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
  notes: '',
  lead_score: null as number | null,
  status_id: undefined as number | undefined,
  stage_id: undefined as number | undefined,
  source_id: undefined as number | undefined,
})

const statusOptions = computed(() => (props.reference?.statuses || []).map((item) => ({ label: item.name, value: item.id })))
const stageOptions = computed(() => (props.reference?.stages || []).map((item) => ({ label: item.name, value: item.id })))
const sourceOptions = computed(() => (props.reference?.sources || []).map((item) => ({ label: item.name, value: item.id })))

const submitting = ref(false)
const modalOpen = ref(props.open)

const resetForm = () => {
  form.full_name = ''
  form.company_name = ''
  form.email = ''
  form.phone = ''
  form.notes = ''
  form.lead_score = null
  form.status_id = undefined
  form.stage_id = undefined
  form.source_id = undefined
}

watch(
  () => props.open,
  (value) => {
    modalOpen.value = value
    if (!value) {
      resetForm()
    }
  },
)

watch(modalOpen, (value) => {
  emit('update:open', value)
  if (!value) {
    resetForm()
  }
})

const submit = async () => {
  if (!form.full_name.trim()) {
    toast.add({ title: 'Lead name required', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    await createLead({
      full_name: form.full_name.trim(),
      company_name: form.company_name || null,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
      lead_score: form.lead_score ?? undefined,
      status_id: form.status_id ?? undefined,
      stage_id: form.stage_id ?? undefined,
      source_id: form.source_id ?? undefined,
    })
    emit('saved')
    resetForm()
  } catch (error: any) {
    toast.add({
      title: 'Failed to create lead',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}
</script>

