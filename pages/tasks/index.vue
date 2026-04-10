<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
        <p class="text-sm text-gray-500">Manage and organize your tasks.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="pending"
          @click="() => refresh()"
        >
          Refresh
        </UButton>
        <UButton color="primary" icon="i-heroicons-plus" @click="openCreateTaskModal">
          New Task
        </UButton>
      </div>
    </header>

    <!-- Filters -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-heroicons-arrow-path"
            :disabled="!hasActiveFilters"
            @click="resetFilters"
          >
            Reset
          </UButton>
        </div>
      </template>
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[200px]">
          <UFormGroup label="Status" name="status">
            <USelect
              v-model="filters.status"
              :items="statusFilterOptions"
              placeholder="All statuses"
              icon="i-heroicons-adjustments-horizontal"
            />
          </UFormGroup>
        </div>
        <div class="flex-1 min-w-[200px]">
          <UFormGroup label="Priority" name="priority">
            <USelect
              v-model="filters.priority"
              :items="priorityFilterOptions"
              placeholder="All priorities"
              icon="i-heroicons-flag"
            />
          </UFormGroup>
        </div>
        <div class="flex-1 min-w-[200px]">
          <UFormGroup label="Assignee" name="assignee">
            <USelect
              v-model="filters.assigneeUserId"
              :items="assigneeFilterOptions"
              placeholder="All assignees"
              icon="i-heroicons-user-group"
              :loading="filterUsersLoading"
            />
          </UFormGroup>
        </div>
        <div class="flex-1 min-w-[200px]">
          <UFormGroup label="Created by" name="createdBy">
            <USelect
              v-model="filters.createdBy"
              :items="createdByFilterOptions"
              placeholder="All creators"
              icon="i-heroicons-user-circle"
              :loading="filterUsersLoading"
            />
          </UFormGroup>
        </div>
        <div class="flex items-center gap-2">
          <UCheckbox
            v-model="filters.includeArchived"
            label="Include archived"
          />
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Loading tasks...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-12 text-center">
      <p class="text-red-600">Error loading tasks: {{ error.message }}</p>
      <UButton color="primary" variant="soft" @click="() => refresh()" class="mt-4">
        Retry
      </UButton>
    </div>

    <!-- Kanban Board -->
    <div v-else class="flex gap-4 overflow-x-auto pb-4">
      <div
        v-for="column in columns"
        :key="column.status"
        class="flex-shrink-0 w-96 kanban-column-wrapper"
        :data-status="column.status"
      >
        <!-- Column Header - Fixed outside scroll area -->
        <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 px-2 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div
              class="w-2.5 h-2.5 rounded-full"
              :class="column.color"
            ></div>
            <h3 class="text-sm font-semibold text-gray-800 uppercase tracking-wide">{{ column.label }}</h3>
            <UBadge
              :label="String(getTasksByStatus(column.status).length)"
              color="neutral"
              variant="soft"
              size="xs"
              class="font-medium"
            />
          </div>
        </div>

        <!-- Column Content - Scrollable -->
        <div
          class="kanban-column rounded-lg p-5 border border-gray-200 shadow-sm transition-all flex-1 overflow-hidden flex flex-col"
          :class="column.bgClass"
        >
          <!-- Tasks List -->
          <div class="tasks-drop-zone flex-1 overflow-y-auto min-h-0">
            <!-- VueDraggable for each column -->
            <VueDraggable
              v-if="column.status === 'todo'"
              v-model="tasksTodo"
              :group="{ name: 'tasks', pull: true, put: true }"
              :animation="200"
              easing="ease-out"
              :force-fallback="false"
              :swap-threshold="0.3"
              :inverted-swap-threshold="0.3"
              :empty-insert-threshold="100"
              :direction="'vertical'"
              :sort="true"
              :scroll="true"
              :scroll-sensitivity="150"
              :scroll-speed="25"
              :bubble-scroll="true"
              ghost-class="task-ghost"
              chosen-class="task-chosen"
              drag-class="task-dragging"
              item-key="id"
              class="space-y-4"
              @start="handleDragStart"
              @move="handleDragMove"
              @end="(evt) => handleDragEnd(evt, column.status)"
            >
              <div
                v-for="task in tasksTodo"
                :key="task.id"
                :data-task-id="task.id"
                class="task-item-wrapper"
              >
                <TaskCard
                  :task="task"
                  @click="openTaskDetailModal"
                />
              </div>
            </VueDraggable>
            
            <VueDraggable
              v-else-if="column.status === 'in_progress'"
              v-model="tasksInProgress"
              :group="{ name: 'tasks', pull: true, put: true }"
              :animation="200"
              easing="ease-out"
              :force-fallback="false"
              :swap-threshold="0.3"
              :inverted-swap-threshold="0.3"
              :empty-insert-threshold="100"
              :direction="'vertical'"
              :sort="true"
              :scroll="true"
              :scroll-sensitivity="150"
              :scroll-speed="25"
              :bubble-scroll="true"
              ghost-class="task-ghost"
              chosen-class="task-chosen"
              drag-class="task-dragging"
              item-key="id"
              class="space-y-4"
              @start="handleDragStart"
              @move="handleDragMove"
              @end="(evt) => handleDragEnd(evt, column.status)"
            >
              <div
                v-for="task in tasksInProgress"
                :key="task.id"
                :data-task-id="task.id"
                class="task-item-wrapper cursor-move"
              >
                <TaskCard
                  :task="task"
                  @click="openTaskDetailModal"
                />
              </div>
            </VueDraggable>
            
            <VueDraggable
              v-else-if="column.status === 'review'"
              v-model="tasksReview"
              :group="{ name: 'tasks', pull: true, put: true }"
              :animation="200"
              easing="ease-out"
              :force-fallback="false"
              :swap-threshold="0.3"
              :inverted-swap-threshold="0.3"
              :empty-insert-threshold="100"
              :direction="'vertical'"
              :sort="true"
              :scroll="true"
              :scroll-sensitivity="150"
              :scroll-speed="25"
              :bubble-scroll="true"
              ghost-class="task-ghost"
              chosen-class="task-chosen"
              drag-class="task-dragging"
              item-key="id"
              class="space-y-4"
              @start="handleDragStart"
              @move="handleDragMove"
              @end="(evt) => handleDragEnd(evt, column.status)"
            >
              <div
                v-for="task in tasksReview"
                :key="task.id"
                :data-task-id="task.id"
                class="task-item-wrapper cursor-move"
              >
                <TaskCard
                  :task="task"
                  @click="openTaskDetailModal"
                />
              </div>
            </VueDraggable>
            
            <VueDraggable
              v-else-if="column.status === 'done'"
              v-model="tasksDone"
              :group="{ name: 'tasks', pull: true, put: true }"
              :animation="200"
              easing="ease-out"
              :force-fallback="false"
              :swap-threshold="0.3"
              :inverted-swap-threshold="0.3"
              :empty-insert-threshold="100"
              :direction="'vertical'"
              :sort="true"
              :scroll="true"
              :scroll-sensitivity="150"
              :scroll-speed="25"
              :bubble-scroll="true"
              ghost-class="task-ghost"
              chosen-class="task-chosen"
              drag-class="task-dragging"
              item-key="id"
              class="space-y-4"
              @start="handleDragStart"
              @move="handleDragMove"
              @end="(evt) => handleDragEnd(evt, column.status)"
            >
              <div
                v-for="task in tasksDone"
                :key="task.id"
                :data-task-id="task.id"
                class="task-item-wrapper cursor-move"
              >
                <TaskCard
                  :task="task"
                  @click="openTaskDetailModal"
                />
              </div>
            </VueDraggable>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Task Modal -->
    <UModal
      v-model:open="isTaskModalOpen"
      :title="editingTask ? 'Edit Task' : 'Create New Task'"
      :ui="{ content: 'w-full max-w-3xl' }"
    >
      <template #body>
        <div class="space-y-6">
          <!-- Basic Information Section -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-4">
            <h3 class="text-sm font-semibold text-gray-700 uppercase mb-4">Basic Information</h3>
            
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">
                Title <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="taskForm.title"
                placeholder="Enter task title"
                required
                size="lg"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">Description</label>
              <UTextarea
                v-model="taskForm.description"
                placeholder="Enter task description"
                :rows="4"
                size="lg"
                class="w-full"
              />
            </div>
          </div>

          <!-- Task Details Section -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-4">
            <h3 class="text-sm font-semibold text-gray-700 uppercase mb-4">Task Details</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Priority</label>
                <USelect
                  v-model="taskForm.priority"
                  :items="priorityOptions"
                  placeholder="Select priority"
                  size="lg"
                  class="w-full"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Status</label>
                <USelect
                  v-model="taskForm.status"
                  :items="statusOptions"
                  placeholder="Select status"
                  size="lg"
                  class="w-full"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">Deadline</label>
              <UInput
                v-model="taskForm.deadline"
                type="datetime-local"
                size="lg"
                class="w-full"
              />
            </div>
          </div>

          <!-- Assignees Section -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700 uppercase">Assignees</h3>
              <UButton
                variant="ghost"
                color="primary"
                size="sm"
                icon="i-heroicons-plus"
                @click="openTaskFormAssigneesModal"
              >
                Manage Assignees
              </UButton>
            </div>
            
            <!-- Selected Assignees -->
            <div v-if="taskForm.selectedAssigneeIds.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="userId in taskForm.selectedAssigneeIds"
                :key="userId"
                :label="getTaskFormAssigneeName(userId)"
                color="primary"
                variant="soft"
                class="cursor-pointer hover:opacity-80"
                @click="toggleTaskFormAssignee(userId)"
              >
                <template #trailing>
                  <UIcon name="i-heroicons-x-mark" class="h-3 w-3 ml-1" />
                </template>
              </UBadge>
            </div>
            <p v-else class="text-sm text-gray-400">No assignees selected</p>
          </div>

          <!-- Customers Section -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700 uppercase">Customers</h3>
              <UButton
                variant="ghost"
                color="primary"
                size="sm"
                icon="i-heroicons-plus"
                @click="openTaskFormCustomersModal"
              >
                Manage Customers
              </UButton>
            </div>
            
            <!-- Selected Customers -->
            <div v-if="taskForm.selectedCustomerIds.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="customerId in taskForm.selectedCustomerIds"
                :key="customerId"
                :label="getTaskFormCustomerName(customerId)"
                color="info"
                variant="soft"
                class="cursor-pointer hover:opacity-80"
                @click="toggleTaskFormCustomer(customerId)"
              >
                <template #trailing>
                  <UIcon name="i-heroicons-x-mark" class="h-3 w-3 ml-1" />
                </template>
              </UBadge>
            </div>
            <p v-else class="text-sm text-gray-400">No customers selected</p>
          </div>

          <!-- Attachments Section -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 space-y-4">
            <h3 class="text-sm font-semibold text-gray-700 uppercase mb-4">Attachments</h3>
            
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Upload Files</label>
              <label class="task-file-upload flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 px-4 py-4 text-sm text-primary-700 hover:bg-primary-50 hover:border-primary-400 transition-colors cursor-pointer w-full">
                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-cloud-arrow-up" class="h-6 w-6 text-primary-500" />
                  <div class="flex flex-col">
                    <span class="font-semibold text-primary-700">
                      {{ taskForm.attachments.length ? `${taskForm.attachments.length} file(s) selected` : 'Upload files (optional)' }}
                    </span>
                    <span class="text-xs text-primary-600">Formats: images, docs, audio, video · Each ≤ 20 MB · Max 10 files</span>
                  </div>
                </div>
                <span class="text-xs font-semibold uppercase tracking-wide text-primary-600">Browse</span>
                <input
                  type="file"
                  class="hidden"
                  multiple
                  @change="handleTaskFileChange"
                />
              </label>
            </div>
            
            <div v-if="taskFileError" class="text-xs text-red-500 bg-red-50 p-2 rounded">
              {{ taskFileError }}
            </div>
            
            <div v-if="taskForm.attachments.length" class="flex flex-wrap gap-2 pt-2">
              <div
                v-for="(file, fileIndex) in taskForm.attachments"
                :key="`${file.name}-${fileIndex}`"
                class="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700"
              >
                <UIcon name="i-heroicons-paper-clip" class="h-4 w-4" />
                <span class="max-w-[200px] truncate font-medium">{{ file.name }}</span>
                <span class="text-primary-500">({{ formatFileSize(file.size) }})</span>
                <button
                  type="button"
                  class="text-primary-600 hover:text-primary-800"
                  @click="removeTaskFile(fileIndex)"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="!taskForm.title.trim()"
            @click="handleSubmitTask"
          >
            {{ editingTask ? 'Update' : 'Create' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Task Detail Modal -->
    <UModal
      v-model:open="isTaskDetailModalOpen"
      :title="selectedTask ? selectedTask.title : 'Task Details'"
      :ui="{ content: 'w-full max-w-4xl' }"
      :dismissible="!isViewerActive"
    >
      <template #body>
        <div v-if="selectedTask" class="space-y-6">
          <!-- Task Info -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-semibold text-gray-500 uppercase">Description</label>
              <p class="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {{ selectedTask.description || 'No description' }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-500 uppercase">Priority</label>
                <div class="mt-1">
                  <UBadge
                    :label="(selectedTask.priority || 'medium').toUpperCase()"
                    :color="getPriorityColor(selectedTask.priority || 'medium')"
                    variant="soft"
                  />
                </div>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-500 uppercase">Status</label>
                <div class="mt-1">
                  <USelect
                    :model-value="selectedTask.status"
                    :items="statusOptions"
                    @update:model-value="handleStatusChange"
                  />
                </div>
              </div>
            </div>

            <div v-if="selectedTask.deadline" class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-500 uppercase">Deadline</label>
                <p class="mt-1 text-sm text-gray-900">
                  {{ formatDate(selectedTask.deadline) }}
                </p>
              </div>
              <div>
                <label class="text-sm font-semibold text-gray-500 uppercase">Created By</label>
                <p class="mt-1 text-sm text-gray-900">
                  {{ selectedTask.created_by_name || 'Unknown' }}
                </p>
              </div>
            </div>
            <div v-else>
              <label class="text-sm font-semibold text-gray-500 uppercase">Created By</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ selectedTask.created_by_name || 'Unknown' }}
              </p>
            </div>
          </div>

          <!-- Assignees -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-semibold text-gray-700">Assignees</label>
              <UButton
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="openAssigneesModal"
              >
                Add Assignees
              </UButton>
            </div>
            <div v-if="selectedTask.assignees?.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="assignee in selectedTask.assignees"
                :key="assignee.user_id"
                :label="assignee.user_name"
                color="primary"
                variant="soft"
                class="cursor-pointer hover:opacity-80"
                @click="handleRemoveAssignee(assignee.user_id)"
              >
                <template #trailing>
                  <UIcon name="i-heroicons-x-mark" class="h-3 w-3 ml-1" />
                </template>
              </UBadge>
            </div>
            <p v-else class="text-sm text-gray-400">No assignees</p>
          </div>

          <!-- Customers -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-semibold text-gray-700">Customers</label>
              <UButton
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="openCustomersModal"
              >
                Add Customers
              </UButton>
            </div>
            <div v-if="selectedTask.customers?.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="customer in selectedTask.customers"
                :key="customer.customer_id"
                :label="getCustomerName(customer.customer_id)"
                color="info"
                variant="soft"
                class="cursor-pointer hover:opacity-80"
                @click="handleRemoveCustomer(customer.customer_id)"
              >
                <template #trailing>
                  <UIcon name="i-heroicons-x-mark" class="h-3 w-3 ml-1" />
                </template>
              </UBadge>
            </div>
            <p v-else class="text-sm text-gray-400">No customers</p>
          </div>

          <!-- Task Files Section -->
          <div v-if="selectedTaskFiles.length" class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-semibold text-gray-700">
                Task Files ({{ selectedTaskFiles.length }})
              </label>
            </div>
            <div class="flex flex-wrap gap-2">
              <template v-for="file in selectedTaskFiles" :key="file.id">
                <!-- Image files - use viewer -->
                <button
                  v-if="isTaskImageFile(file)"
                  type="button"
                  class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors text-left"
                  @click="openTaskFileImageViewer(file)"
                  :aria-label="`Preview ${file.file_name || 'image attachment'}`"
                >
                  <div class="h-10 w-14 overflow-hidden rounded border border-gray-200 flex-shrink-0">
                    <img
                      :src="file.url"
                      :alt="file.file_name || 'Image preview'"
                      class="h-full w-full object-cover"
                    />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-xs font-medium text-gray-700 truncate max-w-[150px]">
                      {{ file.file_name || 'Image attachment' }}
                    </span>
                    <span v-if="file.file_size" class="text-[10px] text-gray-500">
                      {{ formatFileSize(file.file_size) }}
                    </span>
                  </div>
                </button>
                <!-- Non-image files - open link -->
                <a
                  v-else
                  :href="file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  <UIcon name="i-heroicons-paper-clip" class="h-4 w-4" />
                  <span class="font-medium">{{ file.file_name || 'Attachment' }}</span>
                  <span v-if="file.file_size" class="text-xs text-primary-500">
                    ({{ formatFileSize(file.file_size) }})
                  </span>
                </a>
              </template>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-semibold text-gray-700">
                Comments ({{ sortedTaskComments.length }})
              </label>
            </div>

            <!-- Add Comment Form -->
            <div class="mb-4 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <UTextarea
                v-model="newCommentContent"
                placeholder="Add a comment..."
                :rows="4"
                class="mb-3 w-full"
              />
              
              <!-- File Upload for Comment -->
              <div class="mb-3">
                <label class="comment-file-upload flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 px-4 py-3 text-sm text-primary-700 hover:bg-primary-50 hover:border-primary-400 transition-colors cursor-pointer w-full">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-cloud-arrow-up" class="h-5 w-5 text-primary-500" />
                    <div class="flex flex-col">
                      <span class="font-semibold text-primary-700">
                        {{ newCommentFiles.length ? `${newCommentFiles.length} file(s) selected` : 'Upload files (optional)' }}
                      </span>
                      <span class="text-xs text-primary-600">Each ≤ 20 MB · Max 10 files</span>
                    </div>
                  </div>
                  <span class="text-xs font-semibold uppercase tracking-wide text-primary-600">Browse</span>
                  <input
                    type="file"
                    class="hidden"
                    multiple
                    @change="handleCommentFileChange"
                  />
                </label>
              </div>
              
              <div v-if="commentFileError" class="mb-3 text-xs text-red-500 bg-red-50 p-2 rounded">
                {{ commentFileError }}
              </div>
              
              <div v-if="newCommentFiles.length" class="mb-3 flex flex-wrap gap-2">
                <div
                  v-for="(file, fileIndex) in newCommentFiles"
                  :key="`${file.name}-${fileIndex}`"
                  class="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700"
                >
                  <UIcon name="i-heroicons-paper-clip" class="h-4 w-4" />
                  <span class="max-w-[200px] truncate font-medium">{{ file.name }}</span>
                  <span class="text-primary-500">({{ formatFileSize(file.size) }})</span>
                  <button
                    type="button"
                    class="text-primary-600 hover:text-primary-800"
                    @click="removeCommentFile(fileIndex)"
                  >
                    <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div class="flex items-center justify-end gap-2">
                <UButton
                  color="primary"
                  size="sm"
                  :loading="addingComment"
                  :disabled="!newCommentContent.trim() && newCommentFiles.length === 0"
                  @click="handleAddComment"
                >
                  Add Comment
                </UButton>
              </div>
            </div>

            <!-- Comments List -->
            <div v-if="sortedTaskComments.length" class="space-y-3 max-h-[400px] overflow-y-auto">
              <div
                v-for="comment in sortedTaskComments"
                :key="comment.id"
                class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800/50"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <p class="text-sm font-semibold text-gray-900">{{ comment.user_name || 'Unknown' }}</p>
                      <span class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</span>
                    </div>
                    <p v-if="comment.content" class="text-sm text-gray-700 whitespace-pre-line mb-2">{{ comment.content }}</p>
                    <!-- Comment Files -->
                    <div v-if="comment.files && Array.isArray(comment.files) && comment.files.length > 0" class="mt-2 flex flex-wrap gap-2">
                      <template v-for="(file, fileIndex) in comment.files" :key="file.id || fileIndex">
                        <!-- Image files - use viewer -->
                        <button
                          v-if="isCommentImageFile(file)"
                          type="button"
                          class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors text-left"
                          @click="openCommentImageViewer(comment, file)"
                          :aria-label="`Preview ${file.file_name || 'image attachment'}`"
                        >
                          <div class="h-10 w-14 overflow-hidden rounded border border-gray-200 flex-shrink-0 bg-gray-100">
                            <img
                              :src="file.url"
                              :alt="file.file_name || 'Image preview'"
                              class="h-full w-full object-cover"
                              @error="(e) => { 
                                console.error('[Tasks] Image load error:', file.url); 
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }"
                            />
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-xs font-medium text-gray-700 truncate max-w-[150px]">
                              {{ file.file_name || 'Image attachment' }}
                            </span>
                            <span v-if="file.file_size" class="text-[10px] text-gray-500">
                              {{ formatFileSize(file.file_size) }}
                            </span>
                          </div>
                        </button>
                        <!-- Non-image files - open link -->
                        <a
                          v-else
                          :href="file.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2 py-1.5 hover:bg-primary-100 transition-colors text-xs text-primary-700"
                        >
                          <UIcon name="i-heroicons-paper-clip" class="h-3.5 w-3.5 flex-shrink-0" />
                          <span class="font-medium truncate max-w-[150px]">{{ file.file_name || 'Attachment' }}</span>
                          <span v-if="file.file_size" class="text-[10px] text-primary-500">
                            ({{ formatFileSize(file.file_size) }})
                          </span>
                        </a>
                      </template>
                    </div>
                  </div>
                  <UButton
                    v-if="comment.user_id === currentUserId"
                    variant="ghost"
                    color="error"
                    size="xs"
                    icon="i-heroicons-trash"
                    @click="handleDeleteComment(comment.id!)"
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-400 text-center py-4">No comments yet</div>
          </div>
        </div>
      </template>
      
      <!-- Image Viewer Gallery (hidden, used by viewer) -->
      <div ref="attachmentGalleryRef" class="hidden"></div>

      <template #footer="{ close }">
        <div class="flex items-center justify-between">
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-archive-box"
            @click="handleArchiveTask"
          >
            Archive
          </UButton>
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="ghost" @click="close">Close</UButton>
            <UButton
              color="primary"
              @click="openEditTaskModal"
            >
              Edit
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Assignees Modal -->
    <UModal
      v-model:open="isAssigneesModalOpen"
      title="Manage Assignees"
      size="md"
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="assigneeSearchQuery"
            placeholder="Search users..."
            icon="i-heroicons-magnifying-glass"
            class="mb-4"
          />
          <div v-if="usersLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading users...</p>
          </div>
          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="user.avatar || undefined"
                  :alt="user.full_name"
                  size="sm"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ user.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ user.username }} · {{ user.role }}</p>
                </div>
              </div>
              <UButton
                v-if="isAssigneeSelected(user.id!)"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="toggleAssignee(user.id!)"
              >
                Remove
              </UButton>
              <UButton
                v-else
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="toggleAssignee(user.id!)"
              >
                Add
              </UButton>
            </div>
            <div v-if="filteredUsers.length === 0" class="text-center py-8 text-sm text-gray-400">
              No users found
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="savingAssignees"
            @click="handleSaveAssignees"
          >
            Save
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Task Form Assignees Modal -->
    <UModal
      v-model:open="isTaskFormAssigneesModalOpen"
      title="Manage Assignees"
      size="md"
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="taskFormAssigneeSearchQuery"
            placeholder="Search users..."
            icon="i-heroicons-magnifying-glass"
            class="mb-4"
          />
          <div v-if="taskFormUsersLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading users...</p>
          </div>
          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="user in taskFormFilteredUsers"
              :key="user.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="user.avatar || undefined"
                  :alt="user.full_name"
                  size="sm"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ user.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ user.username }} · {{ user.role }}</p>
                </div>
              </div>
              <UButton
                v-if="isTaskFormAssigneeSelected(user.id!)"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="toggleTaskFormAssignee(user.id!)"
              >
                Remove
              </UButton>
              <UButton
                v-else
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="toggleTaskFormAssignee(user.id!)"
              >
                Add
              </UButton>
            </div>
            <div v-if="taskFormFilteredUsers.length === 0" class="text-center py-8 text-sm text-gray-400">
              No users found
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Done</UButton>
        </div>
      </template>
    </UModal>

    <!-- Task Form Customers Modal -->
    <UModal
      v-model:open="isTaskFormCustomersModalOpen"
      title="Manage Customers"
      size="md"
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="taskFormCustomerSearchQuery"
            placeholder="Search customers..."
            icon="i-heroicons-magnifying-glass"
            class="mb-4"
          />
          <div v-if="taskFormCustomersLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading customers...</p>
          </div>
          <div v-else-if="!taskFormCustomerSearchQuery.trim()" class="text-center py-8 text-sm text-gray-400">
            Start typing to search for customers (minimum 2 characters)...
          </div>
          <div v-else-if="taskFormCustomerSearchQuery.trim().length < 2" class="text-center py-8 text-sm text-gray-400">
            Please type at least 2 characters to search...
          </div>
          <div v-else-if="taskFormCustomerSearchQuery !== taskFormCustomerSearchQueryDebounced" class="text-center py-8 text-sm text-gray-400">
            Searching...
          </div>
          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="customer in taskFormFilteredCustomers"
              :key="customer.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ customer.full_name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ customer.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ customer.email }} · {{ customer.customer_id }}</p>
                </div>
              </div>
              <UButton
                v-if="isTaskFormCustomerSelected(customer.id!)"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="toggleTaskFormCustomer(customer.id!)"
              >
                Remove
              </UButton>
              <UButton
                v-else
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="toggleTaskFormCustomer(customer.id!)"
              >
                Add
              </UButton>
            </div>
            <div v-if="taskFormFilteredCustomers.length === 0 && taskFormCustomerSearchQueryDebounced.trim()" class="text-center py-8 text-sm text-gray-400">
              No customers found
            </div>
            <div v-if="taskFormFilteredCustomers.length === 50" class="text-center py-2 text-xs text-gray-400 border-t border-gray-200 pt-2">
              Showing first 50 results. Refine your search for more specific results.
            </div>
            <div v-if="taskFormFilteredCustomers.length === 50" class="text-center py-2 text-xs text-gray-400 border-t border-gray-200 pt-2">
              Showing first 50 results. Refine your search for more specific results.
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Done</UButton>
        </div>
      </template>
    </UModal>

    <!-- Customers Modal -->
    <UModal
      v-model:open="isCustomersModalOpen"
      title="Manage Customers"
      size="md"
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="customerSearchQuery"
            placeholder="Search customers..."
            icon="i-heroicons-magnifying-glass"
            class="mb-4"
          />
          <div v-if="customersLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading customers...</p>
          </div>
          <div v-else-if="!customerSearchQuery.trim()" class="text-center py-8 text-sm text-gray-400">
            Start typing to search for customers (minimum 2 characters)...
          </div>
          <div v-else-if="customerSearchQuery.trim().length < 2" class="text-center py-8 text-sm text-gray-400">
            Please type at least 2 characters to search...
          </div>
          <div v-else-if="customerSearchQuery !== customerSearchQueryDebounced" class="text-center py-8 text-sm text-gray-400">
            Searching...
          </div>
          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ customer.full_name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ customer.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ customer.email }} · {{ customer.customer_id }}</p>
                </div>
              </div>
              <UButton
                v-if="isCustomerSelected(customer.id!)"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="toggleCustomer(customer.id!)"
              >
                Remove
              </UButton>
              <UButton
                v-else
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="toggleCustomer(customer.id!)"
              >
                Add
              </UButton>
            </div>
            <div v-if="filteredCustomers.length === 0 && customerSearchQueryDebounced.trim()" class="text-center py-8 text-sm text-gray-400">
              No customers found
            </div>
            <div v-if="filteredCustomers.length === 50" class="text-center py-2 text-xs text-gray-400 border-t border-gray-200 pt-2">
              Showing first 50 results. Refine your search for more specific results.
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="savingCustomers"
            @click="handleSaveCustomers"
          >
            Save
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { nextTick, computed, onMounted, watch, reactive } from 'vue'
import type { Task, CreateTaskDto, UpdateTaskDto, TaskComment, CommentFile } from '~/composables/useTasks'
import { useTasks } from '~/composables/useTasks'
import { useUsers, type UserWithSalesInfo } from '~/composables/useUsers'
import { useCustomers, type Customer } from '~/composables/useCustomers'
import { useImageViewer } from '~/composables/useImageViewer'
import TaskCard from '~/components/tasks/TaskCard.vue'

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()
const {
  fetchTasks,
  fetchTaskById,
  createTask,
  updateTask,
  archiveTask,
  unarchiveTask,
  fetchComments,
  addComment,
  deleteComment,
  addAssignees,
  removeAssignees,
  addCustomers,
  removeCustomers,
} = useTasks()

// Get current user for permission checks
const auth = useAuth()
const currentUserId = computed(() => auth.user.value?.id)

const { fetchUsers } = useUsers()

// Kanban columns with improved styling
const columns = [
  {
    status: 'todo',
    label: 'To Do',
    color: 'bg-gray-400',
    bgClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700',
  },
  {
    status: 'in_progress',
    label: 'In Progress',
    color: 'bg-blue-500',
    bgClass: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30',
  },
  {
    status: 'review',
    label: 'Review',
    color: 'bg-yellow-500',
    bgClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30',
  },
  {
    status: 'done',
    label: 'Done',
    color: 'bg-green-500',
    bgClass: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30',
  },
]

// Filters
const filters = reactive({
  status: null as string | null,
  priority: null as string | null,
  assigneeUserId: null as number | null,
  createdBy: null as number | null,
  includeArchived: false,
})

// Filter options
const statusFilterOptions = [
  { label: 'All statuses', value: null },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
]

const priorityFilterOptions = [
  { label: 'All priorities', value: null },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

// Filter users and customers
const filterUsersLoading = ref(false)
const filterUsers = ref<UserWithSalesInfo[]>([])
const assigneeFilterOptions = computed(() => {
  const base = [{ label: 'All assignees', value: null }]
  const items = filterUsers.value.map((user) => ({
    label: user.full_name || user.username || `User #${user.id}`,
    value: user.id || null,
  })).filter((item) => item.value !== null)
  return [...base, ...items]
})

const createdByFilterOptions = computed(() => {
  const base = [{ label: 'All creators', value: null }]
  const items = filterUsers.value.map((user) => ({
    label: user.full_name || user.username || `User #${user.id}`,
    value: user.id || null,
  })).filter((item) => item.value !== null)
  return [...base, ...items]
})

const hasActiveFilters = computed(() => {
  return filters.status !== null ||
    filters.priority !== null ||
    filters.assigneeUserId !== null ||
    filters.createdBy !== null ||
    filters.includeArchived === true
})

const resetFilters = () => {
  filters.status = null
  filters.priority = null
  filters.assigneeUserId = null
  filters.createdBy = null
  filters.includeArchived = false
  // Watch will automatically trigger refresh
}

// Debounce filter changes to avoid multiple API calls
// Load filter data
onMounted(async () => {
  // Load users for assignee filter
  if (filterUsers.value.length === 0) {
    filterUsersLoading.value = true
    try {
      filterUsers.value = await fetchUsers()
    } catch (error: any) {
      console.error('[Tasks] Error loading filter users:', error)
    } finally {
      filterUsersLoading.value = false
    }
  }

  // Pre-load customers in background (for task forms)
  const cached = getCachedCustomers()
  if (!cached || cached.length === 0) {
    fetchCustomers().catch((error) => {
      console.error('[Tasks] Error pre-loading customers:', error)
    })
  }
})

// Fetch all tasks once (with archived if needed) - filter locally for speed
const {
  data: allTasksRaw,
  pending,
  error,
  refresh,
} = useAsyncData('tasks-all', () => {
  // Load all tasks including archived (we'll filter archived locally)
  return fetchTasks({ include_archived: true })
}, {
  default: () => [],
  lazy: true,
  server: false,
})

// Filter tasks locally based on current filters (no API call)
const tasks = computed(() => {
  let filtered = allTasksRaw.value || []
  
  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((task) => (task.status || 'todo') === filters.status)
  }
  
  // Filter by priority
  if (filters.priority) {
    filtered = filtered.filter((task) => (task.priority || 'medium') === filters.priority)
  }
  
  // Filter by assignee
  if (filters.assigneeUserId) {
    filtered = filtered.filter((task) => 
      task.assignees?.some((a) => a.user_id === filters.assigneeUserId)
    )
  }
  
  // Filter by created by
  if (filters.createdBy) {
    filtered = filtered.filter((task) => task.created_by === filters.createdBy)
  }
  
  // Filter archived (if not including archived)
  if (!filters.includeArchived) {
    filtered = filtered.filter((task) => !task.is_archived || task.is_archived === 0)
  }
  
  return filtered
})

// Pre-load customers when page loads (cache them)
const { fetchCustomers, getCachedCustomers } = useCustomers()

// Merge customer loading into filter loading onMounted
// (already handled in filter loading section above)

// Create reactive arrays for each column (mutable for drag & drop)
const tasksTodo = ref<Task[]>([])
const tasksInProgress = ref<Task[]>([])
const tasksReview = ref<Task[]>([])
const tasksDone = ref<Task[]>([])

// Flag to prevent recursive updates during drag & drop
const isUpdatingFromDrag = ref(false)

// Update column arrays when filtered tasks change (computed will auto-update)
watch(tasks, (newTasks) => {
  if (isUpdatingFromDrag.value) {
    return
  }

  const allTasks = newTasks || []
  
  // Filter tasks by status - immediate update (no debounce needed since it's local)
  tasksTodo.value = allTasks.filter((task) => (task.status || 'todo') === 'todo')
  tasksInProgress.value = allTasks.filter((task) => (task.status || 'todo') === 'in_progress')
  tasksReview.value = allTasks.filter((task) => (task.status || 'todo') === 'review')
  tasksDone.value = allTasks.filter((task) => (task.status || 'todo') === 'done')
}, { immediate: true })

// Get tasks by status (for badge count)
const getTasksByStatus = (status: string): Task[] => {
  switch (status) {
    case 'todo':
      return tasksTodo.value
    case 'in_progress':
      return tasksInProgress.value
    case 'review':
      return tasksReview.value
    case 'done':
      return tasksDone.value
    default:
      return []
  }
}

// Priority options
const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

// Status options
const statusOptions = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
]

// Get priority color
const getPriorityColor = (priority: string): 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral' => {
  const colors: Record<string, 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'> = {
    low: 'neutral',
    medium: 'warning',
    high: 'error',
  }
  return colors[priority] || 'neutral'
}

// Task Modal
const isTaskModalOpen = ref(false)
const editingTask = ref<Task | null>(null)
const submitting = ref(false)

const taskForm = reactive<CreateTaskDto & { attachments: File[]; selectedAssigneeIds: number[]; selectedCustomerIds: number[] }>({
  title: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  deadline: null,
  attachments: [],
  selectedAssigneeIds: [],
  selectedCustomerIds: [],
})

const taskFileError = ref<string | null>(null)

// Task Form - Assignees & Customers
const isTaskFormAssigneesModalOpen = ref(false)
const isTaskFormCustomersModalOpen = ref(false)
const taskFormUsersLoading = ref(false)
const taskFormUsers = ref<UserWithSalesInfo[]>([])
const taskFormAssigneeSearchQuery = ref('')
const taskFormAssigneeSearchQueryDebounced = ref('')
const taskFormCustomersLoading = ref(false)
const taskFormCustomers = ref<Customer[]>([])
const taskFormCustomerSearchQuery = ref('')
const taskFormCustomerSearchQueryDebounced = ref('')

// Debounce search queries for better performance
let assigneeSearchTimeout: ReturnType<typeof setTimeout> | null = null
let customerSearchTimeout: ReturnType<typeof setTimeout> | null = null

watch(taskFormAssigneeSearchQuery, (newValue) => {
  if (assigneeSearchTimeout) {
    clearTimeout(assigneeSearchTimeout)
  }
  assigneeSearchTimeout = setTimeout(() => {
    taskFormAssigneeSearchQueryDebounced.value = newValue
  }, 300) // 300ms debounce
})

watch(taskFormCustomerSearchQuery, (newValue) => {
  if (customerSearchTimeout) {
    clearTimeout(customerSearchTimeout)
  }
  customerSearchTimeout = setTimeout(() => {
    taskFormCustomerSearchQueryDebounced.value = newValue
  }, 400) // 400ms debounce for better performance (prioritize avoiding lag over speed)
})

const taskFormFilteredUsers = computed(() => {
  if (!taskFormAssigneeSearchQueryDebounced.value.trim()) {
    return taskFormUsers.value.slice(0, 50) // Limit to 50 users when no search
  }
  const query = taskFormAssigneeSearchQueryDebounced.value.toLowerCase()
  const filtered = taskFormUsers.value.filter((user) =>
    user.full_name.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query)
  )
  return filtered.slice(0, 100) // Limit to 100 results
})

const taskFormFilteredCustomers = computed(() => {
  // Only show results when there's a search query (minimum 2 characters)
  if (!taskFormCustomerSearchQueryDebounced.value.trim() || taskFormCustomerSearchQueryDebounced.value.trim().length < 2) {
    return []
  }
  const query = taskFormCustomerSearchQueryDebounced.value.toLowerCase()
  const filtered = taskFormCustomers.value.filter((customer) =>
    customer.full_name.toLowerCase().includes(query) ||
    customer.email.toLowerCase().includes(query) ||
    customer.customer_id.toLowerCase().includes(query)
  )
  return filtered.slice(0, 100) // Limit to 100 results for performance
})

const isTaskFormAssigneeSelected = (userId: number): boolean => {
  return taskForm.selectedAssigneeIds.includes(userId)
}

const toggleTaskFormAssignee = (userId: number) => {
  const index = taskForm.selectedAssigneeIds.indexOf(userId)
  if (index > -1) {
    taskForm.selectedAssigneeIds.splice(index, 1)
  } else {
    taskForm.selectedAssigneeIds.push(userId)
  }
}

const getTaskFormAssigneeName = (userId: number): string => {
  const user = taskFormUsers.value.find((u) => u.id === userId)
  return user ? user.full_name : `User #${userId}`
}

const isTaskFormCustomerSelected = (customerId: number | string): boolean => {
  const id = typeof customerId === 'string' ? Number(customerId) : customerId
  return taskForm.selectedCustomerIds.includes(id)
}

const toggleTaskFormCustomer = (customerId: number | string) => {
  const id = typeof customerId === 'string' ? Number(customerId) : customerId
  const index = taskForm.selectedCustomerIds.indexOf(id)
  if (index > -1) {
    taskForm.selectedCustomerIds.splice(index, 1)
  } else {
    taskForm.selectedCustomerIds.push(id)
  }
}

const getTaskFormCustomerName = (customerId: number): string => {
  const customer = taskFormCustomers.value.find((c) => {
    const id = typeof c.id === 'string' ? Number(c.id) : c.id
    return id === customerId
  })
  return customer ? `${customer.full_name} (${customer.customer_id})` : `Customer #${customerId}`
}

const openCreateTaskModal = () => {
  editingTask.value = null
  Object.assign(taskForm, {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    deadline: null,
    attachments: [],
    selectedAssigneeIds: [],
    selectedCustomerIds: [],
  })
  taskFileError.value = null
  taskFormAssigneeSearchQuery.value = ''
  taskFormAssigneeSearchQueryDebounced.value = ''
  taskFormCustomerSearchQuery.value = ''
  taskFormCustomerSearchQueryDebounced.value = ''
  
  // Open modal immediately
  isTaskModalOpen.value = true
  
  // Load users in background (non-blocking) - only if modal is opened
  if (taskFormUsers.value.length === 0) {
    taskFormUsersLoading.value = true
    fetchUsers()
      .then((users) => {
        taskFormUsers.value = users
      })
      .catch((error: any) => {
        console.error('[Tasks] Error loading users:', error)
      })
      .finally(() => {
        taskFormUsersLoading.value = false
      })
  }
  
  // Load customers from cache or fetch in background (non-blocking)
  const cached = getCachedCustomers()
  if (cached && cached.length > 0) {
    taskFormCustomers.value = cached
  } else if (taskFormCustomers.value.length === 0) {
    // Start loading in background, don't block modal
    taskFormCustomersLoading.value = true
    fetchCustomers()
      .then((customers) => {
        taskFormCustomers.value = customers
      })
      .catch((error: any) => {
        console.error('[Tasks] Error loading customers:', error)
      })
      .finally(() => {
        taskFormCustomersLoading.value = false
      })
  }
}

const openTaskFormAssigneesModal = () => {
  taskFormAssigneeSearchQuery.value = ''
  taskFormAssigneeSearchQueryDebounced.value = ''
  isTaskFormAssigneesModalOpen.value = true
  
  // Load users if not already loaded
  if (taskFormUsers.value.length === 0) {
    taskFormUsersLoading.value = true
    fetchUsers()
      .then((users) => {
        taskFormUsers.value = users
      })
      .catch((error: any) => {
        console.error('[Tasks] Error loading users:', error)
      })
      .finally(() => {
        taskFormUsersLoading.value = false
      })
  }
}

const openTaskFormCustomersModal = () => {
  taskFormCustomerSearchQuery.value = ''
  taskFormCustomerSearchQueryDebounced.value = ''
  isTaskFormCustomersModalOpen.value = true
  
  // Load customers from cache or fetch in background
  const cached = getCachedCustomers()
  if (cached && cached.length > 0) {
    taskFormCustomers.value = cached
  } else if (taskFormCustomers.value.length === 0) {
    taskFormCustomersLoading.value = true
    fetchCustomers()
      .then((customers) => {
        taskFormCustomers.value = customers
      })
      .catch((error: any) => {
        console.error('[Tasks] Error loading customers:', error)
      })
      .finally(() => {
        taskFormCustomersLoading.value = false
      })
  }
}

const openEditTaskModal = () => {
  if (!selectedTask.value) return
  editingTask.value = selectedTask.value
  Object.assign(taskForm, {
    title: selectedTask.value.title,
    description: selectedTask.value.description || '',
    priority: selectedTask.value.priority || 'medium',
    status: selectedTask.value.status || 'todo',
    deadline: selectedTask.value.deadline || null,
    attachments: [],
    selectedAssigneeIds: selectedTask.value.assignees?.map((a) => a.user_id) || [],
    selectedCustomerIds: selectedTask.value.customers?.map((c) => c.customer_id) || [],
  })
  taskFileError.value = null
  taskFormAssigneeSearchQuery.value = ''
  taskFormAssigneeSearchQueryDebounced.value = ''
  taskFormCustomerSearchQuery.value = ''
  taskFormCustomerSearchQueryDebounced.value = ''
  
  // Close detail modal and open edit modal immediately
  isTaskDetailModalOpen.value = false
  isTaskModalOpen.value = true
  
  // Load users in background (non-blocking)
  if (taskFormUsers.value.length === 0) {
    taskFormUsersLoading.value = true
    fetchUsers()
      .then((users) => {
        taskFormUsers.value = users
      })
      .catch((error: any) => {
        console.error('[Tasks] Error loading users:', error)
      })
      .finally(() => {
        taskFormUsersLoading.value = false
      })
  }
  
  // Load customers from cache or fetch in background (non-blocking)
  const cached = getCachedCustomers()
  if (cached && cached.length > 0) {
    taskFormCustomers.value = cached
  } else if (taskFormCustomers.value.length === 0) {
    // Start loading in background, don't block modal
    taskFormCustomersLoading.value = true
    fetchCustomers()
      .then((customers) => {
        taskFormCustomers.value = customers
      })
      .catch((error: any) => {
        console.error('[Tasks] Error loading customers:', error)
      })
      .finally(() => {
        taskFormCustomersLoading.value = false
      })
  }
}

const handleSubmitTask = async () => {
  if (!taskForm.title.trim()) return

  try {
    submitting.value = true
    taskFileError.value = null

    // Prepare task data
    const { attachments, selectedAssigneeIds, selectedCustomerIds, ...taskData } = taskForm
    
    // Add assignees and customers to task data
    const taskPayload: CreateTaskDto = {
      ...taskData,
      assignee_user_ids: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
      customer_ids: selectedCustomerIds.length > 0 ? selectedCustomerIds : undefined,
    }

    let createdTaskId: number | null = null

    if (editingTask.value?.id) {
      await updateTask(editingTask.value.id, taskData)
      createdTaskId = editingTask.value.id
      
      // Update assignees and customers for existing task
      if (createdTaskId) {
        const currentAssigneeIds = editingTask.value.assignees?.map((a) => a.user_id) || []
        const currentCustomerIds = editingTask.value.customers?.map((c) => c.customer_id) || []
        
        const assigneesToAdd = selectedAssigneeIds.filter((id) => !currentAssigneeIds.includes(id))
        const assigneesToRemove = currentAssigneeIds.filter((id) => !selectedAssigneeIds.includes(id))
        const customersToAdd = selectedCustomerIds.filter((id) => !currentCustomerIds.includes(id))
        const customersToRemove = currentCustomerIds.filter((id) => !selectedCustomerIds.includes(id))
        
        if (assigneesToAdd.length > 0) {
          await addAssignees(createdTaskId, assigneesToAdd)
        }
        if (assigneesToRemove.length > 0) {
          await removeAssignees(createdTaskId, assigneesToRemove)
        }
        if (customersToAdd.length > 0) {
          await addCustomers(createdTaskId, customersToAdd)
        }
        if (customersToRemove.length > 0) {
          await removeCustomers(createdTaskId, customersToRemove)
        }
      }
      
      toast.add({
        title: 'Task updated',
        description: 'Task has been updated successfully.',
        color: 'primary',
      })
    } else {
      // Create task with files if any
      const newTask = await createTask(taskPayload, attachments.length > 0 ? attachments : undefined)
      createdTaskId = newTask.id || null
      
      if (attachments.length > 0) {
        toast.add({
          title: 'Task created',
          description: `Task has been created successfully with ${attachments.length} file(s).`,
          color: 'primary',
        })
      } else {
        toast.add({
          title: 'Task created',
          description: 'Task has been created successfully.',
          color: 'primary',
        })
      }
    }

    isTaskModalOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to save task',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const handleTaskFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    input.value = ''
    taskFileError.value = null
    return
  }

  const existing = taskForm.attachments.slice()
  const incoming = Array.from(input.files)
  const combined = existing.concat(incoming)

  if (combined.length > 10) {
    taskFileError.value = 'You can upload up to 10 files only.'
    input.value = ''
    return
  }

  for (const file of incoming) {
    if (file.size > 20 * 1024 * 1024) {
      taskFileError.value = `"${file.name}" exceeds the 20MB limit.`
      input.value = ''
      return
    }
  }

  taskFileError.value = null
  taskForm.attachments = combined
  input.value = ''
}

const removeTaskFile = (index: number) => {
  taskForm.attachments.splice(index, 1)
  if (!taskForm.attachments.length) {
    taskFileError.value = null
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const uploadTaskFiles = async (taskId: number, files: File[]): Promise<void> => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'
  const auth = useAuth()

  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const getAuthHeaders = (): Record<string, string> => {
    const raw = auth?.getAuthHeaders?.() ?? {}
    return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string' && value.length > 0) {
        acc[key] = value
      }
      return acc
    }, {})
  }

  const response = await $fetch<{ success: boolean; message?: string }>(
    `${apiBaseUrl}/tasks/${taskId}/files`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    }
  )

  if (!response.success) {
    throw new Error(response.message || 'Failed to upload files')
  }
}

// Task Detail Modal
const isTaskDetailModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)
const selectedTaskFiles = ref<Array<{ id?: number; url: string; file_name?: string | null; file_size?: number | null }>>([])
const taskComments = ref<TaskComment[]>([])
const newCommentContent = ref('')
const newCommentFiles = ref<File[]>([])
const commentFileError = ref<string | null>(null)
const addingComment = ref(false)

// Image Viewer
const {
  attachmentGalleryRef,
  isViewerActive,
  isImageAttachment: isImageViewerImage,
  openViewer,
} = useImageViewer()

// Sort comments from newest to oldest
const sortedTaskComments = computed(() => {
  return [...taskComments.value].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
    return dateB - dateA // Newest first
  })
})

// Check if file is an image (for both comment and task files)
const isCommentImageFile = (file: CommentFile): boolean => {
  if (!file || !file.url) return false
  const url = file.url.toLowerCase()
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']
  return imageExtensions.some((ext) => url.includes(ext))
}

const isTaskImageFile = (file: { url: string; file_name?: string | null }): boolean => {
  if (!file || !file.url) return false
  const url = file.url.toLowerCase()
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']
  return imageExtensions.some((ext) => url.includes(ext))
}

// Open image viewer for comment files
const openCommentImageViewer = async (comment: TaskComment, targetFile: CommentFile) => {
  if (!comment.files || comment.files.length === 0) return
  
  // Filter only image files
  const imageFiles = comment.files.filter(isCommentImageFile)
  if (imageFiles.length === 0) return
  
  // Convert to format expected by viewer
  const images = imageFiles.map((file) => ({
    id: file.id,
    file_url: file.url,
    file_name: file.file_name || 'Image attachment',
  }))
  
  const targetImage = {
    id: targetFile.id,
    file_url: targetFile.url,
    file_name: targetFile.file_name || 'Image attachment',
  }
  
  await openViewer(images, targetImage, attachmentGalleryRef.value)
}

// Open image viewer for task files
const openTaskFileImageViewer = async (targetFile: { id?: number; url: string; file_name?: string | null }) => {
  if (!selectedTaskFiles.value || selectedTaskFiles.value.length === 0) return
  
  // Filter only image files
  const imageFiles = selectedTaskFiles.value.filter(isTaskImageFile)
  if (imageFiles.length === 0) return
  
  // Convert to format expected by viewer
  const images = imageFiles.map((file) => ({
    id: file.id,
    file_url: file.url,
    file_name: file.file_name || 'Image attachment',
  }))
  
  const targetImage = {
    id: targetFile.id,
    file_url: targetFile.url,
    file_name: targetFile.file_name || 'Image attachment',
  }
  
  await openViewer(images, targetImage, attachmentGalleryRef.value)
}

const openTaskDetailModal = async (task: Task) => {
  selectedTask.value = task
  isTaskDetailModalOpen.value = true
  newCommentContent.value = ''
  newCommentFiles.value = []
  commentFileError.value = null
  
  // Fetch task details with comments and files
  try {
    const taskDetail = await fetchTaskById(task.id!)
    selectedTask.value = taskDetail as Task
    taskComments.value = taskDetail.comments || []
    // Extract files from task detail (if available)
    selectedTaskFiles.value = (taskDetail as any).files || []
    
    // Debug: Log to check files
    console.log('[Tasks] Task detail loaded:', {
      taskId: task.id,
      commentsCount: taskComments.value.length,
      commentsWithFiles: taskComments.value.filter(c => c.files && c.files.length > 0).length,
      taskFilesCount: selectedTaskFiles.value.length,
      comments: taskComments.value.map(c => ({
        id: c.id,
        content: c.content,
        filesCount: c.files?.length || 0,
        files: c.files
      }))
    })
  } catch (error: any) {
    console.error('[Tasks] Error fetching task details:', error)
  }
}

const handleStatusChange = async (newStatus: string) => {
  if (!selectedTask.value?.id) return

  try {
    await updateTask(selectedTask.value.id, { status: newStatus as any })
    toast.add({
      title: 'Status updated',
      description: 'Task status has been updated.',
      color: 'primary',
    })
    await refresh()
    const updatedTask = tasks.value?.find((t) => t.id === selectedTask.value?.id)
    if (updatedTask) {
      selectedTask.value = updatedTask
    }
  } catch (error: any) {
    toast.add({
      title: 'Failed to update status',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

const handleArchiveTask = async () => {
  if (!selectedTask.value?.id) return

  if (!confirm('Are you sure you want to archive this task?')) return

  try {
    await archiveTask(selectedTask.value.id)
    toast.add({
      title: 'Task archived',
      description: 'Task has been archived successfully.',
      color: 'primary',
    })
    isTaskDetailModalOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to archive task',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

// Comments
const handleCommentFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    input.value = ''
    commentFileError.value = null
    return
  }

  const existing = newCommentFiles.value.slice()
  const incoming = Array.from(input.files)
  const combined = existing.concat(incoming)

  if (combined.length > 10) {
    commentFileError.value = 'You can upload up to 10 files only.'
    input.value = ''
    return
  }

  for (const file of incoming) {
    if (file.size > 20 * 1024 * 1024) {
      commentFileError.value = `"${file.name}" exceeds the 20MB limit.`
      input.value = ''
      return
    }
  }

  commentFileError.value = null
  newCommentFiles.value = combined
  input.value = ''
}

const removeCommentFile = (index: number) => {
  newCommentFiles.value.splice(index, 1)
  if (!newCommentFiles.value.length) {
    commentFileError.value = null
  }
}

const handleAddComment = async () => {
  if (!selectedTask.value?.id || (!newCommentContent.value.trim() && newCommentFiles.value.length === 0)) return

  try {
    addingComment.value = true
    commentFileError.value = null
    
    await addComment(
      selectedTask.value.id,
      newCommentContent.value.trim() || '',
      newCommentFiles.value.length > 0 ? newCommentFiles.value : undefined
    )
    
    toast.add({
      title: 'Comment added',
      description: 'Comment has been added successfully.',
      color: 'primary',
    })
    
    newCommentContent.value = ''
    newCommentFiles.value = []
    
    // Refresh comments (will be sorted by computed property)
    taskComments.value = await fetchComments(selectedTask.value.id)
    // Refresh task to update comments_count and files
    const taskDetail = await fetchTaskById(selectedTask.value.id)
    selectedTask.value = taskDetail as Task
    selectedTaskFiles.value = (taskDetail as any).files || []
  } catch (error: any) {
    toast.add({
      title: 'Failed to add comment',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    addingComment.value = false
  }
}

const handleDeleteComment = async (commentId: number) => {
  if (!confirm('Are you sure you want to delete this comment?')) return

  try {
    await deleteComment(commentId)
    toast.add({
      title: 'Comment deleted',
      description: 'Comment has been deleted successfully.',
      color: 'primary',
    })
    // Refresh comments
    if (selectedTask.value?.id) {
      taskComments.value = await fetchComments(selectedTask.value.id)
      // Refresh task to update comments_count and files
      const taskDetail = await fetchTaskById(selectedTask.value.id)
      selectedTask.value = taskDetail as Task
      selectedTaskFiles.value = (taskDetail as any).files || []
    }
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete comment',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

// Assignees
const isAssigneesModalOpen = ref(false)
const usersLoading = ref(false)
const users = ref<UserWithSalesInfo[]>([])
const assigneeSearchQuery = ref('')
const selectedAssigneeIds = ref<number[]>([])
const savingAssignees = ref(false)

const filteredUsers = computed(() => {
  if (!assigneeSearchQuery.value.trim()) {
    return users.value
  }
  const query = assigneeSearchQuery.value.toLowerCase()
  return users.value.filter((user) =>
    user.full_name.toLowerCase().includes(query) ||
    user.username.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query)
  )
})

const isAssigneeSelected = (userId: number): boolean => {
  return selectedAssigneeIds.value.includes(userId)
}

const toggleAssignee = (userId: number) => {
  const index = selectedAssigneeIds.value.indexOf(userId)
  if (index > -1) {
    selectedAssigneeIds.value.splice(index, 1)
  } else {
    selectedAssigneeIds.value.push(userId)
  }
}

const openAssigneesModal = async () => {
  isAssigneesModalOpen.value = true
  assigneeSearchQuery.value = ''
  
  // Initialize selected assignees from current task
  if (selectedTask.value?.assignees) {
    selectedAssigneeIds.value = selectedTask.value.assignees.map((a) => a.user_id)
  } else {
    selectedAssigneeIds.value = []
  }

  // Fetch users if not already loaded
  if (users.value.length === 0) {
    usersLoading.value = true
    try {
      users.value = await fetchUsers()
    } catch (error: any) {
      toast.add({
        title: 'Failed to load users',
        description: error?.message || 'Unknown error',
        color: 'error',
      })
    } finally {
      usersLoading.value = false
    }
  }
}

const handleSaveAssignees = async () => {
  if (!selectedTask.value?.id) return

  try {
    savingAssignees.value = true

    // Get current assignee IDs
    const currentAssigneeIds = selectedTask.value.assignees?.map((a) => a.user_id) || []
    
    // Find IDs to add and remove
    const toAdd = selectedAssigneeIds.value.filter((id) => !currentAssigneeIds.includes(id))
    const toRemove = currentAssigneeIds.filter((id) => !selectedAssigneeIds.value.includes(id))

    // Add new assignees
    if (toAdd.length > 0) {
      await addAssignees(selectedTask.value.id, toAdd)
    }

    // Remove assignees
    if (toRemove.length > 0) {
      await removeAssignees(selectedTask.value.id, toRemove)
    }

    toast.add({
      title: 'Assignees updated',
      description: 'Task assignees have been updated successfully.',
      color: 'primary',
    })

    isAssigneesModalOpen.value = false
    await refresh()
    
    // Refresh task detail
    const taskDetail = await fetchTaskById(selectedTask.value.id)
    selectedTask.value = taskDetail as Task
  } catch (error: any) {
    toast.add({
      title: 'Failed to update assignees',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    savingAssignees.value = false
  }
}

const handleRemoveAssignee = async (userId: number) => {
  if (!selectedTask.value?.id) return

  try {
    await removeAssignees(selectedTask.value.id, [userId])
    toast.add({
      title: 'Assignee removed',
      description: 'Assignee has been removed successfully.',
      color: 'primary',
    })
    await refresh()
    const taskDetail = await fetchTaskById(selectedTask.value.id)
    selectedTask.value = taskDetail as Task
  } catch (error: any) {
    toast.add({
      title: 'Failed to remove assignee',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

// Customers
const isCustomersModalOpen = ref(false)
const customersLoading = ref(false)
const customers = ref<Customer[]>([])
const customerSearchQuery = ref('')
const customerSearchQueryDebounced = ref('')
const selectedCustomerIds = ref<number[]>([])
const savingCustomers = ref(false)

// Debounce search query to avoid lag when typing
let customersModalSearchTimeout: ReturnType<typeof setTimeout> | null = null
watch(customerSearchQuery, (newValue) => {
  if (customersModalSearchTimeout) {
    clearTimeout(customersModalSearchTimeout)
  }
  customersModalSearchTimeout = setTimeout(() => {
    customerSearchQueryDebounced.value = newValue
  }, 400) // 400ms debounce for better performance (prioritize avoiding lag over speed)
})

const filteredCustomers = computed(() => {
  // Only show results when there's a search query (minimum 2 characters)
  if (!customerSearchQueryDebounced.value.trim() || customerSearchQueryDebounced.value.trim().length < 2) {
    return []
  }
  const query = customerSearchQueryDebounced.value.toLowerCase()
  const filtered = customers.value.filter((customer) =>
    customer.full_name.toLowerCase().includes(query) ||
    customer.email.toLowerCase().includes(query) ||
    customer.customer_id.toLowerCase().includes(query)
  )
  // Limit results to 50 to avoid lag when rendering
  return filtered.slice(0, 50)
})

const isCustomerSelected = (customerId: number | string): boolean => {
  const id = typeof customerId === 'string' ? Number(customerId) : customerId
  return selectedCustomerIds.value.includes(id)
}

const toggleCustomer = (customerId: number | string) => {
  const id = typeof customerId === 'string' ? Number(customerId) : customerId
  const index = selectedCustomerIds.value.indexOf(id)
  if (index > -1) {
    selectedCustomerIds.value.splice(index, 1)
  } else {
    selectedCustomerIds.value.push(id)
  }
}

const getCustomerName = (customerId: number): string => {
  const customer = customers.value.find((c) => {
    const id = typeof c.id === 'string' ? Number(c.id) : c.id
    return id === customerId
  })
  return customer ? `${customer.full_name} (${customer.customer_id})` : `Customer #${customerId}`
}

const openCustomersModal = async () => {
  isCustomersModalOpen.value = true
  customerSearchQuery.value = ''
  customerSearchQueryDebounced.value = ''
  
  // Initialize selected customers from current task
  if (selectedTask.value?.customers) {
    selectedCustomerIds.value = selectedTask.value.customers.map((c) => c.customer_id)
  } else {
    selectedCustomerIds.value = []
  }

  // Fetch customers if not already loaded
  if (customers.value.length === 0) {
    customersLoading.value = true
    try {
      const cached = getCachedCustomers()
      if (cached && cached.length > 0) {
        customers.value = cached
      } else {
        customers.value = await fetchCustomers()
      }
    } catch (error: any) {
      toast.add({
        title: 'Failed to load customers',
        description: error?.message || 'Unknown error',
        color: 'error',
      })
    } finally {
      customersLoading.value = false
    }
  }
}

const handleSaveCustomers = async () => {
  if (!selectedTask.value?.id) return

  try {
    savingCustomers.value = true

    // Get current customer IDs
    const currentCustomerIds = selectedTask.value.customers?.map((c) => c.customer_id) || []
    
    // Find IDs to add and remove
    const toAdd = selectedCustomerIds.value.filter((id) => !currentCustomerIds.includes(id))
    const toRemove = currentCustomerIds.filter((id) => !selectedCustomerIds.value.includes(id))

    // Add new customers
    if (toAdd.length > 0) {
      await addCustomers(selectedTask.value.id, toAdd)
    }

    // Remove customers
    if (toRemove.length > 0) {
      await removeCustomers(selectedTask.value.id, toRemove)
    }

    toast.add({
      title: 'Customers updated',
      description: 'Task customers have been updated successfully.',
      color: 'primary',
    })

    isCustomersModalOpen.value = false
    await refresh()
    
    // Refresh task detail
    const taskDetail = await fetchTaskById(selectedTask.value.id)
    selectedTask.value = taskDetail as Task
  } catch (error: any) {
    toast.add({
      title: 'Failed to update customers',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    savingCustomers.value = false
  }
}

const handleRemoveCustomer = async (customerId: number) => {
  if (!selectedTask.value?.id) return

  try {
    await removeCustomers(selectedTask.value.id, [customerId])
    toast.add({
      title: 'Customer removed',
      description: 'Customer has been removed successfully.',
      color: 'primary',
    })
    await refresh()
    const taskDetail = await fetchTaskById(selectedTask.value.id)
    selectedTask.value = taskDetail as Task
  } catch (error: any) {
    toast.add({
      title: 'Failed to remove customer',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  }
}

// Drag state
const isDragging = ref(false)
const draggedTaskId = ref<number | null>(null)

// Drag and Drop with vue-draggable-plus
const handleDragStart = (evt: any) => {
  isDragging.value = true
  const taskId = evt.item?.dataset?.taskId || evt.item?.getAttribute?.('data-task-id')
  if (taskId) {
    draggedTaskId.value = Number(taskId)
  }
}

const handleDragMove = (evt: any) => {
  // Tối ưu: chỉ detect và highlight 1 cột phù hợp nhất
  const { related, to, dragged } = evt
  
  // Remove drag-over từ tất cả columns trước (quan trọng để tránh highlight nhiều cột)
  const allColumns = document.querySelectorAll('.kanban-column') as NodeListOf<HTMLElement>
  allColumns.forEach((col) => {
    col.classList.remove('drag-over')
  })
  
  // Tìm column đang được hover - ưu tiên related.element (element đang được hover)
  let targetColumn: HTMLElement | null = null
  
  // Ưu tiên 1: Tìm từ related.element (element đang được hover trực tiếp)
  if (related && related.element) {
    const closest = related.element.closest?.('.kanban-column') as HTMLElement
    if (closest) {
      targetColumn = closest
    }
  }
  
  // Ưu tiên 2: Tìm từ to element (container đích)
  if (!targetColumn && to) {
    const closest = to.closest?.('.kanban-column') as HTMLElement
    if (closest) {
      targetColumn = closest
    }
  }
  
  // Ưu tiên 3: Dùng mouse position để tìm column gần nhất (fallback)
  if (!targetColumn && dragged) {
    const mouseEvent = evt.originalEvent || evt
    if (mouseEvent && mouseEvent.clientX !== undefined && mouseEvent.clientY !== undefined) {
      let closestColumn: HTMLElement | null = null
      let minDistance = Infinity
      
      allColumns.forEach((col) => {
        const rect = col.getBoundingClientRect()
        
        // Kiểm tra xem mouse có nằm trong bounds của column không (mở rộng 80px mỗi phía)
        const isInBounds = (
          mouseEvent.clientX >= rect.left - 80 &&
          mouseEvent.clientX <= rect.right + 80 &&
          mouseEvent.clientY >= rect.top - 40 &&
          mouseEvent.clientY <= rect.bottom + 40
        )
        
        if (isInBounds) {
          // Tính khoảng cách từ mouse đến center của column
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2
          const distance = Math.sqrt(
            Math.pow(mouseEvent.clientX - centerX, 2) + 
            Math.pow(mouseEvent.clientY - centerY, 2)
          )
          
          // Chọn column có khoảng cách nhỏ nhất
          if (distance < minDistance) {
            minDistance = distance
            closestColumn = col
          }
        }
      })
      
      if (closestColumn) {
        targetColumn = closestColumn
      }
    }
  }
  
  // Chỉ add drag-over cho 1 column duy nhất (đảm bảo chỉ 1 cột được highlight)
  if (targetColumn) {
    targetColumn.classList.add('drag-over')
  }
}

// handleDragChange không cần thiết - đã xóa

const handleDragEnd = async (evt: any, sourceStatus: string) => {
  isDragging.value = false
  draggedTaskId.value = null
  
  // Remove drag-over class from all columns
  document.querySelectorAll('.kanban-column.drag-over').forEach((col) => {
    col.classList.remove('drag-over')
  })
  
  const { item, to, from } = evt
  
  const taskId = item?.dataset?.taskId || item?.getAttribute?.('data-task-id')
  
  if (!taskId) {
    console.error('[Tasks] No task ID found in dragged element')
    return
  }

  const task = tasks.value?.find((t) => t.id === Number(taskId))
  if (!task || !task.id) {
    console.error('[Tasks] Task not found:', taskId)
    return
  }

  const targetColumn = to?.closest?.('[data-status]') as HTMLElement
  const targetStatus = targetColumn?.dataset?.status

  if (!targetStatus || task.status === targetStatus) {
    // No change, just return
    return
  }

  // Set flag to prevent watch from updating during drag
  isUpdatingFromDrag.value = true

  // VueDraggable has already updated the v-model arrays automatically
  // We just need to update the task status in the main tasks array
  const updatedTask = { ...task, status: targetStatus as any }
  
  // Update in main tasks array
  const taskIndex = tasks.value?.findIndex((t) => t.id === task.id)
  if (taskIndex !== undefined && taskIndex >= 0 && tasks.value) {
    tasks.value[taskIndex] = updatedTask
  }

  // Also update the task in the target column array to ensure status is correct
  // (VueDraggable may have moved it but status might not be updated)
  switch (targetStatus) {
    case 'todo': {
      const taskInArray = tasksTodo.value.find((t) => t.id === task.id)
      if (taskInArray) {
        taskInArray.status = targetStatus as any
      }
      break
    }
    case 'in_progress': {
      const taskInArray = tasksInProgress.value.find((t) => t.id === task.id)
      if (taskInArray) {
        taskInArray.status = targetStatus as any
      }
      break
    }
    case 'review': {
      const taskInArray = tasksReview.value.find((t) => t.id === task.id)
      if (taskInArray) {
        taskInArray.status = targetStatus as any
      }
      break
    }
    case 'done': {
      const taskInArray = tasksDone.value.find((t) => t.id === task.id)
      if (taskInArray) {
        taskInArray.status = targetStatus as any
      }
      break
    }
  }

  // Reset flag after DOM update
  await nextTick()
  isUpdatingFromDrag.value = false

  // Update on server in background (no await to avoid blocking UI)
  updateTask(task.id, { status: targetStatus as any })
    .then(() => {
      // Success - optionally show subtle notification
      console.log('[Tasks] Task status updated successfully on server')
    })
    .catch(async (error: any) => {
      // Revert on error
      console.error('[Tasks] Failed to update task status on server:', error)
      
      // Revert local state
      isUpdatingFromDrag.value = true
      
      // VueDraggable has already moved the task, we need to move it back
      // Remove from target column
      switch (targetStatus) {
        case 'todo':
          tasksTodo.value = tasksTodo.value.filter((t) => t.id !== task.id)
          break
        case 'in_progress':
          tasksInProgress.value = tasksInProgress.value.filter((t) => t.id !== task.id)
          break
        case 'review':
          tasksReview.value = tasksReview.value.filter((t) => t.id !== task.id)
          break
        case 'done':
          tasksDone.value = tasksDone.value.filter((t) => t.id !== task.id)
          break
      }

      // Add back to source column
      switch (sourceStatus) {
        case 'todo':
          tasksTodo.value.push(task)
          break
        case 'in_progress':
          tasksInProgress.value.push(task)
          break
        case 'review':
          tasksReview.value.push(task)
          break
        case 'done':
          tasksDone.value.push(task)
          break
      }

      // Revert in main tasks array
      if (taskIndex !== undefined && taskIndex >= 0 && tasks.value) {
        tasks.value[taskIndex] = task
      }

      await nextTick()
      isUpdatingFromDrag.value = false

      toast.add({
        title: 'Failed to update task',
        description: error?.message || 'Task has been reverted to original position.',
        color: 'error',
      })
    })
}

// Format helpers
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

.task-file-upload {
  transition: all 0.2s ease;
}

.task-file-upload:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Drag & Drop Animations - Simplified for smoothness */
/* Task item wrapper - full width cho drag detection và hiển thị */
.task-item-wrapper {
  margin: 0;
  padding: 0;
  margin-bottom: 16px; /* Khoảng cách giữa các task items */
  width: 100%; /* Full width - task items hiển thị 100% */
  position: relative;
  transition: opacity 0.15s ease; /* Giảm thời gian transition để mượt hơn */
  will-change: opacity;
  cursor: move; /* Thêm cursor move như code mẫu */
  user-select: none; /* Ngăn text selection khi drag */
}

.task-item-wrapper:last-child {
  margin-bottom: 0; /* Không có margin cho item cuối cùng */
}

/* Task Card Professional Styling */
.task-card {
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.task-card:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.task-ghost {
  opacity: 0.3 !important;
  background: #f9fafb !important;
  border: 1px dashed #d1d5db !important;
  border-radius: 0.5rem !important;
  pointer-events: none;
  /* Loại bỏ transition để tăng performance */
}

.task-chosen {
  cursor: grabbing !important;
  opacity: 0.9;
  /* Loại bỏ transition để tăng performance */
}

.task-dragging {
  opacity: 0.85 !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  z-index: 1000 !important;
  cursor: grabbing !important;
  border-color: #3b82f6 !important;
  /* Tối ưu performance - loại bỏ transition và transform phức tạp */
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0); /* Force GPU acceleration */
}

/* Loại bỏ transition cho items để tăng performance - VueDraggable sẽ xử lý animation */

/* Improve drag handle cursor */
.task-item-wrapper:hover {
  cursor: grab;
}

.task-item-wrapper:active {
  cursor: grabbing;
}

/* Column drop zone highlight when dragging - full container highlight */
.kanban-column.drag-over {
  position: relative;
  border-color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  /* Vùng nhận diện là full container */
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Vùng nhận diện full container khi drag over */
.kanban-column.drag-over .tasks-drop-zone {
  min-height: 350px;
  position: relative;
  /* Vùng nhận diện là full container, không chỉ border */
  background-color: rgba(59, 130, 246, 0.02);
  border-radius: 0.375rem;
}

/* Removed pulse animation for simplicity and smoothness */

/* Column wrapper - full height container */
.kanban-column-wrapper {
  height: 100%;
  max-height: calc(100vh - 120px); /* Full viewport height minus header/footer space */
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

/* Optimize for smooth scrolling during drag */
.kanban-column {
  overflow: hidden; /* Chỉ ẩn overflow, scroll sẽ ở tasks-drop-zone */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  position: relative;
  transition: border-color 0.15s ease;
  flex: 1; /* Chiếm toàn bộ không gian còn lại sau header */
  min-height: 0; /* Quan trọng để flex hoạt động đúng */
  display: flex;
  flex-direction: column;
  /* Mở rộng vùng nhận diện invisible để detect sớm hơn */
}

/* Tăng vùng nhận diện invisible cho column - detect sớm hơn khi kéo đến gần */
.kanban-column::before {
  content: '';
  position: absolute;
  top: -60px;
  left: -60px;
  right: -60px;
  bottom: -60px;
  pointer-events: auto; /* Cho phép detect events */
  z-index: 0;
  background: transparent;
}

/* Khi drag, vùng nhận diện còn lớn hơn nữa */
.kanban-column.drag-over::before {
  top: -100px;
  left: -100px;
  right: -100px;
  bottom: -100px;
}

.kanban-column:hover {
  border-color: #d1d5db;
}

/* Drop zone MAX width - vùng nhận diện mở rộng để detect sớm hơn */
.tasks-drop-zone {
  position: relative;
  padding: 30px; /* Tăng padding để mở rộng vùng nhận diện */
  margin: -30px; /* Offset padding để không ảnh hưởng layout */
  min-height: 0; /* Cho phép flex shrink */
  width: calc(100% + 60px); /* Mở rộng ra ngoài 30px mỗi bên để dễ nhận diện */
  box-sizing: border-box;
  flex: 1; /* Chiếm toàn bộ không gian còn lại */
  overflow-y: auto;
  overflow-x: hidden;
  /* Vùng nhận diện mở rộng để detect sớm hơn khi kéo đến gần */
}

/* Visual drop zone indicators - aligned with parent */
.tasks-drop-zone::before,
.tasks-drop-zone::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
  border-radius: 2px;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 10;
}

.tasks-drop-zone::before {
  top: -2px;
}

.tasks-drop-zone::after {
  bottom: -2px;
}

/* Show drop zone when dragging - full container highlight */
.kanban-column.drag-over .tasks-drop-zone::before,
.kanban-column.drag-over .tasks-drop-zone::after {
  /* Không dùng border lines, dùng full container background */
  display: none;
}

/* Vùng nhận diện full container - không dùng border dashed */

/* Empty state drop zone */
.tasks-drop-zone:empty,
.tasks-drop-zone:has(> .text-xs) {
  padding: 0;
  margin: 0;
  min-height: 250px;
}

.kanban-column.drag-over .tasks-drop-zone:empty,
.kanban-column.drag-over .tasks-drop-zone:has(> .text-xs) {
  padding: 0;
  margin: 0;
  min-height: 350px;
  border: 2px dashed rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.05);
}
</style>
