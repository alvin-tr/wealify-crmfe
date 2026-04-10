<template>
  <UModal
    v-model:open="isOpen"
    size="xl"
    :ui="{ content: 'max-w-4xl w-full', body: 'p-0' }"
    :title="customer ? `Log Care · ${customer.full_name}` : 'Log Care Interaction'"
    @update:open="(val) => $emit('update:open', val)"
  >
    <template #body>
      <div v-if="customer && salesUser" class="space-y-6 px-6 py-6">
        <section class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div class="flex flex-col gap-3 text-sm text-gray-600">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-gray-500 uppercase">Customer</p>
                <p class="text-base font-semibold text-gray-900">
                  {{ customer.full_name }}
                  <span class="ml-2 text-xs text-gray-500">#{{ customer.id || customer.customer_id }}</span>
                </p>
              </div>
              <UBadge
                :color="customer.tier === 'DIAMOND' ? 'primary' : customer.tier === 'GOLD' ? 'warning' : customer.tier === 'SILVER' ? 'info' : 'neutral'"
                variant="soft"
                class="px-3 py-1 text-xs"
              >
                {{ customer.tier }}
              </UBadge>
            </div>
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-gray-500 uppercase">Sales Owner</p>
                <p class="text-base font-semibold text-gray-900">
                  {{ salesUser.full_name }}
                  <span class="ml-2 text-xs text-gray-500">{{ salesUser.staff_code }}</span>
                </p>
              </div>
              <div class="text-xs text-gray-500 text-right">
                <span v-if="assignmentDate">Assigned {{ assignmentDate }}</span>
                <span v-if="assignmentNote" class="block text-gray-400">"{{ assignmentNote }}"</span>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <header class="flex flex-col gap-1 border-b border-gray-200 px-6 py-5">
            <div class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <UIcon name="i-heroicons-document-text" class="h-4 w-4" />
              Interaction Details
            </div>
            <h3 class="text-xl font-semibold text-gray-900">Log Care Interaction</h3>
            <p class="text-sm text-gray-500">Capture actionable notes so the team stays aligned with the customer's journey.</p>
          </header>

          <div class="px-6 py-6 space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700">Interaction Type</label>
                <div class="relative professional-input">
                  <USelect
                    v-model="form.type"
                    :items="interactionTypeOptions"
                    placeholder="Choose interaction type"
                    class="w-full"
                  />
                  <UIcon :name="getInteractionMeta(form.type).icon" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" :class="getInteractionMeta(form.type).iconColor" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700">Channel</label>
                <div class="relative professional-input">
                  <UInput
                    v-model="form.channel"
                    placeholder="Phone, Email, Meeting..."
                    class="w-full"
                  />
                  <UIcon name="i-heroicons-arrows-right-left" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700">Interaction Date</label>
                <div class="relative professional-input">
                  <UInput
                    v-model="form.interactionDate"
                    type="datetime-local"
                    class="w-full"
                  />
                  <UIcon name="i-heroicons-calendar-days" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                <p class="text-xs text-gray-400">Use the date & time picker or type directly (local timezone).</p>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700">Duration (minutes)</label>
                <div class="professional-input">
                  <UInput
                    v-model.number="form.durationMinutes"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Subject</label>
              <div class="professional-input">
                <UInput v-model="form.subject" placeholder="Optional subject line" class="w-full" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Interaction Details</label>
              <div class="relative professional-input">
                <UTextarea
                  v-model="form.detail"
                  min-rows="8"
                  placeholder="Summarize what happened in this interaction..."
                  class="w-full"
                />
                <UIcon name="i-heroicons-pencil-square" class="absolute right-3 top-3 h-5 w-5 text-emerald-500 pointer-events-none" />
              </div>
              <p class="text-xs text-gray-400">Give enough context so the next touchpoint feels natural and informed.</p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Attachments</label>
              <label class="professional-upload flex items-center justify-between gap-3 rounded-2xl border border-dashed border-emerald-400 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors">
                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-cloud-arrow-up" class="h-6 w-6 text-emerald-500" />
                  <div class="flex flex-col">
                    <span class="font-semibold text-emerald-700">
                      {{ form.attachments.length ? `${form.attachments.length} file(s) selected` : 'Upload supporting files (optional)' }}
                    </span>
                    <span class="text-xs text-emerald-600">Formats: images, docs, audio, video · Each ≤ 20 MB · Max 5 files</span>
                  </div>
                </div>
                <span class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Browse</span>
                <input type="file" class="hidden" multiple @change="handleAttachmentChange" />
              </label>
              <span v-if="attachmentError" class="text-xs text-red-500">{{ attachmentError }}</span>
              <div v-if="form.attachments.length" class="flex flex-wrap gap-2 pt-2">
                <div
                  v-for="(file, fileIndex) in form.attachments"
                  :key="`${file.name}-${fileIndex}`"
                  class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                >
                  <UIcon name="i-heroicons-paper-clip" class="h-4 w-4" />
                  <span class="max-w-[160px] truncate font-medium">{{ file.name }}</span>
                  <button
                    type="button"
                    class="text-emerald-600 hover:text-emerald-800"
                    @click="removeAttachment(fileIndex)"
                  >
                    <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 rounded-xl bg-gray-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" v-model="form.followUpRequired" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                Follow-up required
              </label>
              <div v-if="form.followUpRequired" class="space-y-2 md:w-1/3">
                <label class="text-sm font-semibold text-gray-700">Follow-up Date</label>
                <div class="relative professional-input">
                  <UInput v-model="form.followUpDate" type="date" class="w-full" />
                  <UIcon name="i-heroicons-calendar" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between w-full px-6 pb-6">
        <div class="text-xs text-gray-500" v-if="salesUser">
          Logging as {{ salesUser.staff_code }} · {{ salesUser.full_name }}
        </div>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="handleClose">Cancel</UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="submitting || !canSubmit"
            @click="handleSubmit"
          >
            Save Interaction
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import type { Customer } from '~/composables/useCustomers'
import type { SalesUserWithCustomers } from '~/composables/useCustomerAssignments'
import type { InteractionType } from '~/composables/useCustomerInteractions'

interface Props {
  open: boolean
  customer: Customer | null
  salesUser: SalesUserWithCustomers | null
  assignmentDate?: string | null
  assignmentNote?: string | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  assignmentDate: null,
  assignmentNote: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [payload: {
    customer_id: number
    sales_user_id: number
    type: InteractionType
    interaction_date: string
    channel: string | null
    duration_minutes: number | null
    subject: string | null
    detail: string
    follow_up_required: boolean
    follow_up_date: string | null
    uploaded_by: number
    attachments: File[]
  }]
  'close': []
}>()

const isOpen = computed({
  get: () => {
    console.log('🟢 [CareInteractionModal] isOpen getter called, props.open:', props.open)
    return props.open
  },
  set: (val) => {
    console.log('🟢 [CareInteractionModal] isOpen setter called with:', val)
    emit('update:open', val)
  },
})

onMounted(() => {
  console.log('🟢 [CareInteractionModal] Component mounted')
  console.log('🟢 [CareInteractionModal] Initial props:', {
    open: props.open,
    customer: props.customer,
    salesUser: props.salesUser,
  })
})

watch(() => props.open, (newVal) => {
  console.log('🟡 [CareInteractionModal] props.open changed to:', newVal)
})

watch(() => props.customer, (newVal) => {
  console.log('🟡 [CareInteractionModal] props.customer changed:', newVal)
})

watch(() => props.salesUser, (newVal) => {
  console.log('🟡 [CareInteractionModal] props.salesUser changed:', newVal)
})

const interactionTypeOptions = [
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Chat', value: 'chat' },
  { label: 'SMS', value: 'sms' },
  { label: 'Other', value: 'other' },
]

const interactionTypeMeta: Record<InteractionType | string, { icon: string; bg: string; iconColor: string; label: string }> = {
  call: {
    icon: 'i-heroicons-phone-arrow-up-right',
    bg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    label: 'Call Interaction',
  },
  email: {
    icon: 'i-heroicons-envelope-open',
    bg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    label: 'Email Sent',
  },
  meeting: {
    icon: 'i-heroicons-users',
    bg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Meeting',
  },
  chat: {
    icon: 'i-heroicons-chat-bubble-left-right',
    bg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Chat Message',
  },
  sms: {
    icon: 'i-heroicons-device-phone-mobile',
    bg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'SMS Interaction',
  },
  other: {
    icon: 'i-heroicons-sparkles',
    bg: 'bg-gray-200',
    iconColor: 'text-gray-600',
    label: 'Other Interaction',
  },
}

const getInteractionMeta = (type: InteractionType | string) => {
  return interactionTypeMeta[type] || interactionTypeMeta.other
}

const pad = (value: number) => String(value).padStart(2, '0')

const formatDateInput = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const form = reactive({
  type: 'call' as InteractionType,
  channel: '',
  interactionDate: formatDateInput(new Date()),
  durationMinutes: null as number | null,
  subject: '',
  detail: '',
  followUpRequired: false,
  followUpDate: null as string | null,
  attachments: [] as File[],
})

const attachmentError = ref<string | null>(null)

const canSubmit = computed(() => {
  return (
    !!props.customer &&
    !!props.salesUser &&
    !!form.type &&
    !!form.interactionDate &&
    form.detail.trim().length > 0
  )
})

watch(() => form.followUpRequired, (required) => {
  if (!required) {
    form.followUpDate = null
  }
})

watch(() => props.open, (open) => {
  if (open) {
    // Reset form when modal opens
    form.type = 'call'
    form.channel = ''
    form.interactionDate = formatDateInput(new Date())
    form.durationMinutes = null
    form.subject = ''
    form.detail = ''
    form.followUpRequired = false
    form.followUpDate = null
    form.attachments = []
    attachmentError.value = null
  }
})

const handleAttachmentChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    input.value = ''
    attachmentError.value = null
    return
  }

  const existing = form.attachments.slice()
  const incoming = Array.from(input.files)
  const combined = existing.concat(incoming)

  if (combined.length > 5) {
    attachmentError.value = 'You can upload up to 5 files only.'
    input.value = ''
    return
  }

  for (const file of incoming) {
    if (file.size > 20 * 1024 * 1024) {
      attachmentError.value = `"${file.name}" exceeds the 20MB limit.`
      input.value = ''
      return
    }
  }

  attachmentError.value = null
  form.attachments = combined
  input.value = ''
}

const removeAttachment = (index: number) => {
  form.attachments.splice(index, 1)
  if (!form.attachments.length) {
    attachmentError.value = null
  }
}

const toIsoString = (date: Date) => {
  return date.toISOString()
}

const parseDateTime = (value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return toIsoString(date)
}

const parseDateOnly = (value: string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCHours(0, 0, 0, 0)
  return toIsoString(date)
}

const handleSubmit = () => {
  if (!props.customer || !props.salesUser || !canSubmit.value) return

  const interactionDateIso = parseDateTime(form.interactionDate)
  if (!interactionDateIso) {
    return
  }

  const followUpIso = form.followUpRequired && form.followUpDate ? parseDateOnly(form.followUpDate) : null

  // Resolve customer numeric ID
  const customerNumericId = typeof props.customer.id === 'number' 
    ? props.customer.id 
    : Number(props.customer.id) || Number(props.customer.customer_id) || null

  if (!customerNumericId) {
    return
  }

  emit('submit', {
    customer_id: customerNumericId,
    sales_user_id: props.salesUser.sales_user_id,
    type: form.type,
    interaction_date: interactionDateIso,
    channel: form.channel?.trim() || null,
    duration_minutes: form.durationMinutes || null,
    subject: form.subject?.trim() || null,
    detail: form.detail?.trim() || null,
    follow_up_required: form.followUpRequired,
    follow_up_date: followUpIso,
    uploaded_by: props.salesUser.sales_user_id,
    attachments: form.attachments,
  })
}

const handleClose = () => {
  emit('close')
  emit('update:open', false)
}
</script>

<style scoped>
.professional-input {
  display: block;
  width: 100%;
}

.professional-input :deep(select),
.professional-input :deep(textarea),
.professional-input :deep(input[type='datetime-local']),
.professional-input :deep(input[type='date']),
.professional-input :deep(input[type='text']),
.professional-input :deep(input[type='number']) {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
}

.professional-input :deep(select),
.professional-input :deep(textarea),
.professional-input :deep(input) {
  border-radius: 0.75rem;
  border: 1px solid #d1d5db;
  padding-right: 2.75rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.professional-input :deep(textarea) {
  padding-right: 3rem;
}

.professional-input :deep(select) {
  padding-right: 3rem;
  background-image: none;
}

.professional-input :deep(input:focus),
.professional-input :deep(select:focus),
.professional-input :deep(textarea:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.professional-input :deep(select)::-ms-expand {
  display: none;
}

.professional-upload {
  border-width: 1.5px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.professional-upload:hover {
  border-color: rgba(16, 185, 129, 0.8);
  transform: translateY(-1px);
}
</style>

