<template>
  <div
    class="task-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 cursor-grab active:cursor-grabbing"
    @click="$emit('click', task)"
  >
    <!-- Priority Badge -->
    <div v-if="task.priority" class="mb-2">
      <UBadge
        :label="task.priority.toUpperCase()"
        :color="getPriorityColor(task.priority)"
        variant="soft"
        size="xs"
      />
    </div>

    <!-- Task Title -->
    <h4 class="font-semibold text-gray-900 mb-2 line-clamp-2">
      {{ task.title }}
    </h4>

    <!-- Task Description -->
    <p
      v-if="task.description"
      class="text-sm text-gray-600 mb-3 line-clamp-2"
    >
      {{ task.description }}
    </p>

    <!-- Task Meta -->
    <div class="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
      <div class="flex items-center gap-3">
        <!-- Assignees -->
        <div v-if="task.assignees?.length" class="flex items-center gap-1">
          <UIcon name="i-heroicons-users" class="h-3.5 w-3.5" />
          <span>{{ task.assignees.length }}</span>
        </div>
        <!-- Comments -->
        <div v-if="task.comments_count" class="flex items-center gap-1">
          <UIcon name="i-heroicons-chat-bubble-left" class="h-3.5 w-3.5" />
          <span>{{ task.comments_count }}</span>
        </div>
        <!-- Files -->
        <div v-if="task.files_count" class="flex items-center gap-1">
          <UIcon name="i-heroicons-paper-clip" class="h-3.5 w-3.5" />
          <span>{{ task.files_count }}</span>
        </div>
      </div>
      <!-- Deadline -->
      <div v-if="task.deadline" class="flex items-center gap-1">
        <UIcon name="i-heroicons-calendar" class="h-3.5 w-3.5" />
        <span>{{ formatDate(task.deadline) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/composables/useTasks'

defineProps<{
  task: Task
}>()

defineEmits<{
  click: [task: Task]
}>()

const getPriorityColor = (priority: string): 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral' => {
  const colors: Record<string, 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'> = {
    low: 'neutral',
    medium: 'warning',
    high: 'error',
  }
  return colors[priority] || 'neutral'
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

