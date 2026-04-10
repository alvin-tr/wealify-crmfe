<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Tasks</h3>
          <UButton
            v-if="currentStageId && availableTaskTemplates.length > 0"
            size="sm"
            color="primary"
            icon="i-heroicons-plus"
            :loading="submitting"
            @click="showCreateModal = true"
          >
            Create Task
          </UButton>
        </div>
      </template>
      <div v-if="!items.length" class="py-10 text-center text-sm text-gray-500">
        No tasks yet. Tasks will be automatically created when the lead stage changes.
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="flex flex-col rounded-lg border border-gray-200 p-4 text-sm"
          :class="{
            'bg-gray-50': task.status === 'completed',
            'bg-red-50': task.status === 'overdue',
            'bg-yellow-50': task.status === 'in_progress',
          }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-gray-900">{{ task.task_template_name || 'Untitled Task' }}</h4>
                <UBadge
                  :color="getStatusColor(task.status)"
                  variant="soft"
                  size="xs"
                >
                  {{ getStatusLabel(task.status) }}
                </UBadge>
                <UBadge
                  v-if="task.stage_name"
                  color="neutral"
                  variant="soft"
                  size="xs"
                >
                  {{ task.stage_name }}
                </UBadge>
              </div>
              <p v-if="task.task_template_description" class="text-xs text-gray-600">
                {{ task.task_template_description }}
              </p>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span v-if="task.due_date" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                  Due: {{ formatDate(task.due_date) }}
                  <span v-if="isOverdue(task.due_date, task.status)" class="text-red-600 font-semibold">
                    (Overdue)
                  </span>
                </span>
                <span v-else class="text-gray-400">No due date</span>
                <span v-if="task.completed_at" class="flex items-center gap-1 text-green-600">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                  Completed: {{ formatDate(task.completed_at) }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                color="primary"
                variant="ghost"
                icon="i-heroicons-chat-bubble-left-right"
                @click="showInteractionModalForTaskId = task.id!"
              >
                + Interactions
                <UBadge
                  v-if="getTaskInteractions(task.id!).length > 0"
                  :label="getTaskInteractions(task.id!).length.toString()"
                  color="primary"
                  variant="solid"
                  size="xs"
                  class="ml-1"
                />
              </UButton>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="expandedTasks.has(task.id!) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                @click="toggleTaskExpansion(task.id!)"
              >
                {{ getTaskInteractions(task.id!).length }} interaction(s)
              </UButton>
              <USelect
                v-model="task.status"
                :items="statusOptions"
                size="xs"
                class="min-w-[140px]"
                :disabled="updatingTaskId === task.id"
                @update:model-value="updateTaskStatus(task)"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                :loading="deletingTaskId === task.id"
                @click="removeTask(task.id!)"
              />
            </div>
          </div>

          <!-- Interactions Section (expandable) -->
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[1000px]"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 max-h-[1000px]"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-if="expandedTasks.has(task.id!)" class="mt-4 pt-4 border-t border-gray-200">
              <div v-if="getTaskInteractions(task.id!).length === 0" class="py-4 text-center text-xs text-gray-500">
                No interactions logged yet for this task.
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="interaction in getSortedTaskInteractions(task.id!)"
                  :key="interaction.id"
                  class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-700 dark:text-gray-300"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 space-y-1">
                      <div class="flex items-center gap-2">
                        <UBadge
                          :color="getInteractionTypeColor(interaction.type)"
                          variant="soft"
                          size="xs"
                        >
                          {{ getInteractionTypeLabel(interaction.type) }}
                        </UBadge>
                        <span class="text-gray-500">
                          {{ formatDate(interaction.interaction_at || interaction.created_at) }}
                        </span>
                      </div>
                      <p v-if="interaction.summary" class="font-semibold text-gray-900 text-sm">
                        {{ interaction.summary }}
                      </p>
                      <p v-if="interaction.notes" class="text-gray-600 whitespace-pre-line">
                        {{ interaction.notes }}
                      </p>
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
                              @click="openAttachmentViewer(interaction, attachment)"
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
                    <UButton
                      size="xs"
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      @click="removeInteraction(interaction.id!)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </UCard>

    <!-- Create Interaction Modal -->
    <UModal
      :open="showInteractionModalForTaskId !== null"
      :title="showInteractionModalForTaskId ? `Log Interaction for: ${getTaskName(showInteractionModalForTaskId)}` : 'Log Interaction'"
      @update:open="(value) => { if (!value) showInteractionModalForTaskId = null }"
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="createInteraction">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">
              Interaction Type <span class="text-red-500">*</span>
            </label>
            <USelect
              v-model="interactionForm.type"
              :items="interactionTypes"
              placeholder="Select interaction type"
              icon="i-heroicons-chat-bubble-left-right"
              required
              :disabled="creatingInteraction"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Summary</label>
            <UInput
              v-model="interactionForm.summary"
              placeholder="Enter summary"
              icon="i-heroicons-document-text"
              :disabled="creatingInteraction"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Notes</label>
            <UTextarea
              v-model="interactionForm.notes"
              placeholder="Enter detailed notes"
              :rows="4"
              icon="i-heroicons-pencil-square"
              :disabled="creatingInteraction"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Interaction Time</label>
            <UInput
              v-model="interactionForm.interaction_at"
              type="datetime-local"
              placeholder="Select interaction time"
              icon="i-heroicons-clock"
              :disabled="creatingInteraction"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Attachments</label>
            <label class="professional-upload flex items-center justify-between gap-3 rounded-2xl border border-dashed border-emerald-400 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-cloud-arrow-up" class="h-6 w-6 text-emerald-500" />
                <div class="flex flex-col">
                  <span class="font-semibold text-emerald-700">
                    {{ interactionForm.attachments.length ? `${interactionForm.attachments.length} file(s) selected` : 'Upload supporting files (optional)' }}
                  </span>
                  <span class="text-xs text-emerald-600">Formats: images, docs, audio, video · Each ≤ 20 MB · Max 5 files</span>
                </div>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Browse</span>
              <input
                type="file"
                class="hidden"
                multiple
                :disabled="creatingInteraction"
                @change="handleAttachmentChange"
              />
            </label>
            <span v-if="attachmentError" class="text-xs text-red-500">{{ attachmentError }}</span>
            <div v-if="interactionForm.attachments.length" class="flex flex-wrap gap-2 pt-2">
              <div
                v-for="(file, fileIndex) in interactionForm.attachments"
                :key="`${file.name}-${fileIndex}`"
                class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
              >
                <UIcon name="i-heroicons-paper-clip" class="h-4 w-4" />
                <span class="max-w-[160px] truncate font-medium">{{ file.name }}</span>
                <button
                  type="button"
                  class="text-emerald-600 hover:text-emerald-800"
                  :disabled="creatingInteraction"
                  @click="removeAttachment(fileIndex)"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="creatingInteraction"
            @click="showInteractionModalForTaskId = null"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="creatingInteraction"
            @click="createInteraction"
          >
            Log Interaction
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Create Task Modal -->
    <UModal v-model:open="showCreateModal" title="Create Task">
      <template #body>
        <form class="space-y-4" @submit.prevent="createTask">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">
              Task Template <span class="text-red-500">*</span>
            </label>
            <USelect
              v-model="form.task_template_id"
              :items="taskTemplateOptions"
              placeholder="Select task template"
              icon="i-heroicons-document-text"
              required
              :disabled="submitting"
            />
            <p v-if="selectedTemplate" class="text-xs text-gray-500 mt-1">
              {{ selectedTemplate.description || 'No description available' }}
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">Due Date</label>
            <UInput
              v-model="form.due_date"
              type="datetime-local"
              placeholder="Select due date"
              icon="i-heroicons-calendar"
              :disabled="submitting"
            />
            <p class="text-xs text-gray-500 mt-1">
              Leave empty to use template's default due date
            </p>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="submitting"
            @click="showCreateModal = false"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="!form.task_template_id"
            @click="createTask"
          >
            Create Task
          </UButton>
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { LeadTask, LeadTaskTemplate, LeadInteraction, LeadInteractionAttachment, LeadAssignment } from '~/composables/useLeads'
import { useLeads } from '~/composables/useLeads'
import { useImageViewer } from '~/composables/useImageViewer'

const props = defineProps<{
  leadId: number
  items: LeadTask[]
  interactions: LeadInteraction[]
  currentStageId?: number | null
  assignments?: LeadAssignment[]
}>()

const emit = defineEmits<{ updated: [] }>()

const { createLeadTask, updateLeadTask, deleteLeadTask, fetchTaskTemplates, createLeadInteraction, deleteLeadInteraction, fetchLeadDetail } = useLeads()
const toast = useToast()
const auth = useAuth()

// Fetch assignments if not provided
const assignments = ref<LeadAssignment[]>(props.assignments || [])
if (!props.assignments || props.assignments.length === 0) {
  fetchLeadDetail(props.leadId).then((detail) => {
    assignments.value = detail.assignments || []
  }).catch((error) => {
    console.error('[TasksSection] Failed to fetch lead detail:', error)
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

const submitting = ref(false)
const updatingTaskId = ref<number | null>(null)
const deletingTaskId = ref<number | null>(null)
const showCreateModal = ref(false)
const expandedTasks = ref<Set<number>>(new Set())
const showInteractionModalForTaskId = ref<number | null>(null)
const creatingInteraction = ref(false)

const {
  data: taskTemplates,
  pending: templatesPending,
} = await useAsyncData('lead-task-templates', () => fetchTaskTemplates(), {
  default: () => [],
})

const availableTaskTemplates = computed(() => {
  return taskTemplates.value || []
})

const taskTemplateOptions = computed(() => {
  return availableTaskTemplates.value.map((template) => ({
    label: template.name,
    value: template.id!,
    description: template.description,
  }))
})

const selectedTemplate = computed(() => {
  if (!form.task_template_id) return null
  return availableTaskTemplates.value.find((t) => t.id === form.task_template_id) || null
})

const form = reactive({
  task_template_id: undefined as number | undefined,
  due_date: '',
})

const interactionForm = reactive({
  type: 'call' as LeadInteraction['type'],
  summary: '',
  notes: '',
  interaction_at: new Date().toISOString().slice(0, 16),
  attachments: [] as File[],
})
const attachmentError = ref<string | null>(null)

const interactionTypes = [
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Note', value: 'note' },
  { label: 'Other', value: 'other' },
]

const statusOptions = [
  { label: 'Not Started', value: 'not_started' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Overdue', value: 'overdue' },
]

const resetForm = () => {
  form.task_template_id = undefined
  form.due_date = ''
}

const createTask = async () => {
  if (!props.currentStageId || !form.task_template_id) {
    toast.add({
      title: 'Cannot create task',
      description: 'Lead must have a stage assigned and a task template must be selected',
      color: 'error',
    })
    return
  }

  submitting.value = true
  try {
    await createLeadTask(props.leadId, {
      stage_id: props.currentStageId,
      task_template_id: form.task_template_id,
      status: 'not_started',
      due_date: form.due_date || null,
    })
    toast.add({
      title: 'Task created',
      color: 'success',
    })
    resetForm()
    showCreateModal.value = false
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to create task',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const updateTaskStatus = async (task: LeadTask) => {
  if (!task.id) return

  const oldStatus = task.status
  updatingTaskId.value = task.id

  try {
    const updatePayload: Partial<LeadTask> = {
      status: task.status,
    }

    // If status is being set to completed, set completed_at
    if (task.status === 'completed' && !task.completed_at) {
      updatePayload.completed_at = new Date().toISOString()
    }
    // If status is changed from completed, clear completed_at
    else if (oldStatus === 'completed' && task.status !== 'completed') {
      updatePayload.completed_at = null
    }

    await updateLeadTask(props.leadId, task.id, updatePayload)
    toast.add({
      title: 'Task updated',
      color: 'success',
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to update task',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
    // Revert status on error
    task.status = oldStatus
  } finally {
    updatingTaskId.value = null
  }
}

const removeTask = async (taskId: number) => {
  if (!confirm('Are you sure you want to delete this task?')) return

  deletingTaskId.value = taskId
  try {
    await deleteLeadTask(props.leadId, taskId)
    toast.add({
      title: 'Task deleted',
      color: 'success',
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete task',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    deletingTaskId.value = null
  }
}

const sortedTasks = computed(() => {
  return [...props.items].sort((a, b) => {
    // Sort by status priority: not_started > in_progress > overdue > completed
    const statusOrder = { not_started: 0, in_progress: 1, overdue: 2, completed: 3 }
    const statusA = statusOrder[a.status || 'not_started']
    const statusB = statusOrder[b.status || 'not_started']
    if (statusA !== statusB) return statusA - statusB

    // Then sort by due date
    const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity
    const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity
    return dateA - dateB
  })
})

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'green'
    case 'in_progress':
      return 'yellow'
    case 'overdue':
      return 'red'
    default:
      return 'gray'
  }
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'not_started':
      return 'Not Started'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'overdue':
      return 'Overdue'
    default:
      return 'Unknown'
  }
}

const isOverdue = (dueDate: string | null | undefined, status?: string) => {
  if (!dueDate || status === 'completed') return false
  const due = new Date(dueDate)
  const now = new Date()
  return due < now && status !== 'completed'
}

const formatDate = (value?: string | null) => {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTaskInteractions = (taskId: number | undefined): LeadInteraction[] => {
  if (!taskId) return []
  return props.interactions.filter((interaction) => interaction.lead_task_id === taskId)
}

const getSortedTaskInteractions = (taskId: number | undefined): LeadInteraction[] => {
  const interactions = getTaskInteractions(taskId)
  return [...interactions].sort((a, b) => {
    const dateA = new Date(a.interaction_at || a.created_at || '').getTime()
    const dateB = new Date(b.interaction_at || b.created_at || '').getTime()
    return dateB - dateA
  })
}

const getTaskName = (taskId: number | null): string => {
  if (!taskId) return 'Task'
  const task = props.items.find((t) => t.id === taskId)
  return task?.task_template_name || 'Task'
}

const toggleTaskExpansion = (taskId: number | undefined) => {
  if (!taskId) return
  if (expandedTasks.value.has(taskId)) {
    expandedTasks.value.delete(taskId)
  } else {
    expandedTasks.value.add(taskId)
  }
}

const handleAttachmentChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    input.value = ''
    attachmentError.value = null
    return
  }

  const existing = interactionForm.attachments.slice()
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
  interactionForm.attachments = combined
  input.value = ''
}

const removeAttachment = (index: number) => {
  interactionForm.attachments.splice(index, 1)
  if (!interactionForm.attachments.length) {
    attachmentError.value = null
  }
}

const resetInteractionForm = () => {
  interactionForm.type = 'call'
  interactionForm.summary = ''
  interactionForm.notes = ''
  interactionForm.interaction_at = new Date().toISOString().slice(0, 16)
  interactionForm.attachments = []
  attachmentError.value = null
}

const createInteraction = async () => {
  if (showInteractionModalForTaskId.value === null) return

  creatingInteraction.value = true
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

    const payload = {
      sales_user_id: salesUserId,
      lead_task_id: showInteractionModalForTaskId.value ?? null,
      type: interactionForm.type,
      summary: interactionForm.summary || null,
      notes: interactionForm.notes || null,
      interaction_at: interactionForm.interaction_at ? new Date(interactionForm.interaction_at).toISOString() : undefined,
      attachments: interactionForm.attachments,
    }
    
    console.log('[TasksSection] Creating interaction with payload:', {
      leadId: props.leadId,
      ...payload,
      attachmentsCount: payload.attachments.length,
    })
    
    await createLeadInteraction(props.leadId, payload)
    
    toast.add({
      title: 'Interaction logged',
      color: 'success',
    })
    resetInteractionForm()
    showInteractionModalForTaskId.value = null
    emit('updated')
  } catch (error: any) {
    console.error('[TasksSection] Failed to create interaction:', error)
    const errorMessage = error?.data?.message || error?.message || 'Unknown error'
    toast.add({
      title: 'Failed to log interaction',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    creatingInteraction.value = false
  }
}

const removeInteraction = async (interactionId: number) => {
  if (!confirm('Are you sure you want to delete this interaction?')) return

  try {
    await deleteLeadInteraction(props.leadId, interactionId)
    toast.add({
      title: 'Interaction deleted',
      color: 'success',
    })
    emit('updated')
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete interaction',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

const getInteractionTypeColor = (type?: string) => {
  switch (type) {
    case 'call':
      return 'blue'
    case 'email':
      return 'purple'
    case 'meeting':
      return 'green'
    case 'note':
      return 'gray'
    default:
      return 'neutral'
  }
}

const getInteractionTypeLabel = (type?: string) => {
  switch (type) {
    case 'call':
      return 'Call'
    case 'email':
      return 'Email'
    case 'meeting':
      return 'Meeting'
    case 'note':
      return 'Note'
    case 'other':
      return 'Other'
    default:
      return 'Unknown'
  }
}

// Attachment viewer setup
const {
  galleryImages,
  attachmentGalleryRef,
  isImageAttachment,
  getAttachmentIcon,
  openViewer,
} = useImageViewer()

const openAttachmentViewer = async (
  interaction: LeadInteraction,
  attachment: LeadInteractionAttachment,
) => {
  const images = (interaction.attachments || []) as Array<LeadInteractionAttachment & { id?: number }>
  await openViewer(images, attachment, attachmentGalleryRef.value)
}

// Reset form when modal closes
watch(showCreateModal, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

watch(() => showInteractionModalForTaskId, (taskId) => {
  if (!taskId) {
    resetInteractionForm()
  }
})
</script>

<style scoped>
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
