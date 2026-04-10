<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Customer Care</h1>
        <p class="text-sm text-gray-500 mt-1">Monitor and record customer care activities</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">Assigned Customers</p>
            <p class="text-3xl font-bold text-emerald-600">{{ assignedCount }}</p>
            <p class="text-xs text-gray-500">
              {{ assignedPercentage }}% of {{ totalCustomers }} total customers
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
            <UIcon name="i-heroicons-user-circle" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">Upcoming Follow-ups</p>
            <p class="text-3xl font-bold text-amber-600">{{ upcomingFollowUps }}</p>
            <p class="text-xs text-gray-500">Within the next 7 days</p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
            <UIcon name="i-heroicons-calendar-days" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">Interactions This Week</p>
            <p class="text-3xl font-bold text-blue-600">{{ interactionsThisWeek }}</p>
            <p class="text-xs text-gray-500">Recorded customer care activities</p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <UIcon name="i-heroicons-phone-arrow-up-right" class="w-6 h-6" />
          </div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col md:flex-row md:items-center gap-3">
            <UInput
              v-model="searchQuery"
              placeholder="Search customers..."
              icon="i-heroicons-magnifying-glass"
              class="w-full md:w-80"
              @keyup.enter="applySearch"
            />
            <p class="text-sm text-gray-500">
              Showing <span class="font-semibold text-gray-900">{{ filteredEntries.length }}</span> assigned customers
            </p>
          </div>
        </div>
      </template>

      <div v-if="globalPending" class="py-12 flex items-center justify-center">
        <div class="text-center space-y-2 text-gray-500">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p>Loading customer care data...</p>
        </div>
      </div>

      <div v-else-if="globalError" class="py-12 text-center text-red-600">
        <p class="font-medium">Failed to load customer care data</p>
        <p class="text-sm text-red-500 mt-2">{{ globalError }}</p>
        <div class="mt-4 flex items-center justify-center gap-2">
          <UButton variant="soft" color="primary" @click="refreshAll">Retry</UButton>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Contact</th>
              <th class="px-4 py-3">Tier</th>
              <th class="px-4 py-3">Sales</th>
              <th class="px-4 py-3">Assigned At</th>
              <th class="px-4 py-3">Note</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="entry in paginatedEntries"
              :key="entry.customer.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-4">
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-gray-900">{{ entry.customer.full_name }}</p>
                  <p class="text-xs text-gray-500 font-mono">{{ entry.customer.id }}</p>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="text-sm text-gray-600 space-y-1">
                  <p>{{ entry.customer.email }}</p>
                  <p>{{ entry.customer.phone_number || '—' }}</p>
                </div>
              </td>
              <td class="px-4 py-4">
                <UBadge
                  :color="entry.customer.tier === 'DIAMOND' ? 'primary' : entry.customer.tier === 'GOLD' ? 'warning' : entry.customer.tier === 'SILVER' ? 'info' : 'neutral'"
                  variant="soft"
                >
                  {{ entry.customer.tier }}
                </UBadge>
              </td>
              <td class="px-4 py-4">
                <div class="text-sm text-gray-700 space-y-1">
                  <p class="font-medium text-gray-900">{{ entry.salesUser.full_name }}</p>
                  <p class="text-xs text-gray-500 font-mono">{{ entry.salesUser.staff_code }}</p>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ formatDate(entry.assignment.assigned_at) }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 max-w-xs w-48 align-top">
                <div class="flex items-center gap-2">
                  <span
                    v-if="entry.assignment.note"
                    class="block max-w-xs truncate cursor-help flex-1"
                    v-tippy="entry.assignment.note"
                  >
                    {{ entry.assignment.note }}
                  </span>
                  <span v-else class="text-gray-400 flex-1">—</span>
                  <UButton
                    icon="i-heroicons-pencil-square"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    class="!px-1.5 !py-1.5 flex-shrink-0"
                    @click="openEditNoteModal(entry)"
                  />
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center justify-end gap-1.5">
                  <UTooltip text="Log care interaction" :popper="{ placement: 'top' }">
                    <UButton
                      color="primary"
                      size="sm"
                      variant="soft"
                      class="!px-2 !py-1.5"
                      @click="openCareModal(entry)"
                    >
                      <span
                        class="slds-icon-glyph text-[16px] text-primary-600 slds-icons-questions_and_answers"
                        aria-hidden="true"
                      ></span>
                    </UButton>
                  </UTooltip>
                  <UTooltip text="View history" :popper="{ placement: 'top' }">
                    <UButton
                      variant="soft"
                      color="neutral"
                      size="sm"
                      class="!px-2 !py-1.5"
                      @click="openHistoryModal(entry)"
                    >
                      <span
                        class="slds-icon-glyph text-[16px] text-gray-600 slds-icons-clock"
                        aria-hidden="true"
                      ></span>
                    </UButton>
                  </UTooltip>
                  <UTooltip text="View detail" :popper="{ placement: 'top' }">
                    <UButton
                      variant="soft"
                      color="primary"
                      size="sm"
                      class="!px-2 !py-1.5"
                      @click="openCustomerDetailModal(entry)"
                    >
                      <span
                        class="slds-icon-glyph text-[16px] text-primary-600 slds-icons-preview"
                        aria-hidden="true"
                      ></span>
                    </UButton>
                  </UTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredEntries.length === 0" class="py-12 text-center text-gray-500">
          No assigned customers found
        </div>

        <!-- Pagination -->
        <div
          v-else
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 text-sm text-gray-600 border-t border-gray-200"
        >
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <span>Items per page:</span>
              <USelect
                v-model="itemsPerPage"
                :items="[10, 25, 50, 100]"
                class="w-20"
                @update:model-value="currentPage = 1"
              />
            </div>
            <div>
              Showing
              <span class="font-medium">{{ filteredEntries.length === 0 ? 0 : startIndex + 1 }}</span>
              -
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ filteredEntries.length }}</span>
              customer(s)
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-double-left"
                :disabled="currentPage === 1"
                size="sm"
                class="hidden sm:flex"
                @click="goToPage(1)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-left"
                :disabled="currentPage === 1"
                size="sm"
                @click="previousPage"
              />
            </div>

            <div class="flex items-center gap-1">
              <template v-if="totalPages <= 7">
                <UButton
                  v-for="page in totalPages"
                  :key="page"
                  :color="page === currentPage ? 'primary' : 'neutral'"
                  :variant="page === currentPage ? 'solid' : 'ghost'"
                  size="sm"
                  class="min-w-[2.5rem]"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </UButton>
              </template>
              <template v-else>
                <UButton
                  :color="currentPage === 1 ? 'primary' : 'neutral'"
                  :variant="currentPage === 1 ? 'solid' : 'ghost'"
                  size="sm"
                  class="min-w-[2.5rem]"
                  @click="goToPage(1)"
                >
                  1
                </UButton>
                <span v-if="visiblePages[0] > 2" class="px-2 text-gray-400">...</span>
                <UButton
                  v-for="page in visiblePages"
                  :key="page"
                  :color="page === currentPage ? 'primary' : 'neutral'"
                  :variant="page === currentPage ? 'solid' : 'ghost'"
                  size="sm"
                  class="min-w-[2.5rem]"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </UButton>
                <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="px-2 text-gray-400">
                  ...
                </span>
                <UButton
                  :color="currentPage === totalPages ? 'primary' : 'neutral'"
                  :variant="currentPage === totalPages ? 'solid' : 'ghost'"
                  size="sm"
                  class="min-w-[2.5rem]"
                  @click="goToPage(totalPages)"
                >
                  {{ totalPages }}
                </UButton>
              </template>
            </div>

            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-right"
                :disabled="currentPage === totalPages"
                size="sm"
                @click="nextPage"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-chevron-double-right"
                :disabled="currentPage === totalPages"
                size="sm"
                class="hidden sm:flex"
                @click="goToPage(totalPages)"
              />
            </div>

            <div v-if="totalPages > 10" class="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span>Go to:</span>
              <UInput
                v-model.number="jumpToPage"
                type="number"
                :min="1"
                :max="totalPages"
                class="w-16"
                @keyup.enter="jumpToPageHandler"
              />
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="isCareModalOpen"
      size="xl"
      :ui="{ content: 'max-w-4xl w-full', body: 'p-0' }"
      :title="selectedEntry ? `Log Care · ${selectedEntry.customer.full_name}` : 'Log Care Interaction'"
    >
      <template #body>
        <div v-if="selectedEntry" class="space-y-6 px-6 py-6">
          <section class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex flex-col gap-3 text-sm text-gray-600">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-gray-500 uppercase">Customer</p>
                  <p class="text-base font-semibold text-gray-900">
                    {{ selectedEntry.customer.full_name }}
                    <span class="ml-2 text-xs text-gray-500">#{{ selectedEntry.customer.id }}</span>
                  </p>
                </div>
                <UBadge
                  :color="selectedEntry.customer.tier === 'DIAMOND' ? 'primary' : selectedEntry.customer.tier === 'GOLD' ? 'warning' : selectedEntry.customer.tier === 'SILVER' ? 'info' : 'neutral'"
                  variant="soft"
                  class="px-3 py-1 text-xs"
                >
                  {{ selectedEntry.customer.tier }}
                </UBadge>
              </div>
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-gray-500 uppercase">Sales Owner</p>
                  <p class="text-base font-semibold text-gray-900">
                    {{ selectedEntry.salesUser.full_name }}
                    <span class="ml-2 text-xs text-gray-500">{{ selectedEntry.salesUser.staff_code }}</span>
                  </p>
                </div>
                <div class="text-xs text-gray-500 text-right">
                  Assigned {{ formatDate(selectedEntry.assignment.assigned_at) }}
                  <span v-if="selectedEntry.assignment.note" class="block text-gray-400">“{{ selectedEntry.assignment.note }}”</span>
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
                      v-model="careForm.type"
                      :items="interactionTypeOptions"
                      placeholder="Choose interaction type"
                      class="w-full"
                    />
                    <UIcon :name="getInteractionMeta(careForm.type).icon" class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5" :class="getInteractionMeta(careForm.type).iconColor" />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-gray-700">Channel</label>
                  <div class="relative professional-input">
                    <UInput
                      v-model="careForm.channel"
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
                      v-model="careForm.interactionDate"
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
                      v-model.number="careForm.durationMinutes"
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
                  <UInput v-model="careForm.subject" placeholder="Optional subject line" class="w-full" />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700">Interaction Details</label>
                <div class="relative professional-input">
                  <UTextarea
                    v-model="careForm.detail"
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
                        {{ careForm.attachments.length ? `${careForm.attachments.length} file(s) selected` : 'Upload supporting files (optional)' }}
                      </span>
                      <span class="text-xs text-emerald-600">Formats: images, docs, audio, video · Each ≤ 20 MB · Max 5 files</span>
                    </div>
                  </div>
                  <span class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Browse</span>
                  <input type="file" class="hidden" multiple @change="handleAttachmentChange" />
                </label>
                <span v-if="attachmentError" class="text-xs text-red-500">{{ attachmentError }}</span>
                <div v-if="careForm.attachments.length" class="flex flex-wrap gap-2 pt-2">
                  <div
                    v-for="(file, fileIndex) in careForm.attachments"
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
                  <input type="checkbox" v-model="careForm.followUpRequired" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  Follow-up required
                </label>
                <div v-if="careForm.followUpRequired" class="space-y-2 md:w-1/3">
                  <label class="text-sm font-semibold text-gray-700">Follow-up Date</label>
                  <div class="relative professional-input">
                    <UInput v-model="careForm.followUpDate" type="date" class="w-full" />
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
          <div class="text-xs text-gray-500" v-if="selectedEntry">
            Logging as {{ selectedEntry.salesUser.staff_code }} · {{ selectedEntry.salesUser.full_name }}
          </div>
          <div class="flex items-center justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="closeCareModal">Cancel</UButton>
            <UButton
              color="primary"
              :loading="submitting"
              :disabled="submitting || !canSubmitCare"
              @click="submitCare"
            >
              Save Interaction
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="isHistoryModalOpen"
      size="lg"
      :ui="{ content: 'max-w-3xl w-full' }"
      :title="historyEntry ? `Care History · ${historyEntry.customer.full_name}` : 'Care History'"
      :dismissible="!isViewerActive"
      @close:prevent="handleHistoryModalClosePrevented"
    >
      <template #body>
        <div class="p-6 space-y-4">
          <div
            v-if="historyEntry"
            class="rounded-lg border border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-600"
          >
            <p class="text-base font-semibold text-gray-900">{{ historyEntry.customer.full_name }}</p>
            <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span class="font-mono">ID: {{ historyEntry.customer.id }}</span>
              <span>{{ historyEntry.customer.email }}</span>
              <span>{{ historyEntry.customer.phone_number || '—' }}</span>
            </div>
          </div>

          <div v-if="historyPending" class="py-10 flex items-center justify-center text-gray-500">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              <span>Loading interactions...</span>
            </div>
          </div>
          <div v-else-if="historyError" class="text-sm text-red-600">
            {{ historyError }}
          </div>
          <div v-else-if="historyInteractions.length === 0" class="py-10 text-sm text-gray-500 text-center">
            No care interactions recorded yet.
          </div>
          <div v-else class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <div
              v-for="(interaction, index) in historyInteractions"
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
                  v-if="index !== historyInteractions.length - 1"
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
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end w-full">
          <UButton variant="ghost" color="neutral" @click="closeHistoryModal" :disabled="isViewerActive">Close</UButton>
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

    <!-- Customer Detail Modal -->
    <CustomerCareCustomerDetailModal
      v-model:open="isCustomerDetailModalOpen"
      :customer="customerDetailCustomer"
      :sales-user-info="customerDetailSalesUserInfo"
      :customer-numeric-id="customerDetailNumericId"
      @close="closeCustomerDetailModal"
    />

    <!-- Edit Note Modal -->
    <UModal
      v-model:open="isEditNoteModalOpen"
      title="Edit Assignment Note"
    >
      <template #body>
        <div v-if="editNoteEntry" class="space-y-4">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-700">Customer</p>
            <p class="text-base font-semibold text-gray-900">
              {{ editNoteEntry.customer.full_name }}
              <span class="ml-2 text-xs text-gray-500">#{{ editNoteEntry.customer.id || editNoteEntry.customer.customer_id }}</span>
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-700">Sales User</p>
            <p class="text-sm text-gray-600">
              {{ editNoteEntry.salesUser.full_name }}
              <span class="ml-2 text-xs text-gray-500">({{ editNoteEntry.salesUser.staff_code }})</span>
            </p>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Note</label>
            <UTextarea
              v-model="editNoteText"
              placeholder="Enter assignment note..."
              :rows="4"
              class="w-full"
            />
            <p class="text-xs text-gray-400">Leave empty to remove the note.</p>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="close"
            :disabled="editNoteSubmitting"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="handleSaveNote"
            :loading="editNoteSubmitting"
          >
            Save Note
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Directive } from 'vue'
import type { Customer } from '~/composables/useCustomers'
import type { SalesUserWithCustomers, CustomerAssignment } from '~/composables/useCustomerAssignments'
import type { CustomerInteraction, InteractionType } from '~/composables/useCustomerInteractions'
import { useImageViewer } from '~/composables/useImageViewer'

const toast = useToast()

const { fetchCustomers } = useCustomers()
const { fetchSalesWithCustomers, updateSingleAssignmentNote } = useCustomerAssignments()
const { fetchInteractionsByCustomer, createCustomerInteraction } = useCustomerInteractions()

// Lightweight Tippy.js directive for tooltips (client-side only)
const vTippy: Directive<HTMLElement, string> = {
  async mounted(el, binding) {
    if (!process.client || !el || !binding.value) return
    
    try {
      await nextTick()
      if (!el.isConnected) return
      
      // Import Tippy.js and CSS
      const tippyModule = await import('tippy.js')
      await import('tippy.js/dist/tippy.css')
      
      const tippy = tippyModule.default || tippyModule
      
      if (!tippy || typeof tippy !== 'function') {
        console.warn('Tippy.js is not available')
        return
      }
      
      const instance = tippy(el, {
        content: binding.value || '',
        placement: 'top',
        animation: 'fade',
      })
      
      if (instance) {
        ;(el as any)._tippyInstance = instance
      }
    } catch (error) {
      console.warn('Tippy.js initialization failed:', error)
    }
  },
  updated(el, binding) {
    if (!process.client) return
    const instance = (el as any)?._tippyInstance
    if (instance && typeof instance.setContent === 'function' && binding.value !== binding.oldValue) {
      try {
        instance.setContent(binding.value || '')
      } catch (error) {
        console.warn('Tippy.js update failed:', error)
      }
    }
  },
  unmounted(el) {
    if (!process.client) return
    const instance = (el as any)?._tippyInstance
    if (instance && typeof instance.destroy === 'function') {
      try {
        instance.destroy()
      } catch (error) {
        console.warn('Tippy.js destroy failed:', error)
      }
    }
  },
}

const {
  data: customers,
  pending: customersPending,
  error: customersError,
  refresh: refreshCustomers,
} = useAsyncData('customer-care-customers', () => fetchCustomers(), {
  default: () => [],
  lazy: true,
  server: true,
})

const {
  data: salesWithCustomers,
  pending: salesPending,
  error: salesError,
  refresh: refreshSales,
} = useAsyncData('customer-care-sales-with-customers', () => fetchSalesWithCustomers(), {
  default: () => [],
  lazy: true,
  server: true,
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

// Use image viewer composable
const {
  galleryImages,
  attachmentGalleryRef,
  isViewerActive,
  isImageAttachment,
  getAttachmentIcon,
  openViewer,
} = useImageViewer()

interface CareEntry {
  customer: Customer
  assignment: CustomerAssignment
  salesUser: SalesUserWithCustomers
  customerNumericId: number
}

const resolveCustomerFromAssignment = (assignment: CustomerAssignment): Customer | null => {
  if (assignment.customer) {
    return assignment.customer as Customer
  }
  const code = typeof assignment.customer_id === 'string' ? assignment.customer_id : String(assignment.customer_id)
  return (customers.value || []).find((c) => c.customer_id === code) || null
}

const resolveCustomerNumericId = (assignment: CustomerAssignment): number | null => {
  if (assignment.customer && assignment.customer.id != null) {
    const numeric = Number(assignment.customer.id)
    if (Number.isFinite(numeric)) {
      return numeric
    }
  }
  const numericId = Number(assignment.customer_id)
  return Number.isFinite(numericId) ? numericId : null
}

const flattenAssignments = computed(() => {
  const entries: CareEntry[] = []

  for (const salesUser of salesWithCustomers.value || []) {
    for (const assignment of salesUser.customers) {
      const customer = resolveCustomerFromAssignment(assignment)
      const numericId = resolveCustomerNumericId(assignment)
      if (!customer || numericId == null) continue
      entries.push({
        customer,
        assignment,
        salesUser,
        customerNumericId: numericId,
      })
    }
  }

  return entries.sort((a, b) => {
    const dateA = a.assignment.assigned_at ? new Date(a.assignment.assigned_at).getTime() : 0
    const dateB = b.assignment.assigned_at ? new Date(b.assignment.assigned_at).getTime() : 0
    return dateB - dateA
  })
})

const searchQuery = ref('')
const appliedSearchQuery = ref('')

const filteredEntries = computed(() => {
  const query = appliedSearchQuery.value.toLowerCase().trim()
  if (!query) return flattenAssignments.value

  return flattenAssignments.value.filter((entry) => {
    const idString =
      entry.customer.id !== null && entry.customer.id !== undefined
        ? String(entry.customer.id).toLowerCase()
        : ''
    return (
      idString.includes(query) ||
      entry.customer.full_name.toLowerCase().includes(query) ||
      entry.customer.email.toLowerCase().includes(query) ||
      entry.customer.customer_id.toLowerCase().includes(query) ||
      entry.salesUser.full_name.toLowerCase().includes(query) ||
      entry.salesUser.staff_code.toLowerCase().includes(query)
    )
  })
})

const applySearch = () => {
  appliedSearchQuery.value = searchQuery.value.trim()
  currentPage.value = 1
}

const itemsPerPage = ref(10)
const currentPage = ref(1)
const jumpToPage = ref<number | null>(null)

const totalPages = computed(() => {
  const total = Math.ceil(filteredEntries.value.length / itemsPerPage.value)
  return total > 0 ? total : 1
})

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredEntries.value.length))

const paginatedEntries = computed(() => {
  return filteredEntries.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(2, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value - 1, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(2, end - maxVisible + 1)
  }

  if (totalPages.value <= 7) {
    for (let i = 2; i <= totalPages.value - 1; i++) {
      pages.push(i)
    }
  } else {
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

const jumpToPageHandler = () => {
  if (!jumpToPage.value) return
  goToPage(jumpToPage.value)
  jumpToPage.value = null
}

watch([itemsPerPage, filteredEntries], () => {
  const total = totalPages.value
  if (currentPage.value > total) {
    currentPage.value = total
  }
})

const totalCustomers = computed(() => customers.value?.length ?? 0)
const assignedCount = computed(() => flattenAssignments.value.length)
const assignedPercentage = computed(() => {
  if (totalCustomers.value === 0) return 0
  return Math.round((assignedCount.value / totalCustomers.value) * 100)
})

const interactionCache = ref<Record<number, CustomerInteraction[]>>({})

const upcomingFollowUps = computed(() => {
  const now = new Date()
  const sevenDays = new Date(now)
  sevenDays.setDate(now.getDate() + 7)

  let count = 0
  for (const entry of flattenAssignments.value) {
    const followUp = entry.assignment.follow_up_date || null
    const required = Boolean(entry.assignment.follow_up_required)
    if (!followUp || !required) continue
    const date = new Date(followUp)
    if (date >= now && date <= sevenDays) {
      count++
    }
  }
  return count
})

const interactionsThisWeek = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)

  let count = 0
  for (const interactions of Object.values(interactionCache.value)) {
    for (const interaction of interactions) {
      const date = new Date(interaction.interaction_date)
      if (date >= weekAgo && date <= now) {
        count++
      }
    }
  }
  return count
})

const globalPending = computed(() => customersPending.value || salesPending.value)
const globalError = computed(() => customersError.value?.message || salesError.value?.message || '')

const refreshAll = async () => {
  await Promise.all([refreshCustomers(), refreshSales()])
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

const toIsoString = (date: Date) => {
  const iso = date.toISOString()
  return iso
}

const pad = (value: number) => String(value).padStart(2, '0')

const formatDateInput = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
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

const isCareModalOpen = ref(false)
const selectedEntry = ref<CareEntry | null>(null)
const submitting = ref(false)

const defaultCareForm = (): {
  type: InteractionType
  channel: string
  interactionDate: string
  durationMinutes: number | null
  subject: string
  detail: string
  followUpRequired: boolean
  followUpDate: string | null
  attachments: File[]
} => ({
  type: 'call',
  channel: '',
  interactionDate: formatDateInput(new Date()),
  durationMinutes: null,
  subject: '',
  detail: '',
  followUpRequired: false,
  followUpDate: null,
  attachments: [],
})

const careForm = reactive(defaultCareForm())
const attachmentError = ref<string | null>(null)
const isHistoryModalOpen = ref(false)
const historyEntry = ref<CareEntry | null>(null)
const historyInteractions = ref<CustomerInteraction[]>([])
const historyPending = ref(false)
const historyError = ref<string | null>(null)

watch(
  () => careForm.followUpRequired,
  (required) => {
    if (!required) {
      careForm.followUpDate = null
    }
  }
)

watch(
  () => isHistoryModalOpen.value,
  (open) => {
    if (!open) {
      historyEntry.value = null
      historyInteractions.value = []
      historyError.value = null
      historyPending.value = false
    }
  }
)

watch(
  () => isCareModalOpen.value,
  (open) => {
    if (!open) {
      selectedEntry.value = null
      submitting.value = false
      Object.assign(careForm, defaultCareForm())
      attachmentError.value = null
    }
  }
)

const openCareModal = async (entry: CareEntry) => {
  selectedEntry.value = entry
  Object.assign(careForm, defaultCareForm())
  isCareModalOpen.value = true
}

const closeCareModal = () => {
  isCareModalOpen.value = false
}

const loadInteractions = async (customerId: number) => {
  historyPending.value = true
  historyError.value = null
  try {
    if (interactionCache.value[customerId]) {
      historyInteractions.value = interactionCache.value[customerId]
    }
    const interactions = await fetchInteractionsByCustomer(customerId)
    interactionCache.value = {
      ...interactionCache.value,
      [customerId]: interactions,
    }
    historyInteractions.value = interactions
  } catch (error: any) {
    historyError.value = error?.message || 'Failed to load interactions'
  } finally {
    historyPending.value = false
  }
}

const openHistoryModal = async (entry: CareEntry) => {
  historyEntry.value = entry
  isHistoryModalOpen.value = true
  await loadInteractions(entry.customerNumericId)
}

const handleHistoryModalClosePrevented = () => {
  // No-op: keep modal open while viewer is active
}

const closeHistoryModal = () => {
  if (isViewerActive.value) {
    handleHistoryModalClosePrevented()
    return
  }
  isHistoryModalOpen.value = false
}

// Customer Detail Modal
const isCustomerDetailModalOpen = ref(false)
const customerDetailCustomer = ref<Customer | null>(null)
const customerDetailSalesUserInfo = computed(() => {
  if (!customerDetailCustomer.value) return null
  
  // Find the entry for this customer
  const entry = flattenAssignments.value.find(
    (e) => e.customer.id === customerDetailCustomer.value?.id || e.customer.customer_id === customerDetailCustomer.value?.customer_id
  )
  
  if (!entry) return null
  
  return {
    currentSalesUser: {
      full_name: entry.salesUser.full_name,
      staff_code: entry.salesUser.staff_code,
      avatar: entry.salesUser.avatar,
    },
    assignmentDate: entry.assignment.assigned_at ? formatDate(entry.assignment.assigned_at) : null,
    assignmentNote: entry.assignment.note || null,
  }
})

const customerDetailNumericId = computed(() => {
  if (!customerDetailCustomer.value) return null
  return customerDetailCustomer.value.id ? Number(customerDetailCustomer.value.id) : null
})

const openCustomerDetailModal = (entry: CareEntry) => {
  customerDetailCustomer.value = entry.customer
  isCustomerDetailModalOpen.value = true
}

const closeCustomerDetailModal = () => {
  isCustomerDetailModalOpen.value = false
}

watch(isCustomerDetailModalOpen, (open) => {
  if (!open) {
    customerDetailCustomer.value = null
  }
})

const canSubmitCare = computed(() => {
  return (
    !!selectedEntry.value &&
    !!careForm.type &&
    !!careForm.interactionDate &&
    careForm.detail.trim().length > 0
  )
})

const submitCare = async () => {
  if (!selectedEntry.value) return
  if (!canSubmitCare.value) return

  try {
    submitting.value = true
    attachmentError.value = null

    const interactionDateIso = parseDateTime(careForm.interactionDate)
    if (!interactionDateIso) {
      throw new Error('Interaction date is invalid')
    }

    const followUpIso =
      careForm.followUpRequired && careForm.followUpDate ? parseDateOnly(careForm.followUpDate) : null

    const payload = {
      customer_id: selectedEntry.value.customerNumericId,
      sales_user_id: selectedEntry.value.salesUser.sales_user_id,
      type: careForm.type,
      interaction_date: interactionDateIso,
      channel: careForm.channel?.trim() || null,
      duration_minutes: careForm.durationMinutes || null,
      subject: careForm.subject?.trim() || null,
      detail: careForm.detail?.trim() || null,
      follow_up_required: careForm.followUpRequired,
      follow_up_date: followUpIso,
      uploaded_by: selectedEntry.value.salesUser.sales_user_id,
      attachments: careForm.attachments,
    }

    const interaction = await createCustomerInteraction(payload)

    const customerId = selectedEntry.value.customerNumericId
    const existing = interactionCache.value[customerId] || []
    interactionCache.value = {
      ...interactionCache.value,
      [customerId]: [interaction, ...existing],
    }
    if (isHistoryModalOpen.value && historyEntry.value?.customerNumericId === customerId) {
      historyInteractions.value = interactionCache.value[customerId]
    }

    toast.add({
      title: 'Interaction saved',
      description: 'Customer care interaction has been recorded successfully.',
      color: 'primary',
    })

    Object.assign(careForm, defaultCareForm())
    isCareModalOpen.value = false

  } catch (error: any) {
    toast.add({
      title: 'Failed to save interaction',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}

const handleAttachmentChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    input.value = ''
    attachmentError.value = null
    return
  }

  const existing = careForm.attachments.slice()
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
  careForm.attachments = combined
  input.value = ''
}

const removeAttachment = (index: number) => {
  careForm.attachments.splice(index, 1)
  if (!careForm.attachments.length) {
    attachmentError.value = null
  }
}

const openAttachmentViewer = async (
  interaction: CustomerInteraction,
  attachment: CustomerInteraction['attachments'][number],
) => {
  const images = (interaction.attachments || []) as Array<CustomerInteraction['attachments'][number] & { id?: number }>
  await openViewer(images, attachment, attachmentGalleryRef.value)
}

// Edit Note Modal
const isEditNoteModalOpen = ref(false)
const editNoteEntry = ref<CareEntry | null>(null)
const editNoteText = ref('')
const editNoteSubmitting = ref(false)

const openEditNoteModal = (entry: CareEntry) => {
  editNoteEntry.value = entry
  editNoteText.value = entry.assignment.note || ''
  isEditNoteModalOpen.value = true
}

const closeEditNoteModal = () => {
  isEditNoteModalOpen.value = false
  editNoteEntry.value = null
  editNoteText.value = ''
  editNoteSubmitting.value = false
}

const handleSaveNote = async () => {
  if (!editNoteEntry.value) return

  const salesUserId = editNoteEntry.value.salesUser.sales_user_id
  const customerId = editNoteEntry.value.customerNumericId

  if (!salesUserId || !Number.isInteger(Number(salesUserId))) {
    toast.add({
      title: 'Invalid sales user ID',
      description: 'Could not resolve sales user ID.',
      color: 'error',
    })
    return
  }

  if (!customerId || !Number.isInteger(Number(customerId))) {
    toast.add({
      title: 'Invalid customer ID',
      description: 'Could not resolve customer ID.',
      color: 'error',
    })
    return
  }

  try {
    editNoteSubmitting.value = true
    await updateSingleAssignmentNote({
      sales_user_id: Number(salesUserId),
      customer_id: Number(customerId),
      note: editNoteText.value.trim() || null,
    })

    // Refresh data
    await refreshSales()

    toast.add({
      title: 'Note updated',
      description: 'Assignment note has been updated successfully.',
      color: 'primary',
    })

    closeEditNoteModal()
  } catch (error: any) {
    toast.add({
      title: 'Failed to update note',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    editNoteSubmitting.value = false
  }
}

watch(isEditNoteModalOpen, (open) => {
  if (!open) {
    editNoteEntry.value = null
    editNoteText.value = ''
    editNoteSubmitting.value = false
  }
})
</script>

<style scoped>
.filters-container {
  min-height: 4.5rem;
}

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

.attachment-preview-image {
  max-height: 70vh;
  width: auto;
  border-radius: 1rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
}
</style>

