<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Leads</h1>
        <p class="text-sm text-gray-500">Manage potential customers, log interactions, and coordinate follow-ups.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-heroicons-arrow-down-tray"
          to="/downloads/lead_import_template.xlsx"
          target="_blank"
        >
          Download Template
        </UButton>
        <UButton
          v-if="canImportLeads"
          color="primary"
          variant="soft"
          icon="i-heroicons-cloud-arrow-up"
          @click="openImportModal"
        >
          Import Leads
        </UButton>
        <UButton
          v-if="canCreateLead"
          color="primary"
          icon="i-heroicons-plus"
          @click="openCreateLead"
        >
          New Lead
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="pending"
          @click="() => refreshLeads()"
        >
          Refresh
        </UButton>
      </div>
    </header>

    <!-- Statistics Cards -->
    <div v-if="statisticsPending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="i in 4" :key="i">
        <div class="flex items-center justify-between">
          <div class="space-y-2 flex-1">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-8 w-16" />
            <USkeleton class="h-3 w-32" />
          </div>
          <USkeleton class="h-12 w-12 rounded-lg" />
        </div>
      </UCard>
    </div>

    <div v-else-if="statistics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">Total Leads</p>
            <p class="text-3xl font-bold text-gray-900">{{ formatNumber(statistics.total_leads) }}</p>
            <p class="text-xs text-gray-500">
              {{ statistics.assigned_leads }} assigned, {{ statistics.unassigned_leads }} unassigned
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">Qualified Leads</p>
            <p class="text-3xl font-bold text-emerald-600">{{ formatNumber(statistics.qualified_leads) }}</p>
            <p class="text-xs text-gray-500">
              {{ statistics.total_leads > 0 ? Math.round((statistics.qualified_leads / statistics.total_leads) * 100) : 0 }}% of total
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">Converted Leads</p>
            <p class="text-3xl font-bold text-blue-600">{{ formatNumber(statistics.converted_leads) }}</p>
            <p class="text-xs text-gray-500">
              {{ statistics.conversion_rate.toFixed(1) }}% conversion rate
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <UIcon name="i-heroicons-trophy" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600">New This Month</p>
            <p class="text-3xl font-bold text-amber-600">{{ formatNumber(statistics.leads_this_month) }}</p>
            <p class="text-xs text-gray-500">
              {{ statistics.leads_this_week }} this week
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- More Details Section (Collapsible) -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-gray-900">More Details</h3>
            <p class="mt-1 text-sm text-gray-500">Detailed breakdown by status, stage, and source.</p>
          </div>
          <UButton
            variant="ghost"
            color="neutral"
            :icon="showMoreDetails ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
            @click="showMoreDetails = !showMoreDetails"
          >
            {{ showMoreDetails ? 'Hide' : 'Show' }}
          </UButton>
        </div>
      </template>

      <div v-if="statisticsPending && showMoreDetails" class="grid gap-4 lg:grid-cols-2">
        <div v-for="i in 3" :key="i" class="space-y-3">
          <USkeleton class="h-6 w-32" />
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <USkeleton v-for="j in 6" :key="j" class="h-16 w-full" />
          </div>
        </div>
      </div>

      <div v-else-if="statistics && showMoreDetails" class="grid gap-4 lg:grid-cols-2">
        <!-- Leads by Status -->
        <div v-if="statisticsByStatus.length > 0" class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="slds-icon-glyph text-[20px] text-purple-600 slds-icons-flag" aria-hidden="true"></span>
            <div>
              <h4 class="text-sm font-semibold text-gray-900">By Status</h4>
              <p class="mt-1 text-xs text-gray-500">Distribution of leads across statuses.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="item in statisticsByStatus"
              :key="item.label"
              class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 shadow-sm hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
            >
              <UTooltip :text="item.label" :popper="{ placement: 'top' }">
                <span class="text-sm font-medium text-gray-800 truncate flex-1 cursor-help">
                  {{ item.label }}
                </span>
              </UTooltip>
              <span class="text-sm font-semibold text-gray-900 ml-2 shrink-0">{{ item.total }}</span>
            </div>
          </div>
        </div>

        <!-- Leads by Stage -->
        <div v-if="statisticsByStage.length > 0" class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="slds-icon-glyph text-[20px] text-blue-600 slds-icons-stage" aria-hidden="true"></span>
            <div>
              <h4 class="text-sm font-semibold text-gray-900">By Stage</h4>
              <p class="mt-1 text-xs text-gray-500">Distribution of leads across stages.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="item in statisticsByStage"
              :key="item.label"
              class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 hover:border-blue-300 transition-colors"
            >
              <UTooltip :text="item.label" :popper="{ placement: 'top' }">
                <span class="text-sm font-medium text-gray-800 truncate flex-1 cursor-help">
                  {{ item.label }}
                </span>
              </UTooltip>
              <span class="text-sm font-semibold text-gray-900 ml-2 shrink-0">{{ item.total }}</span>
            </div>
          </div>
        </div>

        <!-- Leads by Source -->
        <div v-if="statisticsBySource.length > 0" class="lg:col-span-2 space-y-3">
          <div class="flex items-center gap-2">
            <span class="slds-icon-glyph text-[20px] text-emerald-600 slds-icons-lead" aria-hidden="true"></span>
            <div>
              <h4 class="text-sm font-semibold text-gray-900">By Source</h4>
              <p class="mt-1 text-xs text-gray-500">Distribution of leads across sources.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="item in statisticsBySource"
              :key="item.label"
              class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500 transition-colors"
            >
              <UTooltip :text="item.label" :popper="{ placement: 'top' }">
                <span class="text-sm font-medium text-gray-800 truncate flex-1 cursor-help">
                  {{ item.label }}
                </span>
              </UTooltip>
              <span class="text-sm font-semibold text-gray-900 ml-2 shrink-0">{{ item.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <div v-if="selectedLeadIds.length > 0" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700">
          {{ selectedLeadIds.length }} lead(s) selected
        </span>
        <UButton color="error" variant="soft" @click="clearLeadSelection">
          Clear Selection
        </UButton>
      </div>
      <UButton
        v-if="canAssignSale"
        color="primary"
        icon="i-heroicons-user-plus"
        @click="openAssignSaleModal"
      >
        Assign Sale
      </UButton>
    </div>

    <UCard>
      <template #header>
        <LeadsFilterBar
          :reference="reference"
          :filters="filters"
          @update:filters="(patch) => Object.assign(filters, patch)"
          :loading="pendingReference"
          @reset="resetFilters"
        />
      </template>

      <LeadsTable
        :leads="paginatedLeads"
        :loading="pending"
        :error="error"
        v-model:selected-id="selectedLeadId"
        :show-selection="true"
        :selected-ids="selectedLeadIds"
        :all-selected="allLeadsSelected"
        :some-selected="someLeadsSelected"
        @toggle-select="toggleLeadSelect"
        @toggle-select-all="toggleLeadSelectAll"
      />

      <template #footer>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 text-sm text-gray-600 border-t border-gray-200">
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
              <span class="font-medium">{{ filteredLeads.length === 0 ? 0 : startIndex + 1 }}</span>
              -
              <span class="font-medium">{{ endIndex }}</span>
              of
              <span class="font-medium">{{ filteredLeads.length }}</span>
              lead(s)
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
                <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="px-2 text-gray-400">...</span>
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
      </template>
    </UCard>

    <LeadDetailDrawer
      :open="selectedLeadId !== null"
      :lead-id="selectedLeadId"
      :pending="detailPending"
      :detail="leadDetail"
      :reference="reference"
      @close="selectedLeadId = null"
      @updated="handleDetailUpdate"
    />

    <CreateLeadModal
      v-model:open="isCreateLeadOpen"
      :reference="reference"
      @saved="handleLeadCreated"
    />

    <UModal
      v-model:open="isImportModalOpen"
      :dismissible="!importUploading"
      title="Import Leads from Excel"
      :ui="{ content: 'max-w-4xl w-full' }"
    >
      <template #body>
        <div class="space-y-6">
          <div class="space-y-3">
            <label class="text-sm font-semibold text-gray-700">Select Excel file</label>
            <div class="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-6 text-sm text-gray-600">
              <p class="text-sm text-gray-600">Upload a .xlsx or .xls file up to 5 MB.</p>
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <UButton
                  color="primary"
                  icon="i-heroicons-arrow-up-on-square"
                  :disabled="importUploading"
                  @click="importFileInput?.click()"
                >
                  Choose File
                </UButton>
                <span v-if="importFile" class="text-sm font-medium text-gray-800">
                  {{ importFile.name }}
                  <span class="text-xs text-gray-500">({{ formatFileSize(importFile.size) }})</span>
                </span>
                <span v-else class="text-sm text-gray-500">No file selected</span>
              </div>
            </div>
            <input
              ref="importFileInput"
              type="file"
              class="hidden"
              accept=".xlsx,.xls"
              @change="handleImportFileChange"
            />
          </div>

          <UAlert
            v-if="importError"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            title="Import error"
          >
            {{ importError }}
          </UAlert>

          <div v-if="previewRows.length" class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Preview: {{ importSheetName || 'Sheet1' }}</h3>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <div>
                  Rows {{ previewDataRows.length ? previewStartIndex + 1 : 0 }}-{{ previewEndIndex }} of {{ previewDataRows.length }}
                </div>
                <div class="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <USelect
                    v-model="previewRowsPerPage"
                    :items="previewRowsPerPageOptions"
                    class="w-20"
                    @update:model-value="previewPage = 1"
                  />
                </div>
              </div>
            </div>
            <div class="max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <table class="min-w-full table-fixed text-xs text-gray-700">
                <thead class="bg-gray-100">
                  <tr>
                    <th
                      v-for="(header, index) in previewHeaders"
                      :key="`import-header-${index}`"
                      class="px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-600 min-w-[12rem] whitespace-nowrap"
                    >
                      {{ header || `Column ${index + 1}` }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in previewRows"
                    :key="`import-row-${rowIndex}`"
                    class="border-t border-gray-100"
                  >
                    <td
                      v-for="(cell, cellIndex) in row"
                      :key="`import-cell-${rowIndex}-${cellIndex}`"
                      class="px-3 py-2 text-sm text-gray-700 align-top min-w-[12rem] whitespace-pre-wrap"
                    >
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="previewDataRows.length > previewRowsPerPage" class="flex items-center justify-between text-xs text-gray-500">
              <div>
                Page {{ previewPage }} / {{ previewTotalPages }}
              </div>
              <div class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-chevron-left"
                  :disabled="previewPage === 1"
                  @click="previousPreviewPage"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-chevron-right"
                  :disabled="previewPage === previewTotalPages"
                  @click="nextPreviewPage"
                />
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-gray-500">
            Select a file to see a preview before importing.
          </div>

          <div v-if="importReport" class="space-y-3">
            <UCard>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm text-gray-700">
                <div>
                  <p class="text-xs uppercase text-gray-500">Total rows</p>
                  <p class="text-lg font-semibold text-gray-900">{{ importReport.total_rows }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase text-gray-500">Imported</p>
                  <p class="text-lg font-semibold text-emerald-600">{{ importReport.imported }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase text-gray-500">Skipped</p>
                  <p class="text-lg font-semibold text-amber-600">{{ importReport.skipped }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase text-gray-500">Status</p>
                  <UBadge :color="importReport.skipped ? 'warning' : 'primary'" variant="soft">
                    {{ importReport.skipped ? 'Imported with warnings' : 'Imported successfully' }}
                  </UBadge>
                </div>
              </div>
            </UCard>

            <div v-if="importReport.errors?.length" class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-900">Import warnings</h4>
              <ul class="max-h-40 overflow-auto space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <li v-for="(entry, index) in importReport.errors" :key="`import-error-${index}`">
                  Row {{ entry.row }}: {{ entry.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full items-center justify-between">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="importUploading"
            @click="closeImportModal"
          >
            Close
          </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-arrow-up-tray"
            :disabled="!importFile || importUploading"
            :loading="importUploading"
            @click="submitImport"
          >
            Import
          </UButton>
        </div>
      </template>
    </UModal>
    
    <UModal v-model:open="isAssignSaleOpen" :title="'Assign Sales User to Leads'">
      <template #body>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600">
              Assign sales user to
              <span class="font-semibold text-gray-900">{{ selectedLeadIds.length }}</span>
              selected lead(s):
            </p>
            <div class="mt-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
              <table class="min-w-full table-fixed text-xs text-gray-700">
                <thead class="bg-gray-100 text-gray-500">
                  <tr>
                    <th class="px-3 py-2 w-12 text-left">#</th>
                    <th class="px-3 py-2 w-16 text-left">ID</th>
                    <th class="px-3 py-2 w-40 text-left">Lead</th>
                    <th class="px-3 py-2 w-40 text-left">Email</th>
                    <th class="px-3 py-2 w-40 text-left">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(detail, index) in selectedLeadsDetailed"
                    :key="detail.id"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2 text-gray-400 font-mono">{{ index + 1 }}</td>
                    <td class="px-3 py-2 text-gray-500 font-mono text-[11px]">
                      {{ detail.id }}
                    </td>
                    <td class="px-3 py-2 text-gray-900 font-medium">
                      {{ detail.full_name }}
                    </td>
                    <td class="px-3 py-2">{{ detail.email || '—' }}</td>
                    <td class="px-3 py-2">
                      <span v-if="detail.owner_name" class="text-gray-900 font-medium">{{ detail.owner_name }}</span>
                      <span v-else class="text-gray-400">Unassigned</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="salesUsersPending" class="py-4 text-center text-gray-500">
            Loading sales users...
          </div>
          <div v-else-if="salesUsersError" class="py-4 text-center text-red-600">
            Error loading sales users: {{ salesUsersError.message }}
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Sales User</label>
            <select
              v-model="selectedSalesUserCode"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="" disabled>Choose a sales user...</option>
              <option
                v-for="option in salesUsersOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <div class="text-xs text-gray-400 mt-1">
              {{ salesUsersOptions.length }} sales user(s) available
            </div>
            <div v-if="selectedSalesUser" class="mt-3 flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-gray-500" />
              <span>
                Assigning to <span class="font-medium text-gray-900">{{ selectedSalesUser.full_name }}</span>
                <span class="text-gray-400">({{ selectedSalesUser.staff_code }})</span>
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Note <span class="text-gray-400">(optional)</span></label>
            <textarea
              v-model="assignNote"
              class="w-full min-h-[96px] resize-y rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add an optional note about this assignment..."
            ></textarea>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="handleAssignLeads"
            :loading="assigning"
            :disabled="!selectedSalesUserId || selectedLeadIds.length === 0"
          >
            Assign
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { useLeads } from '~/composables/useLeads'
import type { LeadImportReport } from '~/composables/useLeads'
import { useSalesUsers } from '~/composables/useSalesUsers'
import LeadsTable from '~/components/leads/LeadsTable.vue'
import LeadsFilterBar from '~/components/leads/LeadsFilterBar.vue'
import LeadDetailDrawer from '~/components/leads/LeadDetailDrawer.vue'
import CreateLeadModal from '~/components/leads/CreateLeadModal.vue'

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()

// Permissions
const { hasPermission } = usePermissions()
const canCreateLead = computed(() => hasPermission('leads', 'createLead'))
const canAssignSale = computed(() => hasPermission('leads', 'assignSale'))
const canImportLeads = computed(() => hasPermission('leads', 'importLeads'))

const {
  fetchLeads,
  fetchLeadDetail,
  fetchLeadStatuses,
  fetchLeadStages,
  fetchLeadSources,
  importLeadsFromExcel,
  assignLeadsToSalesUser,
  fetchLeadStatistics,
} = useLeads()
const { fetchSalesUsers } = useSalesUsers()

const { data: leads, pending, error, refresh: refreshLeads } = useAsyncData('leads-list', fetchLeads, {
  lazy: true,
})

const { data: statistics, pending: statisticsPending, refresh: refreshStatistics } = useAsyncData(
  'leads-statistics',
  async () => {
    const response = await fetchLeadStatistics()
    return response.success ? response.data : null
  },
  {
    lazy: true,
    default: () => null,
  },
)

const { data: reference, pending: pendingReference } = useAsyncData(
  'leads-reference',
  async () => {
    const [statuses, stages, sources] = await Promise.all([
      fetchLeadStatuses(),
      fetchLeadStages(),
      fetchLeadSources(),
    ])
    return { statuses, stages, sources }
  },
  {
    lazy: true,
  },
)

const showMoreDetails = ref(false)

const filters = reactive({
  search: '',
  status: null as number | null,
  stage: null as number | null,
  source: null as number | null,
})

const filteredLeads = computed(() => {
  const list = leads.value || []
  const query = filters.search.trim().toLowerCase()
  return list.filter((lead) => {
    const matchesQuery = !query
      || lead.full_name.toLowerCase().includes(query)
      || (lead.company_name ?? '').toLowerCase().includes(query)
      || (lead.email ?? '').toLowerCase().includes(query)
      || (lead.phone ?? '').toLowerCase().includes(query)

    const matchesStatus = filters.status ? lead.status_id === filters.status : true
    const matchesStage = filters.stage ? lead.stage_id === filters.stage : true
    const matchesSource = filters.source ? lead.source_id === filters.source : true

    return matchesQuery && matchesStatus && matchesStage && matchesSource
  })
})

const selectedLeadId = ref<number | null>(null)
const selectedLeadIds = ref<number[]>([])

const itemsPerPage = ref(10)
const currentPage = ref(1)
const jumpToPage = ref<number | null>(null)

const totalPages = computed(() => {
  const total = Math.ceil(filteredLeads.value.length / itemsPerPage.value)
  return total > 0 ? total : 1
})

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredLeads.value.length))

const paginatedLeads = computed(() => {
  return filteredLeads.value.slice(startIndex.value, endIndex.value)
})

const isLeadSelected = (id: number) => selectedLeadIds.value.includes(id)
const toggleLeadSelect = (id: number) => {
  const idx = selectedLeadIds.value.indexOf(id)
  if (idx > -1) selectedLeadIds.value.splice(idx, 1)
  else selectedLeadIds.value.push(id)
}
const clearLeadSelection = () => {
  selectedLeadIds.value = []
}
const allLeadsSelected = computed(() => {
  if (paginatedLeads.value.length === 0) return false
  return paginatedLeads.value.every((l) => l.id && isLeadSelected(l.id))
})
const someLeadsSelected = computed(() => {
  return paginatedLeads.value.some((l) => l.id && isLeadSelected(l.id)) && !allLeadsSelected.value
})
const toggleLeadSelectAll = () => {
  if (allLeadsSelected.value) {
    selectedLeadIds.value = selectedLeadIds.value.filter((id) => !paginatedLeads.value.some((l) => l.id === id))
  } else {
    const idsToAdd = paginatedLeads.value.map((l) => l.id).filter((id): id is number => typeof id === 'number')
    const set = new Set(selectedLeadIds.value.concat(idsToAdd))
    selectedLeadIds.value = Array.from(set)
  }
}

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
  if (process.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
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

watch([itemsPerPage, filteredLeads], () => {
  const total = totalPages.value
  if (currentPage.value > total) {
    currentPage.value = total
  }
})

watch(
  () => [filters.status, filters.stage, filters.source],
  () => {
    currentPage.value = 1
  },
)

watch(
  () => filters.search,
  () => {
    currentPage.value = 1
  },
)

// Use useLazyAsyncData with a function that reads selectedLeadId
// This ensures fresh data is fetched when selectedLeadId changes
const {
  data: leadDetail,
  pending: detailPending,
  refresh: refreshLeadDetail,
} = await useLazyAsyncData(
  'lead-detail',
  () => (selectedLeadId.value !== null ? fetchLeadDetail(selectedLeadId.value) : Promise.resolve(null)),
  {
    default: () => null,
    immediate: false, // Don't fetch on mount
  }
)

// Watch selectedLeadId to trigger refresh immediately when a lead is selected
// This is the key fix: fetch data immediately when selectedLeadId changes
watch(selectedLeadId, async (id, oldId) => {
  if (id !== null && id !== oldId) {
    // Immediately fetch new data when lead is selected
    // refreshLeadDetail will use the current selectedLeadId.value
    await refreshLeadDetail()
    // Scroll to drawer after it opens (with small delay to ensure drawer is rendered)
    nextTick(() => {
      setTimeout(() => {
        const drawer = document.getElementById('lead-detail-drawer')
        if (drawer) {
          drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 150)
    })
  }
}, { immediate: false })

const resetFilters = () => {
  filters.search = ''
  filters.status = null
  filters.stage = null
  filters.source = null
  currentPage.value = 1
  clearLeadSelection()
}

const isCreateLeadOpen = ref(false)
const openCreateLead = () => {
  isCreateLeadOpen.value = true
}

const handleLeadCreated = async () => {
  isCreateLeadOpen.value = false
  await Promise.all([refreshLeads(), refreshStatistics()])
  toast.add({
    title: 'Lead created',
    description: 'The new lead has been added successfully.',
    color: 'primary',
  })
}

const handleDetailUpdate = async () => {
  await Promise.all([refreshLeadDetail(), refreshLeads(), refreshStatistics()])
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat().format(value || 0)
}

const statisticsByStatus = computed(() => {
  if (!statistics.value?.leads_by_status) return []
  const entries = Object.entries(statistics.value.leads_by_status)
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, total]) => ({
      label: label || 'Unspecified',
      total: total as number,
    }))
})

const statisticsByStage = computed(() => {
  if (!statistics.value?.leads_by_stage) return []
  const entries = Object.entries(statistics.value.leads_by_stage)
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, total]) => ({
      label: label || 'Unspecified',
      total: total as number,
    }))
})

const statisticsBySource = computed(() => {
  if (!statistics.value?.leads_by_source) return []
  const entries = Object.entries(statistics.value.leads_by_source)
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, total]) => ({
      label: label || 'Unspecified',
      total: total as number,
      initials: (label || '—').slice(0, 2).toUpperCase(),
    }))
})

// Assign Sale (bulk for leads)
const isAssignSaleOpen = ref(false)
const openAssignSaleModal = () => {
  if (selectedLeadIds.value.length === 0) return
  selectedSalesUserCode.value = null
  assignNote.value = ''
  isAssignSaleOpen.value = true
}

const { data: salesUsers, pending: salesUsersPending, error: salesUsersError } = useAsyncData(
  'sales-users-for-assign-leads',
  async () => {
    const result = await fetchSalesUsers()
    return result
  },
  {
    default: () => [],
    lazy: true,
    server: true,
  },
)

const salesUsersOptions = computed(() => {
  const users = salesUsers.value || []
  return users.map((u) => ({
    label: `${u.full_name} (${u.staff_code})`,
    value: u.staff_code,
  }))
})

const selectedSalesUserCode = ref<string | null>(null)
const selectedSalesUser = computed(() => {
  if (!selectedSalesUserCode.value) return null
  return (salesUsers.value || []).find((u) => u.staff_code === selectedSalesUserCode.value) || null
})
const selectedSalesUserId = computed(() => {
  if (!selectedSalesUser.value) return null
  const rawId = selectedSalesUser.value.id ?? (selectedSalesUser.value as any).sales_user_id
  if (rawId == null) return null
  const numericId = typeof rawId === 'string' ? Number(rawId) : rawId
  return Number.isFinite(numericId) ? Number(numericId) : null
})

const selectedLeadsDetailed = computed(() => {
  const list = leads.value || []
  const map = new Map<number, any>()
  for (const l of list) {
    if (typeof l.id === 'number') map.set(l.id, l)
  }
  return selectedLeadIds.value
    .map((id) => map.get(id))
    .filter(Boolean)
})

const assignNote = ref('')
const assigning = ref(false)
const handleAssignLeads = async () => {
  if (!selectedSalesUserId.value) {
    toast.add({
      title: 'Missing sales user',
      description: 'Please choose a sales user before assigning.',
      color: 'warning',
    })
    return
  }
  if (selectedLeadIds.value.length === 0) {
    toast.add({
      title: 'No leads selected',
      description: 'Select at least one lead to assign.',
      color: 'warning',
    })
    return
  }
  try {
    assigning.value = true
    await assignLeadsToSalesUser({
      sales_user_id: selectedSalesUserId.value,
      lead_ids: selectedLeadIds.value,
      note: assignNote.value.trim() ? assignNote.value.trim() : null,
    })
    toast.add({
      title: 'Leads assigned',
      description: `Assigned ${selectedLeadIds.value.length} lead(s).`,
      color: 'primary',
    })
    await Promise.all([refreshLeads(), refreshStatistics()])
    isAssignSaleOpen.value = false
    clearLeadSelection()
    selectedSalesUserCode.value = null
    assignNote.value = ''
  } catch (e: any) {
    toast.add({
      title: 'Failed to assign leads',
      description: e?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    assigning.value = false
  }
}

const isImportModalOpen = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
const importFile = ref<File | null>(null)
const importPreview = ref<string[][]>([])
const importSheetName = ref<string | null>(null)
const importError = ref<string | null>(null)
const importUploading = ref(false)
const importReport = ref<LeadImportReport | null>(null)

const previewHeaders = computed(() => (importPreview.value.length ? importPreview.value[0] : []))
const previewRowsPerPageOptions = [5, 10, 20, 50]
const previewRowsPerPage = ref(10)
const previewPage = ref(1)

const previewDataRows = computed(() => {
  if (importPreview.value.length <= 1) return []
  return importPreview.value.slice(1)
})

const previewTotalPages = computed(() => {
  const total = Math.ceil(previewDataRows.value.length / previewRowsPerPage.value)
  return total > 0 ? total : 1
})

const previewStartIndex = computed(() => (previewPage.value - 1) * previewRowsPerPage.value)
const previewEndIndex = computed(() => Math.min(previewStartIndex.value + previewRowsPerPage.value, previewDataRows.value.length))

const previewRows = computed(() => {
  return previewDataRows.value.slice(previewStartIndex.value, previewEndIndex.value)
})

const goToPreviewPage = (page: number) => {
  if (page < 1 || page > previewTotalPages.value) return
  previewPage.value = page
}

const nextPreviewPage = () => {
  if (previewPage.value < previewTotalPages.value) {
    goToPreviewPage(previewPage.value + 1)
  }
}

const previousPreviewPage = () => {
  if (previewPage.value > 1) {
    goToPreviewPage(previewPage.value - 1)
  }
}

watch([previewRowsPerPage, previewDataRows], () => {
  const total = previewTotalPages.value
  if (previewPage.value > total) {
    previewPage.value = total
  }
})

const previewHasMoreRows = computed(() => {
  if (importPreview.value.length <= 1) return false
  return importPreview.value.length - 1 > previewRows.value.length
})

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  const formatted = size % 1 === 0 ? size.toString() : size.toFixed(1)
  return `${formatted} ${units[unitIndex]}`
}

const resetImportState = () => {
  importFile.value = null
  importPreview.value = []
  importSheetName.value = null
  importError.value = null
  importUploading.value = false
  importReport.value = null
  previewRowsPerPage.value = 10
  previewPage.value = 1
  if (importFileInput.value) {
    importFileInput.value.value = ''
  }
}

const openImportModal = () => {
  resetImportState()
  isImportModalOpen.value = true
}

const closeImportModal = () => {
  isImportModalOpen.value = false
}

watch(isImportModalOpen, (open) => {
  if (!open) {
    resetImportState()
  }
})

const handleImportFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  importFile.value = file
  importReport.value = null
  previewPage.value = 1
  await generateImportPreview(file)
}

const generateImportPreview = async (file: File) => {
  if (!import.meta.client) return
  importError.value = null
  try {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.SheetNames[0]
    importSheetName.value = firstSheet || null
    const worksheet = workbook.Sheets[firstSheet]
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })
    importPreview.value = rows
    previewPage.value = 1
  } catch (error: any) {
    importError.value = error?.message || 'Failed to preview the selected Excel file.'
    importPreview.value = []
  }
}

const submitImport = async () => {
  if (!importFile.value) {
    importError.value = 'Please choose an Excel file to import.'
    return
  }

  importUploading.value = true
  importError.value = null
  try {
    const report = await importLeadsFromExcel(importFile.value)
    importReport.value = report

    toast.add({
      title: 'Import completed',
      description: `Imported ${report.imported} of ${report.total_rows} row(s).`,
      color: report.skipped > 0 ? 'warning' : 'primary',
    })

    await Promise.all([refreshLeads(), refreshStatistics()])
  } catch (error: any) {
    importError.value = error?.message || 'Failed to import leads. Please try again.'
  } finally {
    importUploading.value = false
  }
}

</script>
