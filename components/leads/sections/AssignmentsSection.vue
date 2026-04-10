<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Assign Sales Owner</h3>
          <UButton
            size="sm"
            color="primary"
            icon="i-heroicons-plus"
            :loading="submitting"
            @click="createAssignment"
          >
            Assign
          </UButton>
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <USelect
          v-model="assignmentForm.sales_user_id"
          :items="salesUserOptions"
          placeholder="Select sales user"
          :loading="salesPending"
        />
        <UInput
          v-model="assignmentForm.note"
          placeholder="Optional note"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-sm font-semibold text-gray-900">Assignment History</h3>
      </template>

      <div v-if="!items.length" class="py-10 text-center text-sm text-gray-500">
        No assignment records yet.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="assignment in items"
          :key="assignment.id"
          class="flex flex-col rounded-lg border border-gray-200 p-4 text-sm text-gray-700"
        >
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <p class="font-semibold text-gray-900">{{ assignment.sales_user_name || `Sales #${assignment.sales_user_id}` }}</p>
              <p class="text-xs text-gray-500">Assigned {{ formatDate(assignment.assigned_at) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :color="assignment.status === 'active' ? 'primary' : 'neutral'" variant="soft">
                {{ assignment.status?.toUpperCase() || 'ACTIVE' }}
              </UBadge>
              <UButton
                v-if="assignment.status === 'active' && assignment.id"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="closeAssignment(assignment.id)"
                :loading="closingId === assignment.id"
              >
                End
              </UButton>
            </div>
          </div>
          <p v-if="assignment.note" class="mt-2 text-xs text-gray-500">{{ assignment.note }}</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useLeads, type LeadAssignment } from '~/composables/useLeads'
import { useSalesUsers } from '~/composables/useSalesUsers'

const props = defineProps<{
  leadId: number
  items: LeadAssignment[]
}>()

const emit = defineEmits<{ updated: [] }>()

const { createLeadAssignment, updateLeadAssignment } = useLeads()
const { fetchSalesUsers } = useSalesUsers()
const toast = useToast()

const {
  data: salesUsers,
  pending: salesPending,
} = await useAsyncData('lead-assignment-users', fetchSalesUsers)

const salesUserOptions = computed(() => {
  return (salesUsers.value || []).map((user) => ({
    label: `${user.full_name} (${user.staff_code})`,
    value: user.id ?? user.sales_user_id,
  }))
})

const assignmentForm = reactive({
  sales_user_id: null as number | null,
  note: '',
})

const submitting = ref(false)
const closingId = ref<number | null>(null)

const createAssignment = async () => {
  if (!assignmentForm.sales_user_id) return
  submitting.value = true
  try {
    await createLeadAssignment(props.leadId, {
      sales_user_id: assignmentForm.sales_user_id,
      note: assignmentForm.note || null,
      status: 'active',
    })
    assignmentForm.sales_user_id = null
    assignmentForm.note = ''
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to create assignment',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const closeAssignment = async (assignmentId: number) => {
  closingId.value = assignmentId
  try {
    await updateLeadAssignment(props.leadId, assignmentId, {
      status: 'ended',
      unassigned_at: new Date().toISOString(),
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update assignment',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    closingId.value = null
  }
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
