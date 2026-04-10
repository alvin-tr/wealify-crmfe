<template>
  <div>
    <div v-if="error" class="p-6 text-center text-red-600">
      <p>{{ error?.message || 'Failed to load leads' }}</p>
      <p v-if="error?.stack" class="mt-2 text-xs text-red-400">{{ error.stack }}</p>
    </div>

    <div v-else-if="loading" class="flex items-center justify-center py-12 text-gray-500">
      <div class="flex items-center gap-3">
        <div class="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600"></div>
        <span>Loading leads...</span>
      </div>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-if="showSelection" class="px-4 py-3 text-left">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change.stop="emit('toggle-select-all')"
                class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Lead</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Company</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Owner</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Status</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Stage</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Source</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Updated</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600 dark:text-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="lead in leads"
            :key="lead.id"
            :class="[
              'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition cursor-pointer',
              lead.id === selectedId ? 'bg-emerald-50/60 dark:bg-emerald-900/40 dark:bg-emerald-900/30' : 'bg-white dark:bg-gray-900 dark:bg-gray-900/50',
            ]"
            @click="select(lead.id)"
          >
            <td v-if="showSelection" class="px-4 py-4" @click.stop>
              <input
                type="checkbox"
                :checked="isSelected(lead.id)"
                @change.stop="emit('toggle-select', lead.id as number)"
                class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
            </td>
            <td class="px-4 py-4">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ lead.full_name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-200">{{ lead.email || '—' }}</p>
              </div>
            </td>
            <td class="px-4 py-4 text-sm text-gray-700 dark:text-white">
              <div class="space-y-1">
                <p>{{ lead.company_name || '—' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-200">{{ lead.phone || 'No phone' }}</p>
              </div>
            </td>
            <td class="px-4 py-4 text-sm text-gray-700 dark:text-white">{{ lead.owner_name || 'Unassigned' }}</td>
            <td class="px-4 py-4 text-sm">
              <UBadge :color="lead.status_name ? 'primary' : 'neutral'" variant="soft">
                {{ lead.status_name || '—' }}
              </UBadge>
            </td>
            <td class="px-4 py-4 text-sm text-gray-700 dark:text-white">{{ lead.stage_name || '—' }}</td>
            <td class="px-4 py-4 text-sm text-gray-700 dark:text-white">{{ lead.source_name || '—' }}</td>
            <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-200">
              {{ formatDate(lead.updated_at || lead.created_at) }}
            </td>
            <td class="px-4 py-4 text-right">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-eye"
                @click.stop="select(lead.id)"
              />
            </td>
          </tr>

          <tr v-if="!leads.length">
            <td colspan="8" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-200">
              No leads match the current filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Lead } from '~/composables/useLeads'

const props = defineProps<{
  leads: Lead[]
  loading?: boolean
  error?: any
  modelValue?: number | null
  selectedId?: number | null
  showSelection?: boolean
  selectedIds?: number[]
  allSelected?: boolean
  someSelected?: boolean
}>()

const emit = defineEmits<{
  'update:selectedId': [number | null]
  'toggle-select': [number]
  'toggle-select-all': []
}>()

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const select = (id: number | undefined) => {
  if (typeof id === 'undefined') return
  emit('update:selectedId', id)
}

const isSelected = (id?: number) => {
  if (typeof id === 'undefined') return false
  const list = props.selectedIds || []
  return list.includes(id)
}
</script>
