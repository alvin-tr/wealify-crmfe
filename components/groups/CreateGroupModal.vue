<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Group' : 'Create New Group'"
    size="lg"
  >
    <template #body>
      <div class="space-y-6 px-1">
        <!-- Group Name -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Group Name <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.name"
            placeholder="Enter group name"
            size="lg"
            class="w-full"
            required
          />
        </div>

        <!-- Owner -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Owner <span class="text-red-500">*</span>
          </label>
          <USelect
            v-model="form.owner_id"
            :items="salesUserOptions"
            placeholder="Select owner"
            size="lg"
            class="w-full"
            :disabled="salesUsersPending || (isSalesRole && !isEditing)"
            required
          />
          <p class="text-xs text-gray-500">
            <span v-if="isSalesRole && !isEditing">
              This group will be assigned to you. Customers added to this group will be automatically assigned to you.
            </span>
            <span v-else>
              Customers added to this group will be automatically assigned to the selected owner.
            </span>
          </p>
        </div>

        <!-- Leader Customer -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Leader Customer
            <span class="text-gray-400 text-xs font-normal ml-1">(optional)</span>
          </label>
          <UInput
            v-model="form.leader_customer_id"
            type="number"
            placeholder="Enter leader customer ID"
            size="lg"
            class="w-full"
          />
          <p class="text-xs text-gray-500">
            Set a customer as the group leader.
          </p>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Description
          </label>
          <UTextarea
            v-model="form.description"
            placeholder="Enter group description (optional)"
            :rows="5"
            size="lg"
            class="w-full"
          />
          <p class="text-xs text-gray-500">
            Provide a brief description of this group's purpose or characteristics.
          </p>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="handleCancel">Cancel</UButton>
        <UButton
          color="primary"
          :loading="submitting"
          :disabled="!form.name.trim() || (!isEditing && !form.owner_id)"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Update' : 'Create' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type {
  CustomerGroupWithDetails,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
} from '~/composables/useCustomerGroups'
import { useCustomerGroups } from '~/composables/useCustomerGroups'
import { useSalesUsers } from '~/composables/useSalesUsers'

interface Props {
  open: boolean
  group?: CustomerGroupWithDetails | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'saved', group: { id: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  group: null,
})

const emit = defineEmits<Emits>()

const toast = useToast()
const auth = useAuth()
const { createCustomerGroup, updateCustomerGroup } = useCustomerGroups()
const { fetchSalesUsers } = useSalesUsers()

// Check if user role is sales
const isSalesRole = computed(() => auth.user.value?.role === 'sales')

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEditing = computed(() => !!props.group?.id)

const submitting = ref(false)

const form = reactive<CreateCustomerGroupPayload & { id?: number }>({
  id: undefined,
  name: '',
  description: '',
  owner_id: null,
  leader_customer_id: null,
})

// Fetch sales users for owner selection
const {
  data: salesUsers,
  pending: salesUsersPending,
} = useAsyncData('sales-users-for-create-group', () => fetchSalesUsers(), {
  default: () => [],
  lazy: true,
  server: false,
})

// Get current user's sales_user_id if role is "sales"
const currentUserSalesUserId = computed(() => {
  const currentUser = auth.user.value
  if (!currentUser || currentUser.role !== 'sales') return null
  
  // Find sales user that matches current user's id
  const salesUser = (salesUsers.value || []).find(
    (u: any) => u.user_id === currentUser.id
  )
  
  if (!salesUser) return null
  
  // Return sales_user_id (not user_id)
  return salesUser.sales_user_id ?? salesUser.id ?? null
})

const salesUserOptions = computed(() => {
  const items = (salesUsers.value || []).map((user) => ({
    label: `${user.full_name} (${user.staff_code})`,
    value: user.id ?? user.sales_user_id ?? null,
  })).filter((item) => item.value !== null)
  return items
})

const resetForm = () => {
  if (props.group) {
    form.id = props.group.id
    form.name = props.group.name || ''
    form.description = props.group.description || ''
    form.owner_id = props.group.owner_id ?? null
    form.leader_customer_id = props.group.leader_customer_id ?? null
  } else {
    form.id = undefined
    form.name = ''
    form.description = ''
    // Auto-set owner_id for sales users
    form.owner_id = isSalesRole.value && currentUserSalesUserId.value ? currentUserSalesUserId.value : null
    form.leader_customer_id = null
  }
}

watch(() => props.open, (open) => {
  if (open) {
    resetForm()
    // Auto-set owner_id for sales users when modal opens
    if (isSalesRole.value && !isEditing.value && currentUserSalesUserId.value) {
      form.owner_id = currentUserSalesUserId.value
    }
  }
})

watch(() => props.group, () => {
  if (props.open) {
    resetForm()
  }
}, { deep: true })

// Watch for sales users to be loaded and auto-set owner_id for sales users
watch([salesUsers, () => props.open], ([users, open]) => {
  if (open && !isEditing.value && isSalesRole.value && currentUserSalesUserId.value && !form.owner_id) {
    form.owner_id = currentUserSalesUserId.value
  }
})

const handleCancel = () => {
  isOpen.value = false
}

const handleSubmit = async () => {
  if (!form.name.trim()) return
  
  // Validate owner_id is required when creating new group
  if (!isEditing.value && !form.owner_id) {
    toast.add({
      title: 'Owner is required',
      description: 'Please select an owner for the group.',
      color: 'error',
    })
    return
  }

  try {
    submitting.value = true

    if (isEditing.value && form.id) {
      const payload: UpdateCustomerGroupPayload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        owner_id: form.owner_id ?? null,
        leader_customer_id: form.leader_customer_id
          ? Number(form.leader_customer_id)
          : null,
      }
      await updateCustomerGroup(form.id, payload)
      toast.add({
        title: 'Group updated',
        description: 'The group has been updated successfully.',
        color: 'primary',
      })
      emit('saved', { id: form.id })
    } else {
      // owner_id is required for new groups
      if (!form.owner_id) {
        throw new Error('owner_id is required')
      }
      const payload: CreateCustomerGroupPayload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        owner_id: form.owner_id,
        leader_customer_id: form.leader_customer_id
          ? Number(form.leader_customer_id)
          : null,
      }
      const result = await createCustomerGroup(payload)
      toast.add({
        title: 'Group created',
        description: 'The group has been created successfully.',
        color: 'primary',
      })
      emit('saved', result)
    }

    isOpen.value = false
  } catch (error: any) {
    toast.add({
      title: isEditing.value ? 'Failed to update group' : 'Failed to create group',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}
</script>

