<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Add Contact</h3>
          <UButton
            size="sm"
            color="primary"
            icon="i-heroicons-plus"
            :loading="submitting"
            @click="createContact"
          >
            Add
          </UButton>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700">Platform</label>
          <USelect
            v-model="form.platform"
            :items="platformOptions"
            placeholder="Select platform"
          >
            <template #label>
              <span v-if="form.platform" class="flex items-center gap-2">
                <img
                  :src="getPlatformIcon(form.platform)"
                  :alt="form.platform"
                  class="w-5 h-5"
                />
                <span>{{ getPlatformLabel(form.platform) }}</span>
              </span>
              <span v-else>Select platform</span>
            </template>
            <template #option="{ option }">
              <span class="flex items-center gap-2">
                <img
                  :src="getPlatformIcon(option.value)"
                  :alt="option.value"
                  class="w-5 h-5"
                />
                <span>{{ option.label }}</span>
              </span>
            </template>
          </USelect>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700">Handle / Username</label>
          <UInput
            v-model="form.handle"
            placeholder="Enter handle or username"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-700">Note (optional)</label>
          <UInput
            v-model="form.note"
            placeholder="Enter note"
          />
        </div>
        <div class="flex items-end">
          <div class="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-400 transition-all cursor-pointer h-9 min-w-[200px]" @click="form.is_primary = !form.is_primary">
            <input
              type="checkbox"
              :checked="form.is_primary"
              @change.stop="form.is_primary = !form.is_primary"
              @click.stop
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
            />
            <label class="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Set as primary contact
            </label>
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-sm font-semibold text-gray-900">Contacts</h3>
      </template>
      <div v-if="!items.length" class="py-10 text-center text-sm text-gray-500">
        No additional contact channels recorded yet.
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="contact in items"
          :key="contact.id"
          class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <img
                :src="getPlatformIcon(contact.platform)"
                :alt="contact.platform"
                class="w-6 h-6"
              />
            </div>
            <div class="space-y-1 text-sm text-gray-700">
              <p class="font-semibold text-gray-900">{{ contact.platform.toUpperCase() }}</p>
              <p>{{ contact.handle }}</p>
              <p class="text-xs text-gray-500">{{ contact.note || 'No note' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :color="contact.is_primary ? 'primary' : 'neutral'" variant="soft">
              {{ contact.is_primary ? 'Primary' : 'Secondary' }}
            </UBadge>
            <UToggle
              :model-value="!!contact.verified"
              disabled
              label="Verified"
            />
            <UButton
              size="xs"
              color="primary"
              variant="ghost"
              @click="setPrimary(contact)"
              :disabled="contact.is_primary"
            >
              Set primary
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="removeContact(contact)"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useLeads, type LeadContact } from '~/composables/useLeads'

// Import social icons
import telegramIcon from '~/assets/social-icons/telegram.svg'
import whatsappIcon from '~/assets/social-icons/whatsapp.svg'
import zaloIcon from '~/assets/social-icons/zalo.svg'
import discordIcon from '~/assets/social-icons/discord.svg'
import facebookIcon from '~/assets/social-icons/facebook.svg'
import linkedinIcon from '~/assets/social-icons/linkedin.svg'
import lineIcon from '~/assets/social-icons/line.svg'
import viberIcon from '~/assets/social-icons/viber.svg'
import defaultIcon from '~/assets/social-icons/default.svg'

const props = defineProps<{
  leadId: number
  items: LeadContact[]
}>()

const emit = defineEmits<{ updated: [] }>()

const { createLeadContact, updateLeadContact, deleteLeadContact } = useLeads()
const toast = useToast()

const submitting = ref(false)
const form = reactive({
  platform: 'telegram' as LeadContact['platform'],
  handle: '',
  is_primary: false,
  note: '',
})

const platforms = [
  'telegram',
  'whatsapp',
  'zalo',
  'discord',
  'facebook',
  'linkedin',
  'wechat',
  'line',
  'signal',
  'viber',
] as const

const platformOptions = platforms.map((value) => ({ label: value.toUpperCase(), value }))

const getPlatformLabel = (platform: LeadContact['platform']): string => {
  return platform.toUpperCase()
}

const getPlatformIcon = (platform: LeadContact['platform']): string => {
  const iconMap: Record<string, string> = {
    telegram: telegramIcon,
    whatsapp: whatsappIcon,
    zalo: zaloIcon,
    discord: discordIcon,
    facebook: facebookIcon,
    linkedin: linkedinIcon,
    wechat: defaultIcon,
    line: lineIcon,
    signal: defaultIcon,
    viber: viberIcon,
  }
  return iconMap[platform] || defaultIcon
}

const resetForm = () => {
  form.platform = 'telegram'
  form.handle = ''
  form.note = ''
  form.is_primary = false
}

const createContact = async () => {
  if (!form.handle.trim()) return
  submitting.value = true
  try {
    await createLeadContact(props.leadId, {
      platform: form.platform,
      handle: form.handle.trim(),
      is_primary: form.is_primary,
      note: form.note?.trim() || null,
    })
    resetForm()
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to add contact',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const setPrimary = async (contact: LeadContact) => {
  if (!contact.id) return
  try {
    await updateLeadContact(props.leadId, contact.id, { is_primary: true })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update contact',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

const removeContact = async (contact: LeadContact) => {
  if (!contact.id) return
  try {
    await deleteLeadContact(props.leadId, contact.id)
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete contact',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}
</script>
