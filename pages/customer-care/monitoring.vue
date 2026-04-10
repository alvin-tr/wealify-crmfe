<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Monitoring Intelligence</h1>
        <p class="mt-1 text-sm text-gray-500">
          Track transactional health, alert volumes, and rule activity across the customer base.
        </p>
        <p v-if="lastRefreshedLabel" class="mt-2 text-xs text-gray-400">
          Last updated {{ lastRefreshedLabel }}
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <UButton
          variant="soft"
          color="primary"
          icon="i-heroicons-arrow-path"
          :loading="manualReloading || dashboardPending"
          :disabled="manualReloading || dashboardPending"
          @click="handleManualReload"
        >
          Reload dashboard
        </UButton>
        <UButton
          v-if="canRunRules"
          color="success"
          icon="i-heroicons-play"
          :loading="actionLoading.runRules"
          :disabled="actionLoading.runRules"
          @click="triggerRunRules"
        >
          Run rules
        </UButton>
        <UButton
          v-if="canRefreshSummary"
          color="primary"
          icon="i-heroicons-arrow-path-rounded-square"
          :loading="actionLoading.refreshSummary"
          :disabled="actionLoading.refreshSummary"
          @click="triggerRefreshSummary"
        >
          Refresh summary
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="dashboardError"
      color="error"
      variant="subtle"
      title="Unable to load monitoring dashboard"
      :description="dashboardError?.message || 'Please try again later.'"
    >
      <template #actions>
        <UButton size="xs" color="error" variant="soft" @click="handleRetryDashboard">
          Retry
        </UButton>
      </template>
    </UAlert>

    <div v-if="dashboardPending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="n in 4" :key="`summary-skeleton-${n}`" class="h-32 rounded-2xl" />
    </div>

    <template v-else>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UCard
          v-for="card in summaryCards"
          :key="card.label"
          :ui="{ body: 'flex flex-col gap-2 p-5' }"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-gray-500">{{ card.label }}</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ card.value }}</p>
            </div>
            <span :class="['inline-flex h-12 w-12 items-center justify-center rounded-xl', card.pillClass]">
              <UIcon :name="card.icon" class="h-6 w-6"></UIcon>
            </span>
          </div>
          <p class="text-xs text-gray-500">{{ card.caption }}</p>
        </UCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <UCard :ui="{ body: 'space-y-4 p-5' }" class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">Transaction summary · 30 days</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Aggregated activity derived from the monitoring transaction summaries.
                </p>
              </div>
            </div>
          </template>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Total volume</p>
              <p class="mt-2 text-2xl font-semibold text-emerald-700">
                {{ formatLargeNumber(transactionSummary.total_volume_30d) }}
              </p>
              <p class="mt-1 text-xs text-emerald-700/80">
                {{ transactionSummary.customers_tracked }} customers with recorded transactions in the last 30 days
              </p>
            </div>

            <div class="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">Transactions</p>
              <p class="mt-2 text-2xl font-semibold text-sky-700">
                {{ formatNumber(transactionSummary.total_transactions_30d) }}
              </p>
              <p class="mt-1 text-xs text-sky-600/80">
                Avg daily transactions: {{ formatNumber(avgDailyTransactions) }}
              </p>
            </div>

            <div class="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-600">Volume trend</p>
              <p
                class="mt-2 text-2xl font-semibold"
                :class="volumeChangeRatio >= 0 ? 'text-emerald-600' : 'text-red-500'"
              >
                {{ formatPercentage(volumeChangeRatio) }}
              </p>
              <p class="mt-1 text-xs text-amber-600/80">
                Compared against the previous 30-day window
              </p>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border border-gray-100 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Previous 30-day volume</p>
              <p class="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {{ formatLargeNumber(previousVolume) }}
              </p>
              <p class="mt-1 text-xs text-gray-500">Baseline total volume from the prior 30-day window.</p>
            </div>
            <div class="rounded-xl border border-gray-100 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Average daily volume</p>
              <p class="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {{ formatLargeNumber(avgDailyVolume) }}
              </p>
              <p class="mt-1 text-xs text-gray-500">Derived from total volume in the latest 30 days.</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'space-y-5 p-5' }">
          <template #header>
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">Severity distribution</h2>
              <p class="mt-1 text-sm text-gray-500">Active alerts by severity level.</p>
            </div>
          </template>

          <ul class="space-y-4">
            <li
              v-for="item in severitySummary"
              :key="item.label"
              class="rounded-xl border border-gray-100 p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span :class="['inline-flex h-9 w-9 items-center justify-center rounded-full text-white', item.pillClass]">
                    <UIcon :name="item.icon" class="h-5 w-5" />
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-gray-800 capitalize">{{ item.label }}</p>
                    <p class="text-xs text-gray-500">{{ item.caption }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-base font-semibold text-gray-900 dark:text-white">{{ item.count }}</p>
                  <p class="text-xs text-gray-500">{{ formatPercentage(item.percentage) }}</p>
                </div>
              </div>
            </li>
            <li v-if="!severitySummary.length" class="text-sm text-gray-500">
              No active alerts recorded.
            </li>
          </ul>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">Alerts grouped by customer</h2>
              <p class="mt-1 text-sm text-gray-500">
                Review and manage monitoring alerts grouped by customer ID.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <USelect
                v-model="alertFilters.category_id"
                :items="categoryItems"
                size="sm"
                placeholder="All categories"
                class="w-40"
                :disabled="alertsPending || categoriesPending"
              />
              <USelect
                v-model="alertFilters.status"
                :items="statusItems"
                size="sm"
                placeholder="Status"
                class="w-36"
                :disabled="alertsPending"
              />
              <USelect
                v-model="alertFilters.severity"
                :items="severityItems"
                size="sm"
                placeholder="Severity"
                class="w-36"
                :disabled="alertsPending"
              />
              <UButton
                variant="soft"
                color="primary"
                size="sm"
                icon="i-heroicons-arrow-path"
                :loading="alertsPending"
                @click="handleAlertsRefresh"
              >
                Refresh
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="alertsPending || categoriesPending" class="space-y-3 py-4">
          <USkeleton class="h-10 w-full" />
          <USkeleton v-for="n in 5" :key="`skeleton-${n}`" class="h-16 w-full rounded-xl" />
        </div>

        <UAlert
          v-else-if="alertsError"
          color="error"
          variant="subtle"
          title="Unable to load alerts"
          :description="alertsError?.message || 'Please try again.'"
        >
          <template #actions>
            <UButton size="xs" color="error" variant="soft" @click="handleAlertsRefresh">
              Retry
            </UButton>
          </template>
        </UAlert>

        <div v-else-if="!groupedAlerts.length" class="py-12 text-center text-sm text-gray-500">
          No alerts match the current filters.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr class="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th class="px-4 py-3">
                  <button
                    type="button"
                    class="flex items-center gap-1 hover:text-gray-700 dark:text-gray-200 transition-colors"
                    @click="handleSort('customer_id')"
                  >
                    Customer
                    <UIcon
                      :name="getSortIcon('customer_id')"
                      class="h-3.5 w-3.5"
                      :class="sortField === 'customer_id' ? 'text-primary-600' : 'text-gray-400'"
                    />
                  </button>
                </th>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Group</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Alerts Count</th>
                <th class="px-4 py-3">Volume (30d)</th>
                <th class="px-4 py-3">Total Volume</th>
                <th class="px-4 py-3">Highest Severity</th>
                <th class="px-4 py-3">Latest Detected</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <template v-for="group in paginatedGroups" :key="group.customer_id">
                <tr class="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors">
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="toggleCustomerGroup(group.customer_id)"
                        class="text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        <UIcon
                          :name="expandedCustomers.has(group.customer_id) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                          class="h-4 w-4"
                        />
                      </button>
                      <span class="text-sm font-semibold text-gray-900 dark:text-white">#{{ group.customer_id }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ getCustomerInfo(group.customer_id)?.full_name || '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm text-gray-600 dark:text-gray-300">
                      {{ getCustomerInfo(group.customer_id)?.email || '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div v-if="getCustomerGroups(group.customer_id).length > 0" class="flex flex-col gap-1">
                      <div
                        v-for="groupInfo in getCustomerGroups(group.customer_id)"
                        :key="groupInfo.groupId"
                        class="flex items-center gap-2"
                      >
                        <span class="text-sm text-gray-900 dark:text-white font-semibold">{{ groupInfo.groupName }}</span>
                        <span
                          v-if="groupInfo.isLeader"
                          class="slds-icon-glyph text-[16px] text-yellow-500 slds-icons-new_opportunity"
                          title="Leader Customer"
                          aria-hidden="true"
                        ></span>
                      </div>
                    </div>
                    <span v-else class="text-sm text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex flex-wrap gap-1">
                      <UTooltip
                        v-for="category in group.categories"
                        :key="category.id"
                        :text="category.name"
                        :popper="{ placement: 'top' }"
                      >
                        <UBadge
                          variant="soft"
                          color="primary"
                          size="xs"
                          class="cursor-help"
                        >
                          <span
                            aria-hidden="true"
                            class="slds-icon-glyph text-[16px]"
                            :class="getCategoryIcon(category.id)"
                          ></span>
                        </UBadge>
                      </UTooltip>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ group.alerts.length }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatLargeNumber(group.volume_last_30d) }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatLargeNumber(group.total_volume) }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <UBadge
                      :color="severityBadgeColor(group.highest_severity)"
                      variant="subtle"
                      size="sm"
                    >
                      {{ group.highest_severity }}
                    </UBadge>
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {{ formatRelative(group.latest_detected_at) }}
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-end gap-2">
                      <UButton
                        size="xs"
                        variant="ghost"
                        color="primary"
                        icon="i-heroicons-document-plus"
                        @click="openCareModalForCustomer(group.customer_id)"
                      >
                        Log Care
                      </UButton>
                      <UButton
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        icon="i-heroicons-clock"
                        @click="openHistoryModalForCustomer(group.customer_id)"
                      >
                        History
                      </UButton>
                      <UButton
                        size="xs"
                        variant="ghost"
                        color="primary"
                        @click="toggleCustomerGroup(group.customer_id)"
                      >
                        {{ expandedCustomers.has(group.customer_id) ? 'Hide' : 'Show' }} details
                      </UButton>
                    </div>
                  </td>
                </tr>
                <tr v-if="expandedCustomers.has(group.customer_id)">
                  <td colspan="11" class="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                    <div class="space-y-3">
                      <div
                        v-for="alert in group.alerts"
                        :key="alert.id"
                        class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
                      >
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div class="space-y-2">
                            <div class="flex items-center gap-2 flex-wrap">
                              <UBadge :color="severityBadgeColor(alert.severity)" variant="subtle" size="sm">
                                {{ alert.severity }}
                              </UBadge>
                              <UBadge :color="statusBadgeColor(alert.status)" variant="soft" size="sm">
                                {{ alert.status }}
                              </UBadge>
                              <span class="text-xs font-medium text-gray-500">
                                {{ alert.category_name || `Category #${alert.category_id}` }}
                              </span>
                            </div>
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">
                              {{ alert.rule_name || alert.rule_code }}
                            </p>
                            <p class="text-xs text-gray-500">
                              Rule: {{ alert.rule_code }} · Detected {{ formatRelative(alert.detected_at) }}
                            </p>
                            <p v-if="alert.message" class="text-sm text-gray-700 dark:text-gray-200">
                              {{ alert.message }}
                            </p>
                          </div>
                          <div class="flex flex-col items-start gap-2 text-xs text-gray-500 sm:items-end">
                            <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:text-gray-300">
                              <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
                              {{ formatDateTime(alert.detected_at) }}
                            </span>
                            <UButton
                              v-if="alert.status === 'active'"
                              size="xs"
                              variant="soft"
                              color="success"
                              @click="updateAlertStatus(alert.id, 'resolved')"
                            >
                              Resolve
                            </UButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
            <!-- Left: Items per page and info -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600 dark:text-gray-300">Items per page:</span>
                <USelect
                  v-model="itemsPerPage"
                  :items="[
                    { label: '10', value: 10 },
                    { label: '20', value: 20 },
                    { label: '50', value: 50 },
                    { label: '100', value: 100 },
                  ]"
                  class="w-20"
                  @update:model-value="currentPage = 1"
                />
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                Showing <span class="font-medium">{{ startIndex + 1 }}</span> to 
                <span class="font-medium">{{ endIndex }}</span> of 
                <span class="font-medium">{{ groupedAlerts.length }}</span> customers
              </div>
            </div>

            <!-- Right: Pagination controls -->
            <div class="flex items-center gap-3">
              <!-- First/Previous buttons -->
              <div class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-chevron-double-left"
                  :disabled="currentPage === 1"
                  @click="goToPage(1)"
                  size="sm"
                  class="hidden sm:flex"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-chevron-left"
                  :disabled="currentPage === 1"
                  @click="previousPage"
                  size="sm"
                />
              </div>

              <!-- Page numbers -->
              <div class="flex items-center gap-1">
                <template v-if="totalPages <= 7">
                  <UButton
                    v-for="page in totalPages"
                    :key="page"
                    :color="page === currentPage ? 'primary' : 'neutral'"
                    :variant="page === currentPage ? 'solid' : 'ghost'"
                    @click="goToPage(page)"
                    size="sm"
                    class="min-w-[2.5rem]"
                  >
                    {{ page }}
                  </UButton>
                </template>
                <template v-else>
                  <!-- First page -->
                  <UButton
                    :color="currentPage === 1 ? 'primary' : 'neutral'"
                    :variant="currentPage === 1 ? 'solid' : 'ghost'"
                    @click="goToPage(1)"
                    size="sm"
                    class="min-w-[2.5rem]"
                  >
                    1
                  </UButton>

                  <!-- Ellipsis before current range -->
                  <span v-if="visiblePages[0] > 2" class="px-2 text-gray-400">...</span>

                  <!-- Visible page range -->
                  <UButton
                    v-for="page in visiblePages"
                    :key="page"
                    :color="page === currentPage ? 'primary' : 'neutral'"
                    :variant="page === currentPage ? 'solid' : 'ghost'"
                    @click="goToPage(page)"
                    size="sm"
                    class="min-w-[2.5rem]"
                  >
                    {{ page }}
                  </UButton>

                  <!-- Ellipsis after current range -->
                  <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="px-2 text-gray-400">...</span>

                  <!-- Last page -->
                  <UButton
                    v-if="totalPages > 1"
                    :color="currentPage === totalPages ? 'primary' : 'neutral'"
                    :variant="currentPage === totalPages ? 'solid' : 'ghost'"
                    @click="goToPage(totalPages)"
                    size="sm"
                    class="min-w-[2.5rem]"
                  >
                    {{ totalPages }}
                  </UButton>
                </template>
              </div>

              <!-- Next/Last buttons -->
              <div class="flex items-center gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-chevron-right"
                  :disabled="currentPage === totalPages"
                  @click="nextPage"
                  size="sm"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-chevron-double-right"
                  :disabled="currentPage === totalPages"
                  @click="goToPage(totalPages)"
                  size="sm"
                  class="hidden sm:flex"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Log Care Interaction Modal -->
    <UModal
      v-model:open="isCareModalOpen"
      size="xl"
      :ui="{ content: 'max-w-4xl w-full', body: 'p-0' }"
      :title="selectedCareEntry ? `Log Care · ${selectedCareEntry.customer.full_name}` : 'Log Care Interaction'"
    >
      <template #body>
        <div v-if="selectedCareEntry" class="space-y-6 px-6 py-6">
          <section class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 shadow-sm">
            <div class="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-gray-500 uppercase">Customer</p>
                  <p class="text-base font-semibold text-gray-900 dark:text-white">
                    {{ selectedCareEntry.customer.full_name }}
                    <span class="ml-2 text-xs text-gray-500">#{{ selectedCareEntry.customer.id }}</span>
                  </p>
                </div>
                <UBadge
                  :color="selectedCareEntry.customer.tier === 'DIAMOND' ? 'primary' : selectedCareEntry.customer.tier === 'GOLD' ? 'warning' : selectedCareEntry.customer.tier === 'SILVER' ? 'info' : 'neutral'"
                  variant="soft"
                  class="px-3 py-1 text-xs"
                >
                  {{ selectedCareEntry.customer.tier }}
                </UBadge>
              </div>
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-gray-500 uppercase">Sales Owner</p>
                  <p class="text-base font-semibold text-gray-900 dark:text-white">
                    {{ selectedCareEntry.salesUser.full_name }}
                    <span class="ml-2 text-xs text-gray-500">{{ selectedCareEntry.salesUser.staff_code }}</span>
                  </p>
                </div>
                <div class="text-xs text-gray-500 text-right">
                  Assigned {{ formatDate(selectedCareEntry.assignment.assigned_at) }}
                  <span v-if="selectedCareEntry.assignment.note" class="block text-gray-400">"{{ selectedCareEntry.assignment.note }}"</span>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <header class="flex flex-col gap-1 border-b border-gray-200 dark:border-gray-700 px-6 py-5">
              <div class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <UIcon name="i-heroicons-document-text" class="h-4 w-4" />
                Interaction Details
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Log Care Interaction</h3>
              <p class="text-sm text-gray-500">Capture actionable notes so the team stays aligned with the customer's journey.</p>
            </header>

            <div class="px-6 py-6 space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Interaction Type</label>
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
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Channel</label>
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
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Interaction Date</label>
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
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Duration (minutes)</label>
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
                <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Subject</label>
                <div class="professional-input">
                  <UInput v-model="careForm.subject" placeholder="Optional subject line" class="w-full" />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Interaction Details</label>
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
                <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Attachments</label>
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

              <div class="flex flex-col gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <input type="checkbox" v-model="careForm.followUpRequired" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  Follow-up required
                </label>
                <div v-if="careForm.followUpRequired" class="space-y-2 md:w-1/3">
                  <label class="text-sm font-semibold text-gray-700 dark:text-gray-200">Follow-up Date</label>
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
          <div class="text-xs text-gray-500" v-if="selectedCareEntry">
            Logging as {{ selectedCareEntry.salesUser.staff_code }} · {{ selectedCareEntry.salesUser.full_name }}
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

    <!-- History Modal -->
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
            class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50/70 p-4 text-sm text-gray-600 dark:text-gray-300"
          >
            <p class="text-base font-semibold text-gray-900 dark:text-white">{{ historyEntry.customer.full_name }}</p>
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

              <div class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:border-emerald-200 transition-colors">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {{ getInteractionMeta(interaction.type).label }}
                    </p>
                    <div class="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                      <span v-if="interaction.channel">Channel: {{ interaction.channel }}</span>
                      <span v-if="interaction.duration_minutes">Duration: {{ interaction.duration_minutes }} mins</span>
                      <span v-if="interaction.subject" class="font-medium text-gray-700 dark:text-gray-200">Subject: {{ interaction.subject }}</span>
                    </div>
                  </div>
                  <span class="text-xs text-gray-500 whitespace-nowrap mt-1">{{ formatDate(interaction.interaction_date) }}</span>
                </div>

                <p v-if="interaction.detail" class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
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
                    class="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-xs text-gray-600 dark:text-gray-300"
                  >
                    <template v-if="isImageAttachment(attachment)">
                      <button
                        type="button"
                        class="flex items-center gap-2 text-left hover:text-emerald-600 transition-colors"
                        @click="openAttachmentViewer(interaction, attachment)"
                        :aria-label="`Preview ${attachment.file_name || 'image attachment'}`"
                      >
                        <div class="h-12 w-16 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                          <img
                            :src="attachment.file_url"
                            :alt="attachment.file_name || 'Attachment preview'"
                            class="h-full w-full object-cover"
                          />
                        </div>
                        <div class="flex flex-col">
                          <span class="font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
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
                          <UIcon :name="getAttachmentIcon(attachment.file_type)" class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div class="flex flex-col">
                          <span class="font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
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

    <!-- Image Viewer Gallery -->
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
import type { Customer } from '~/composables/useCustomers'
import type { SalesUserWithCustomers, CustomerAssignment } from '~/composables/useCustomerAssignments'
import type { CustomerInteraction, InteractionType } from '~/composables/useCustomerInteractions'
import { useCustomers } from '~/composables/useCustomers'
import { useCustomerAssignments } from '~/composables/useCustomerAssignments'
import { useCustomerInteractions } from '~/composables/useCustomerInteractions'
import { useCustomerGroups } from '~/composables/useCustomerGroups'
import { useImageViewer } from '~/composables/useImageViewer'

definePageMeta({
  middleware: ['auth'],
})

interface MonitoringDashboard {
  severity_counts: Record<string, number>
  category_counts: Array<{ category_id: number; category_name: string; total: number }>
  alerts: MonitoringAlert[]
  stats: {
    active_alerts: number
    resolved_today: number
    ignored_total: number
    customers_monitoring: number
  }
  transaction_summary: {
    customers_tracked: number
    total_transactions_30d: number
    total_volume_30d: number
    total_volume_prev_30d: number
    volume_change_ratio: number | null
  }
}

interface MonitoringAlert {
  id: number
  customer_id: number
  category_id: number
  category_name?: string
  rule_id: number
  rule_code: string
  rule_name: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'ignored'
  detected_at: string
  resolved_at: string | null
  updated_at: string | null
  message: string | null
  volume_last_30d?: number
  total_volume?: number
}

const defaultDashboard = (): MonitoringDashboard => ({
  severity_counts: {},
  category_counts: [],
  alerts: [],
  stats: {
    active_alerts: 0,
    resolved_today: 0,
    ignored_total: 0,
    customers_monitoring: 0,
  },
  transaction_summary: {
    customers_tracked: 0,
    total_transactions_30d: 0,
    total_volume_30d: 0,
    total_volume_prev_30d: 0,
    volume_change_ratio: null,
  },
})

const toast = useToast()
const auth = useAuth()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'

// Permissions
const { hasPermission } = usePermissions()
const canRefreshSummary = computed(() => hasPermission('monitoring', 'refreshSummary'))
const canRunRules = computed(() => hasPermission('monitoring', 'runRules'))

// Fetch customers and groups for customer info
const { fetchCustomers, getCachedCustomers } = useCustomers()
const { fetchSalesWithCustomers } = useCustomerAssignments()
const { fetchInteractionsByCustomer, createCustomerInteraction } = useCustomerInteractions()
const { fetchCustomerGroups, fetchGroupMembers } = useCustomerGroups()
const {
  galleryImages,
  attachmentGalleryRef,
  isViewerActive,
  isImageAttachment,
  getAttachmentIcon,
  openViewer,
} = useImageViewer()

// Fetch customers
const cachedCustomers = getCachedCustomers()
const {
  data: customers,
  pending: customersPending,
} = useAsyncData('monitoring-customers', () => fetchCustomers(), {
  default: () => cachedCustomers || [],
  lazy: true,
  server: false,
})

// Create customers map
const customersMap = computed(() => {
  const map = new Map<number, Customer>()
  for (const customer of customers.value || []) {
    const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
    if (Number.isFinite(numericId)) {
      map.set(numericId, customer)
    }
  }
  return map
})

// Helper to get customer info
const getCustomerInfo = (customerId: number): Customer | null => {
  return customersMap.value.get(customerId) || null
}

// Fetch groups and members for group info
const groupMembersMap = ref<Map<number, Array<{ customer_id: number }>>>(new Map())

const {
  data: groups,
} = useAsyncData('monitoring-groups', async () => {
  const groupsData = await fetchCustomerGroups()
  if (groupsData && groupsData.length > 0) {
    await Promise.all(
      groupsData.map(async (group) => {
        if (group.id) {
          try {
            const members = await fetchGroupMembers(group.id)
            groupMembersMap.value.set(group.id, members)
          } catch (error) {
            console.warn(`Failed to load members for group ${group.id}:`, error)
          }
        }
      })
    )
  }
  return groupsData
}, {
  default: () => [],
  lazy: true,
  server: false,
})

// Map customer_id to groups they belong to
const customerToGroupsMap = computed(() => {
  const map = new Map<number, Array<{ groupId: number; groupName: string; isLeader: boolean }>>()

  if (!groups.value) return map

  for (const group of groups.value) {
    if (!group.id) continue

    const members = groupMembersMap.value.get(group.id) || []
    for (const member of members) {
      const customerId = member.customer_id
      if (!map.has(customerId)) {
        map.set(customerId, [])
      }
      const isLeader = group.leader_customer_id === customerId
      map.get(customerId)!.push({
        groupId: group.id,
        groupName: group.name,
        isLeader,
      })
    }
  }

  return map
})

// Helper to get groups for a customer
const getCustomerGroups = (customerId: number): Array<{ groupId: number; groupName: string; isLeader: boolean }> => {
  return customerToGroupsMap.value.get(customerId) || []
}

const actionLoading = reactive({
  refreshSummary: false,
  runRules: false,
})

const manualReloading = ref(false)
const lastRefreshedAt = ref<Date | null>(null)

const getAuthHeaders = (): Record<string, string> => {
  const raw = auth?.getAuthHeaders?.() ?? {}
  return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      acc[key] = value
    }
    return acc
  }, {})
}

const fetchDashboard = async (): Promise<MonitoringDashboard> => {
  const response: { success?: boolean; data?: MonitoringDashboard } = await $fetch(
    `${apiBaseUrl}/monitoring/dashboard`,
    {
      headers: getAuthHeaders(),
    },
  )

  return response?.data ?? defaultDashboard()
}

const {
  data: dashboardData,
  pending: dashboardPending,
  refresh: refreshDashboard,
  error: dashboardError,
} = useLazyAsyncData<MonitoringDashboard>('monitoring-dashboard', fetchDashboard, {
  default: defaultDashboard,
  immediate: true,
  server: false,
})

interface MonitoringCategory {
  id: number
  name: string
  description: string | null
}

const alertFilters = reactive<{
  status: MonitoringAlert['status'] | null
  severity: MonitoringAlert['severity'] | null
  category_id: number | null
}>({
  status: 'active',
  severity: null,
  category_id: null,
  // Removed limit - backend now returns all alerts with caching
})

const currentPage = ref(1)
const itemsPerPage = ref(20)
const expandedCustomers = ref<Set<number>>(new Set())

// Sorting state
const sortField = ref<'customer_id' | 'alerts_count' | 'highest_severity' | 'latest_detected_at' | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

const fetchCategories = async (): Promise<MonitoringCategory[]> => {
  const response: { success?: boolean; data?: Array<{ id: number; name: string; description: string | null; rules?: unknown[] }> } = await $fetch(
    `${apiBaseUrl}/monitoring/categories`,
    {
      headers: getAuthHeaders(),
    },
  )
  return (response?.data ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
  }))
}

const {
  data: categoriesData,
  pending: categoriesPending,
  refresh: refreshCategories,
  error: categoriesError,
} = useLazyAsyncData<MonitoringCategory[]>('monitoring-categories', fetchCategories, {
  default: () => [],
  immediate: true,
  server: false,
})

const fetchAlerts = async (): Promise<MonitoringAlert[]> => {
  const params = new URLSearchParams()
  if (alertFilters.status) params.set('status', alertFilters.status)
  if (alertFilters.severity) params.set('severity', alertFilters.severity)
  if (alertFilters.category_id) params.set('category_id', String(alertFilters.category_id))
  // No limit - backend returns all alerts with 6h cache

  const response: { success?: boolean; data?: MonitoringAlert[] } = await $fetch(
    `${apiBaseUrl}/monitoring/alerts${params.toString() ? `?${params.toString()}` : ''}`,
    {
      headers: getAuthHeaders(),
    },
  )
  return response?.data ?? []
}

const {
  data: alertsData,
  pending: alertsPending,
  refresh: refreshAlerts,
  error: alertsError,
} = useLazyAsyncData<MonitoringAlert[]>('monitoring-alerts', fetchAlerts, {
  default: () => [],
  immediate: true,
  server: false,
})

watch(
  () => ({ ...alertFilters }),
  () => {
    currentPage.value = 1
    expandedCustomers.value.clear()
    refreshAlerts()
  },
  { deep: true },
)

watch(itemsPerPage, () => {
  currentPage.value = 1
})

watch(
  () => dashboardPending.value,
  (pending, previous) => {
    if (!pending && previous) {
      lastRefreshedAt.value = new Date()
    }
  },
)

const refreshAll = async () => {
  await Promise.all([refreshDashboard(), refreshAlerts()])
}

const handleManualReload = async () => {
  manualReloading.value = true
  try {
    await refreshAll()
  } finally {
    manualReloading.value = false
  }
}

const callMonitoringEndpoint = async (
  endpoint: string,
  key: keyof typeof actionLoading,
  successMessage: string,
) => {
  if (actionLoading[key]) return

  try {
    actionLoading[key] = true
    await $fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    toast.add({
      title: 'Request sent',
      description: successMessage,
      color: 'primary',
    })

    await refreshAll()
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Request failed. Please try again.'
    toast.add({
      title: 'Monitoring request failed',
      description: message,
      color: 'error',
    })
  } finally {
    actionLoading[key] = false
  }
}

const triggerRefreshSummary = () =>
  callMonitoringEndpoint(
    '/monitoring/refresh-summary',
    'refreshSummary',
    'Transaction summaries are being refreshed.',
  )

const triggerRunRules = () =>
  callMonitoringEndpoint('/monitoring/run-rules', 'runRules', 'Monitoring rules are running now.')

const numberFormatter = new Intl.NumberFormat()
const largeNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
})

const formatNumber = (value: number | null | undefined): string => {
  const numeric = Number(value ?? 0)
  return numberFormatter.format(Number.isFinite(numeric) ? numeric : 0)
}

const formatLargeNumber = (value: number | null | undefined): string => {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric) || numeric === 0) return '0'
  return largeNumberFormatter.format(numeric)
}

const formatPercentage = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '—'
  return percentFormatter.format(value / 100)
}

const formatDateTime = (date?: string | null) => {
  if (!date) return 'Unknown'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelative = (date?: string | null) => {
  if (!date) return 'just now'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'just now'
  const diff = Date.now() - parsed.getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const lastRefreshedLabel = computed(() => {
  if (!lastRefreshedAt.value) return ''
  return formatRelative(lastRefreshedAt.value.toISOString())
})

const summaryCards = computed(() => {
  const stats = dashboardData.value?.stats ?? defaultDashboard().stats
  return [
    {
      label: 'Active alerts',
      value: formatNumber(stats.active_alerts),
      caption: 'Currently flagged across all monitoring categories.',
      icon: 'i-heroicons-bell-alert',
      pillClass: 'bg-red-100 text-red-600',
    },
    {
      label: 'Resolved today',
      value: formatNumber(stats.resolved_today),
      caption: 'Alerts resolved within the current day.',
      icon: 'i-heroicons-check-badge',
      pillClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Ignored total',
      value: formatNumber(stats.ignored_total),
      caption: 'Alerts intentionally suppressed by reviewers.',
      icon: 'i-heroicons-eye-slash',
      pillClass: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Customers monitored',
      value: formatNumber(stats.customers_monitoring),
      caption: 'Unique customers with active monitoring results.',
      icon: 'i-heroicons-users',
      pillClass: 'bg-sky-100 text-sky-600',
    },
  ]
})

const transactionSummary = computed(
  () => dashboardData.value?.transaction_summary ?? defaultDashboard().transaction_summary,
)

const volumeChangeRatio = computed(() => {
  const numeric = Number(transactionSummary.value.volume_change_ratio ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
})

const previousVolume = computed(() => {
  const numeric = Number(transactionSummary.value.total_volume_prev_30d ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
})

const avgDailyTransactions = computed(() => {
  const numeric = Number(transactionSummary.value.total_transactions_30d ?? 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return numeric / 30
})

const avgDailyVolume = computed(() => {
  const numeric = Number(transactionSummary.value.total_volume_30d ?? 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return numeric / 30
})

const severityOrder: Array<MonitoringAlert['severity']> = ['critical', 'high', 'medium', 'low']

const severitySummary = computed(() => {
  const counts = dashboardData.value?.severity_counts ?? {}
  const total = Object.values(counts).reduce((sum, count) => sum + Number(count || 0), 0)

  const pillClasses: Record<MonitoringAlert['severity'], string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  }

  const icons: Record<MonitoringAlert['severity'], string> = {
    critical: 'i-heroicons-exclamation-circle',
    high: 'i-heroicons-exclamation-triangle',
    medium: 'i-heroicons-information-circle',
    low: 'i-heroicons-shield-check',
  }

  return severityOrder
    .map((severity) => {
      const count = Number(counts[severity] ?? 0)
      if (count === 0 && total === 0) return null
      return {
        label: severity,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        pillClass: pillClasses[severity],
        icon: icons[severity],
        caption: severity === 'critical'
          ? 'Immediate follow-up required'
          : severity === 'high'
            ? 'High-risk alerts awaiting action'
            : severity === 'medium'
              ? 'Moderate activity to review'
              : 'Low priority signals',
      }
    })
    .filter(Boolean) as Array<{
      label: string
      count: number
      percentage: number
      pillClass: string
      icon: string
      caption: string
    }>
})

const categoryBreakdown = computed(() =>
  (dashboardData.value?.category_counts ?? []).map((category) => ({
    ...category,
    initials: (category.category_name || '—').slice(0, 2).toUpperCase(),
  })),
)

const recentAlerts = computed(() => alertsData.value ?? [])

interface GroupedAlert {
  customer_id: number
  alerts: MonitoringAlert[]
  categories: Array<{ id: number; name: string }>
  highest_severity: MonitoringAlert['severity']
  latest_detected_at: string
  volume_last_30d: number
  total_volume: number
}

const groupedAlerts = computed<GroupedAlert[]>(() => {
  const alerts = recentAlerts.value
  if (!alerts.length) return []

  const groupsMap = new Map<number, MonitoringAlert[]>()

  for (const alert of alerts) {
    const customerId = alert.customer_id
    if (!groupsMap.has(customerId)) {
      groupsMap.set(customerId, [])
    }
    groupsMap.get(customerId)!.push(alert)
  }

  const severityPriority: Record<MonitoringAlert['severity'], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  const groups = Array.from(groupsMap.entries())
    .map(([customerId, alertList]) => {
      const categoriesMap = new Map<number, string>()
      for (const alert of alertList) {
        const catId = alert.category_id
        const catName = alert.category_name || `Category #${catId}`
        if (!categoriesMap.has(catId)) {
          categoriesMap.set(catId, catName)
        }
      }

      const sortedBySeverity = [...alertList].sort(
        (a, b) => severityPriority[b.severity] - severityPriority[a.severity],
      )
      const highestSeverity = sortedBySeverity[0].severity

      const sortedByDate = [...alertList].sort(
        (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
      )
      const latestDetected = sortedByDate[0].detected_at

      // Get volume from first alert (all alerts for same customer should have same volume)
      const volume_last_30d = alertList[0]?.volume_last_30d ?? 0
      const total_volume = alertList[0]?.total_volume ?? 0

      return {
        customer_id: customerId,
        alerts: alertList.sort(
          (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
        ),
        categories: Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name })),
        highest_severity: highestSeverity,
        latest_detected_at: latestDetected,
        volume_last_30d: Number(volume_last_30d) || 0,
        total_volume: Number(total_volume) || 0,
      }
    })

  // Apply sorting
  if (sortField.value) {
    return [...groups].sort((a, b) => {
      let comparison = 0

      switch (sortField.value) {
        case 'customer_id':
          comparison = a.customer_id - b.customer_id
          break
        case 'alerts_count':
          comparison = a.alerts.length - b.alerts.length
          break
        case 'highest_severity':
          comparison = severityPriority[b.highest_severity] - severityPriority[a.highest_severity]
          break
        case 'latest_detected_at':
          comparison = new Date(a.latest_detected_at).getTime() - new Date(b.latest_detected_at).getTime()
          break
      }

      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }

  // Default sort: by severity then by date
  return groups.sort((a, b) => {
    const severityDiff = severityPriority[b.highest_severity] - severityPriority[a.highest_severity]
    if (severityDiff !== 0) return severityDiff
    return new Date(b.latest_detected_at).getTime() - new Date(a.latest_detected_at).getTime()
  })
})

const totalPages = computed(() => {
  return Math.ceil(groupedAlerts.value.length / itemsPerPage.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage.value, groupedAlerts.value.length)
})

const paginatedGroups = computed(() => {
  return groupedAlerts.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(2, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value - 1, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(2, end - maxVisible + 1)
  }

  // Only show pages if there are more than 7 total pages
  if (totalPages.value > 7) {
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  } else {
    for (let i = 2; i <= totalPages.value - 1; i++) {
      pages.push(i)
    }
  }
  return pages
})

watch(
  () => currentPage.value,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  },
)

// Pagination functions
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Sort functions
const handleSort = (field: 'customer_id' | 'alerts_count' | 'highest_severity' | 'latest_detected_at') => {
  if (sortField.value === field) {
    // Toggle direction if same field
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new field with ascending direction
    sortField.value = field
    sortDirection.value = 'asc'
  }
  currentPage.value = 1 // Reset to first page when sorting
}

const getSortIcon = (field: 'customer_id' | 'alerts_count' | 'highest_severity' | 'latest_detected_at') => {
  if (sortField.value !== field) {
    return 'i-heroicons-arrows-up-down'
  }
  return sortDirection.value === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'
}

const statusItems: Array<{ label: string; value: MonitoringAlert['status'] | null }> = [
  { label: 'All statuses', value: null },
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Ignored', value: 'ignored' },
]

const severityItems: Array<{ label: string; value: MonitoringAlert['severity'] | null }> = [
  { label: 'All severities', value: null },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const categoryItems = computed(() => {
  const base = [{ label: 'All categories', value: null }]
  const items = (categoriesData.value ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))
  return [...base, ...items]
})

const limitItems: Array<{ label: string; value: number }> = [
  { label: '25 rows', value: 25 },
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '200 rows', value: 200 },
]

const severityBadgeColor = (severity: MonitoringAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return 'error'
    case 'high':
      return 'warning'
    case 'medium':
      return 'info'
    case 'low':
    default:
      return 'primary'
  }
}

const statusBadgeColor = (status: MonitoringAlert['status']) => {
  switch (status) {
    case 'active':
      return 'error'
    case 'resolved':
      return 'success'
    case 'ignored':
    default:
      return 'neutral'
  }
}

const handleRetryDashboard = () => refreshAll()
const handleAlertsRefresh = () => refreshAlerts()

const toggleCustomerGroup = (customerId: number) => {
  if (expandedCustomers.value.has(customerId)) {
    expandedCustomers.value.delete(customerId)
  } else {
    expandedCustomers.value.add(customerId)
  }
}

const getCategoryIcon = (categoryId: number): string => {
  // Map category ID to icon class - using category-related icons
  // Using modulo to cycle through different category-appropriate icons
  const icons = [
    'slds-icons-category',
    'slds-icons-label',
    'slds-icons-filter',
    'slds-icons-collection',
    'slds-icons-groups',
    'slds-icons-rules',
    'slds-icons-alert',
    'slds-icons-metrics',
  ]
  return icons[categoryId % icons.length]
}

const updateAlertStatus = async (alertId: number, status: 'active' | 'resolved' | 'ignored') => {
  try {
    await $fetch(`${apiBaseUrl}/monitoring/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: { status },
    })

    toast.add({
      title: 'Alert updated',
      description: `Alert status changed to ${status}.`,
      color: 'primary',
    })

    await refreshAlerts()
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Failed to update alert status.'
    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error',
    })
  }
}

// Fetch sales with customers for care interactions
const {
  data: salesWithCustomers,
} = useAsyncData('monitoring-sales-with-customers', () => fetchSalesWithCustomers(), {
  default: () => [],
  lazy: true,
  server: false,
})

// Create a map of customer id to sales user and assignment
const customerToSalesUserMap = computed(() => {
  const map = new Map<number, { salesUser: SalesUserWithCustomers; assignment: CustomerAssignment }>()
  if (!salesWithCustomers.value) return map

  for (const salesUser of salesWithCustomers.value) {
    for (const assignment of salesUser.customers) {
      const customerId = typeof assignment.customer_id === 'number'
        ? assignment.customer_id
        : Number(assignment.customer_id)
      if (Number.isFinite(customerId)) {
        map.set(customerId, { salesUser, assignment })
      }
    }
  }
  return map
})

// Interface for CareEntry
interface CareEntry {
  customer: Customer
  assignment: CustomerAssignment
  salesUser: SalesUserWithCustomers
  customerNumericId: number
}

// Helper to build CareEntry from customer ID
const buildCareEntryFromCustomerId = (customerId: number): CareEntry | null => {
  const customer = customersMap.value.get(customerId)
  if (!customer) return null

  const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
  if (!Number.isFinite(numericId)) return null

  const salesInfo = customerToSalesUserMap.value.get(numericId)
  if (!salesInfo) {
    // If no assignment, return null (can't log care without sales assignment)
    return null
  }

  return {
    customer,
    assignment: salesInfo.assignment,
    salesUser: salesInfo.salesUser,
    customerNumericId: numericId,
  }
}

// Care Interaction Modal
const isCareModalOpen = ref(false)
const selectedCareEntry = ref<CareEntry | null>(null)
const submitting = ref(false)

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

const formatDateInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toIsoString = (date: Date) => {
  return date.toISOString()
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

watch(
  () => careForm.followUpRequired,
  (required) => {
    if (!required) {
      careForm.followUpDate = null
    }
  }
)

watch(
  () => isCareModalOpen.value,
  (open) => {
    if (!open) {
      selectedCareEntry.value = null
      submitting.value = false
      Object.assign(careForm, defaultCareForm())
      attachmentError.value = null
    }
  }
)

const openCareModalForCustomer = async (customerId: number) => {
  const entry = buildCareEntryFromCustomerId(customerId)
  if (!entry) {
    toast.add({
      title: 'Unable to open care modal',
      description: 'Customer information or sales assignment not found.',
      color: 'warning',
    })
    return
  }
  selectedCareEntry.value = entry
  Object.assign(careForm, defaultCareForm())
  isCareModalOpen.value = true
}

const closeCareModal = () => {
  isCareModalOpen.value = false
}

const canSubmitCare = computed(() => {
  return (
    !!selectedCareEntry.value &&
    !!careForm.type &&
    !!careForm.interactionDate &&
    careForm.detail.trim().length > 0
  )
})

const submitCare = async () => {
  if (!selectedCareEntry.value) return
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
      customer_id: selectedCareEntry.value.customerNumericId,
      sales_user_id: selectedCareEntry.value.salesUser.sales_user_id,
      type: careForm.type,
      interaction_date: interactionDateIso,
      channel: careForm.channel?.trim() || null,
      duration_minutes: careForm.durationMinutes || null,
      subject: careForm.subject?.trim() || null,
      detail: careForm.detail?.trim() || null,
      follow_up_required: careForm.followUpRequired,
      follow_up_date: followUpIso,
      uploaded_by: selectedCareEntry.value.salesUser.sales_user_id,
      attachments: careForm.attachments,
    }

    await createCustomerInteraction(payload)

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

// History Modal
const isHistoryModalOpen = ref(false)
const historyEntry = ref<CareEntry | null>(null)
const historyInteractions = ref<CustomerInteraction[]>([])
const historyPending = ref(false)
const historyError = ref<string | null>(null)
const interactionCache = ref<Record<number, CustomerInteraction[]>>({})

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

const openHistoryModalForCustomer = async (customerId: number) => {
  const entry = buildCareEntryFromCustomerId(customerId)
  if (!entry) {
    toast.add({
      title: 'Unable to open history',
      description: 'Customer information not found.',
      color: 'warning',
    })
    return
  }
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

const openAttachmentViewer = async (
  interaction: CustomerInteraction,
  attachment: CustomerInteraction['attachments'][number],
) => {
  const images = (interaction.attachments || []) as Array<CustomerInteraction['attachments'][number] & { id?: number }>
  await openViewer(images, attachment, attachmentGalleryRef.value)
}

const formatDate = (dateString: string | null | undefined) => {
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
</style>