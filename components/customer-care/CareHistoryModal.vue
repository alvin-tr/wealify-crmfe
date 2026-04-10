<template>
  <UModal
    v-model:open="isOpen"
    size="lg"
    :ui="{ content: 'max-w-3xl w-full' }"
    :title="customer ? `Care History · ${customer.full_name}` : 'Care History'"
    :dismissible="!isViewerActive"
    @update:open="(val) => $emit('update:open', val)"
    @close:prevent="handleClosePrevented"
  >
    <template #body>
      <div class="p-6 space-y-4">
        <div
          v-if="customer"
          class="rounded-lg border border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-600"
        >
          <p class="text-base font-semibold text-gray-900">{{ customer.full_name }}</p>
          <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
            <span class="font-mono">ID: {{ customer.id || customer.customer_id }}</span>
            <span>{{ customer.email }}</span>
            <span>{{ customer.phone_number || '—' }}</span>
          </div>
        </div>

        <div v-if="pending" class="py-10 flex items-center justify-center text-gray-500">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span>Loading interactions...</span>
          </div>
        </div>
        <div v-else-if="error" class="text-sm text-red-600">
          {{ error }}
        </div>
        <div v-else-if="interactions.length === 0" class="py-10 text-sm text-gray-500 text-center">
          No care interactions recorded yet.
        </div>
        <div v-else class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          <div
            v-for="(interaction, index) in interactions"
            :key="interaction.id"
            class="flex gap-4"
          >
            <div class="flex flex-col items-center relative">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
                :class="getInteractionMeta(interaction.type).bg"
              >
                <UIcon
                  :name="getInteractionMeta(interaction.type).icon"
                  class="h-5 w-5"
                  :class="getInteractionMeta(interaction.type).iconColor"
                />
              </div>
              <div
                v-if="index !== interactions.length - 1"
                class="flex-1 w-px bg-gray-200 mt-2"
              ></div>
            </div>

            <div class="flex-1 rounded-lg border border-gray-200 p-4 space-y-3 hover:border-emerald-200 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-gray-900 capitalize">
                    {{ getInteractionMeta(interaction.type).label }}
                  </p>
                  <div class="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    <span v-if="interaction.channel">Channel: {{ interaction.channel }}</span>
                    <span v-if="interaction.duration_minutes">Duration: {{ interaction.duration_minutes }} mins</span>
                    <span v-if="interaction.subject" class="font-medium text-gray-700">Subject: {{ interaction.subject }}</span>
                  </div>
                </div>
                <span class="text-xs text-gray-500 whitespace-nowrap mt-1">{{ formatDate(interaction.interaction_date) }}</span>
              </div>

              <p v-if="interaction.detail" class="text-sm text-gray-700 whitespace-pre-line">
                {{ interaction.detail }}
              </p>

              <div
                v-if="interaction.follow_up_required && interaction.follow_up_date"
                class="flex items-center gap-2 text-xs text-amber-600 font-medium"
              >
                <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                Follow-up on {{ formatDate(interaction.follow_up_date) }}
              </div>

              <div
                v-if="interaction.attachments?.length"
                class="flex flex-wrap gap-3 pt-2 border-t border-gray-100"
              >
                <div
                  v-for="attachment in interaction.attachments"
                  :key="attachment.id"
                  class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600"
                >
                  <template v-if="isImageAttachment(attachment)">
                    <button
                      type="button"
                      class="flex items-center gap-2 text-left hover:text-emerald-600 transition-colors"
                      @click="handleOpenViewer(interaction, attachment)"
                      :aria-label="`Preview ${attachment.file_name || 'image attachment'}`"
                    >
                      <div class="h-12 w-16 overflow-hidden rounded-md border border-gray-200">
                        <img
                          :src="attachment.file_url"
                          :alt="attachment.file_name || 'Attachment preview'"
                          class="h-full w-full object-cover"
                        />
                      </div>
                      <div class="flex flex-col">
                        <span class="font-semibold text-gray-700 truncate max-w-[180px]">
                          {{ attachment.file_name || 'Image attachment' }}
                        </span>
                        <span class="text-[10px] uppercase tracking-wide text-gray-400">
                          {{ attachment.file_type || 'image' }}
                        </span>
                      </div>
                    </button>
                  </template>
                  <template v-else>
                    <a
                      :href="attachment.file_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 hover:text-emerald-600 transition-colors"
                    >
                      <div class="flex h-12 w-16 items-center justify-center rounded-md bg-gray-200">
                        <UIcon :name="getAttachmentIcon(attachment.file_type)" class="h-5 w-5 text-gray-600" />
                      </div>
                      <div class="flex flex-col">
                        <span class="font-semibold text-gray-700 truncate max-w-[180px]">
                          {{ attachment.file_name || 'Attachment' }}
                        </span>
                        <span class="text-[10px] uppercase tracking-wide text-gray-400">
                          {{ attachment.file_type || 'file' }}
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
    </template>

    <template #footer>
      <div class="flex items-center justify-end w-full">
        <UButton variant="ghost" color="neutral" @click="handleClose" :disabled="isViewerActive">Close</UButton>
      </div>
    </template>
  </UModal>

  <div ref="attachmentGalleryRef" class="hidden">
    <img
      v-for="image in galleryImages"
      :key="image.src"
      :src="image.src"
      :alt="image.alt"
    />
  </div>
</template>

<script setup lang="ts">
import type { Customer } from '~/composables/useCustomers'
import type { CustomerInteraction, InteractionType } from '~/composables/useCustomerInteractions'
import { useImageViewer } from '~/composables/useImageViewer'

interface Props {
  open: boolean
  customer: Customer | null
  interactions: CustomerInteraction[]
  pending?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  pending: false,
  error: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})

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

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const {
  galleryImages,
  attachmentGalleryRef,
  isViewerActive,
  isImageAttachment,
  getAttachmentIcon,
  openViewer,
} = useImageViewer()

const handleOpenViewer = async (
  interaction: CustomerInteraction,
  attachment: CustomerInteraction['attachments'][number],
) => {
  const images = (interaction.attachments || []) as Array<CustomerInteraction['attachments'][number] & { id?: number }>
  await openViewer(images, attachment, attachmentGalleryRef.value)
}

const handleClosePrevented = () => {
  // No-op: keep modal open while viewer is active
}

const handleClose = () => {
  if (isViewerActive.value) {
    handleClosePrevented()
    return
  }
  emit('close')
  emit('update:open', false)
}
</script>











