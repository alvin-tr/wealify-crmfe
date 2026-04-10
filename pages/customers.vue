<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
        <p class="text-sm text-gray-500 dark:text-white mt-1">Manage your customers</p>
      </div>
      <UButton
        v-if="isAdmin"
        :loading="isExporting"
        icon="i-heroicons-arrow-down-tray"
        color="primary"
        variant="soft"
        @click="exportToExcel"
      >
        Export Excel
      </UButton>
    </div>

    <!-- Stats: 3 columns -->
    <div v-if="!isStatsReady" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <UCard v-for="i in 3" :key="i">
        <div class="flex items-center justify-center py-8">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span class="text-sm text-gray-500 dark:text-white">Loading statistics...</span>
          </div>
        </div>
      </UCard>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <!-- Total Customers -->
      <UCard>
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-white">Total Customers</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ totalCustomers }}</p>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-white">
                <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-emerald-600" />
                <span>
                  Assigned to sales: 
                  <span class="font-semibold text-gray-900 dark:text-gray-100">{{ assignedCustomersCount }}</span>
                  / {{ totalCustomers }}
                  <span class="text-emerald-600 font-medium">({{ assignedPercentage }}%)</span>
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  :style="{ width: `${assignedPercentage}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div class="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <!-- Customers by Tier (single card) -->
      <UCard class="overflow-hidden">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium text-gray-700 dark:text-white">Customers by Tier</p>
          <UBadge color="neutral" variant="soft">{{ totalCustomers }} total</UBadge>
        </div>

        <div class="space-y-3">
          <div
            v-for="tierStat in tierStatistics"
            :key="tierStat.tier"
            class="flex items-center gap-3 p-3 rounded-lg transition-colors"
            :class="tierStat.visual.rowClass"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
              :class="tierStat.visual.iconWrapper"
            >
              <UIcon :name="tierStat.icon" class="w-5 h-5" :class="tierStat.visual.iconColor" />
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold" :class="tierStat.visual.accentText">
                  {{ tierStat.symbol }} {{ tierStat.displayLabel }}
                </p>
                <UBadge
                  :color="tierStat.visual.badgeColor"
                  variant="soft"
                  class="font-semibold"
                >
                  {{ tierStat.count }} · {{ tierStat.percentage }}%
                </UBadge>
              </div>
              <div
                class="mt-2 w-full h-2 rounded-full overflow-hidden"
                :class="tierStat.visual.trackClass"
              >
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="tierStat.visual.progressClass"
                  :style="{ width: `${tierStat.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- New customers this month -->
      <UCard>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-600 dark:text-white">New This Month</p>
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-gray-600 dark:text-white" />
            </div>
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ newUsersThisMonth }}</p>
          <p class="text-xs text-gray-500 dark:text-white">Registered in {{ currentMonthLabel }}</p>
        </div>
      </UCard>
    </div>

    <!-- Assign Sale Action -->
    <div v-if="selectedCustomers.length > 0" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700">
          {{ selectedCustomers.length }} customer(s) selected
        </span>
        <UButton color="error" variant="soft" @click="clearSelection">
          Clear Selection
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <UButton 
          v-if="canAddToGroup"
          color="primary" 
          variant="soft"
          icon="i-heroicons-user-group"
          @click="openAddToGroupModal"
        >
          Add to Group
        </UButton>
        <UButton 
          v-if="canAssignSale"
          color="primary" 
          icon="i-heroicons-user-plus"
          @click="openBulkAssignSaleModal"
        >
          Chuyển Sale (Bulk Assign)
        </UButton>
        <UButton 
          v-if="canAssignSale"
          color="primary" 
          variant="soft"
          icon="i-heroicons-sparkles"
          @click="openAutoAssignModal"
        >
          Auto Assign
        </UButton>
      </div>
    </div>

    <!-- Table Card -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col md:flex-row md:items-start gap-3 filters-container">
            <UInput
              v-model="searchQuery"
              placeholder="Search customers..."
              icon="i-heroicons-magnifying-glass"
              class="w-full md:w-64"
              @keyup.enter="applySearch"
            />
            <div class="flex flex-wrap items-center gap-2 w-full">
              <div class="filter-control">
                <USelect
                  v-model="filters.tier"
                  :items="tierFilterOptions"
                  placeholder="Filter by tier"
                  title="Filter by tier"
                  class="w-full"
                />
              </div>
              <div class="filter-control">
                <USelect
                  v-model="filters.status"
                  :items="statusFilterOptions"
                  placeholder="Filter by sale status"
                  title="Filter by sale status"
                  class="w-full"
                />
              </div>
              <div v-if="canUseSaleFilter" class="filter-control">
                <USelect
                  v-model="filters.sale"
                  :items="saleFilterOptions"
                  placeholder="Filter by sale"
                  title="Filter by sale"
                  class="w-full"
                />
              </div>
              <div class="filter-control">
                <UInput
                  v-model="filters.email"
                  placeholder="Filter by email"
                  icon="i-heroicons-envelope"
                  title="Filter by email"
                  class="w-full"
                />
              </div>
              <div class="filter-control">
                <UInput
                  v-model="filters.phone"
                  placeholder="Filter by phone"
                  icon="i-heroicons-phone"
                  title="Filter by phone"
                  class="w-full"
                />
              </div>
              <div class="filter-control">
                <UInput
                  v-model="filters.referral"
                  placeholder="Filter by referral code"
                  icon="i-heroicons-ticket"
                  title="Filter by referral code"
                  class="w-full"
                />
              </div>
              <div class="filter-control">
                <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                  <input
                    type="checkbox"
                    v-model="filters.hideZeroVolume"
                    id="hideZeroVolume"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label for="hideZeroVolume" class="text-sm text-gray-700 dark:text-white cursor-pointer">
                    Hide zero volume
                  </label>
                </div>
              </div>
              <div class="filter-control z-20 relative">
                <button
                  type="button"
                  class="w-full flex items-center justify-between min-w-[150px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="showColumnPicker = !showColumnPicker"
                >
                  <span v-if="selectedColumns.length">
                    {{ selectedColumns.length }} Cột
                  </span>
                  <span v-else>Chọn cột</span>
                  <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-2" />
                </button>
                
                <div
                  v-show="showColumnPicker"
                  class="absolute top-full left-0 mt-1 p-3 w-52 max-h-64 overflow-y-auto flex flex-col gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50"
                >
                  <label
                    v-for="col in availableColumns"
                    :key="col.key"
                    class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      v-model="selectedColumns"
                      :value="col.key"
                      class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-500 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
                    />
                    <span class="text-sm text-gray-700 dark:text-white select-none">{{ col.label }}</span>
                  </label>
                </div>
              </div>
              <div class="filter-control">
                <UInput
                  v-model="filters.createdFromDate"
                  type="date"
                  placeholder="From date"
                  icon="i-heroicons-calendar-days"
                  title="Filter by created date (from)"
                  class="w-full"
                  :max="filters.createdToDate || undefined"
                />
              </div>
              <div class="filter-control">
                <UInput
                  v-model="filters.createdToDate"
                  type="date"
                  placeholder="To date"
                  icon="i-heroicons-calendar"
                  title="Filter by created date (to)"
                  class="w-full"
                  :min="filters.createdFromDate || undefined"
                />
              </div>
              <div class="filter-action">
                <UButton 
                  icon="i-heroicons-arrow-path" 
                  variant="soft" 
                  color="primary" 
                  size="sm"
                  @click="resetFilters"
                  :disabled="!hasActiveFilters"
                  aria-label="Reset filters"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="pending || (isSalesRole && !isStatsReady)" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-white">Loading customers...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-12 text-center">
        <p class="text-red-600">Error loading customers: {{ error.message }}</p>
        <UButton color="primary" variant="soft" @click="() => refresh()" class="mt-4">
          Retry
        </UButton>
      </div>

      <!-- Table -->
      <template v-else>

      <!-- Pagination (Moved to Top) -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <!-- Left: Items per page and info -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 dark:text-white">Items per page:</span>
              <ClientOnly>
                <USelectMenu value-key="value" label-key="label"
                  v-model="itemsPerPage"
                  :items="itemsPerPageOptions"
                  class="w-32"
                  @update:model-value="currentPage = 1"
                />
              </ClientOnly>
            </div>
            <div class="text-sm text-gray-600 dark:text-white">
              Showing <span class="font-medium">{{ startIndex + 1 }}</span> to 
              <span class="font-medium">{{ endIndex }}</span> of 
              <span class="font-medium">{{ filteredCustomers.length }}</span> customers
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
              <div class="contents" v-if="totalPages <= 7">
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

              </div>

              <div class="contents" v-else>
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
              </div>
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

            <!-- Jump to page (optional) -->
            <div v-if="totalPages > 10" class="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-white">Go to:</span>
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

        <div class="overflow-x-auto pb-4">
        <table class="w-full relative border-collapse table-fixed">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <th class="w-[3%] truncate overflow-hidden px-2 py-3 text-left" v-if="isShowColumn('select')">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="toggleSelectAll"
                  class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </th>
              <th 
                class="w-[4%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/30 select-none"
                @click="toggleSort('id')"
                v-if="isShowColumn('id')"
              >
                <div class="flex items-center gap-1">
                  <span>ID</span>
                  <UIcon 
                    v-if="sortColumn === 'id'"
                    :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <UIcon 
                    v-else
                    name="i-heroicons-arrows-up-down"
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </th>
              <th class="w-[10%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('full_name')">
                Full Name
              </th>
              <th class="w-[10%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('email')">
                Email
              </th>
              <th class="w-[8%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('phone')">
                Phone
              </th>
              <th class="w-[6%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('source')">
                Nguồn
              </th>
              <th class="w-[6%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('group')">
                Group
              </th>
              <th class="w-[7%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('tier')">
                Tier
              </th>
              <th 
                class="w-[7%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/30 select-none"
                @click="toggleSort('volume_30d')"
                v-if="isShowColumn('volume_30d')"
              >
                <div class="flex items-center gap-1">
                  <span>Volume(30d)</span>
                  <UIcon 
                    v-if="sortColumn === 'volume_30d'"
                    :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <UIcon 
                    v-else
                    name="i-heroicons-arrows-up-down"
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </th>
              <th 
                class="w-[6%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/30 select-none"
                @click="toggleSort('volume_7d')"
                v-if="isShowColumn('volume_7d')"
              >
                <div class="flex items-center gap-1">
                  <span>Volume(7d)</span>
                  <UIcon 
                    v-if="sortColumn === 'volume_7d'"
                    :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <UIcon 
                    v-else
                    name="i-heroicons-arrows-up-down"
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </th>
              <th 
                class="w-[6%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/30 select-none"
                @click="toggleSort('volume_today')"
                v-if="isShowColumn('volume_today')"
              >
                <div class="flex items-center gap-1">
                  <span>Volume(Today)</span>
                  <UIcon 
                    v-if="sortColumn === 'volume_today'"
                    :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <UIcon 
                    v-else
                    name="i-heroicons-arrows-up-down"
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </th>
              <th 
                class="w-[7%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/30 select-none"
                @click="toggleSort('total_volume')"
                v-if="isShowColumn('total_volume')"
              >
                <div class="flex items-center gap-1">
                  <span>Total Vol</span>
                  <UIcon 
                    v-if="sortColumn === 'total_volume'"
                    :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-4 h-4 text-gray-500 dark:text-white"
                  />
                  <UIcon 
                    v-else
                    name="i-heroicons-arrows-up-down"
                    class="w-4 h-4 text-gray-300"
                  />
                </div>
              </th>
              <th class="w-[7%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('registered_at')">
                Registered
              </th>
              <th class="w-[7%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('note')">
                Note
              </th>
              <th v-if="!isSalesRole && isShowColumn('sale')" class="w-[8%] truncate overflow-hidden px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                Sale
              </th>
              <th class="w-[8%] min-w-[120px] px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider" v-if="isShowColumn('action')">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="customer in paginatedCustomers"
              :key="customer.customer_id"
              class="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
              :class="{ 'bg-green-50': isSelected(customer.customer_id) }"
            >
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden" v-if="isShowColumn('select')">
                <input
                  type="checkbox"
                  :checked="isSelected(customer.customer_id)"
                  @change="toggleSelect(customer.customer_id)"
                  class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-900 dark:text-gray-100 font-mono" v-if="isShowColumn('id')">
                {{ customer.id || '-' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-900 dark:text-gray-100 font-medium" v-if="isShowColumn('full_name')">
                <div class="max-w-[150px] truncate cursor-help" v-tippy="customer.full_name">
                  {{ customer.full_name }}
                </div>
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-600 dark:text-white" v-if="isShowColumn('email')">
                <div class="max-w-[180px] truncate cursor-help" v-tippy="customer.email">
                  {{ customer.email }}
                </div>
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-600 dark:text-white" v-if="isShowColumn('phone')">
                {{ customer.phone_number || '-' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-600 dark:text-white" v-if="isShowColumn('source')">
                {{ customer.source_name || '-' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden" v-if="isShowColumn('group')">
                <div v-if="getCustomerGroups(customer.id ?? customer.customer_id).length > 0" class="flex flex-col gap-1">
                  <div
                    v-for="groupInfo in getCustomerGroups(customer.id ?? customer.customer_id)"
                    :key="groupInfo.groupId"
                    class="flex items-center gap-2"
                  >
                    <span class="text-sm text-gray-900 dark:text-gray-100 font-semibold">{{ groupInfo.groupName }}</span>
                    <span
                      v-if="groupInfo.isLeader"
                      class="slds-icon-glyph text-[16px] text-yellow-500 slds-icons-new_opportunity"
                      title="Leader Customer"
                      aria-hidden="true"
                    ></span>
                  </div>
                </div>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden" v-if="isShowColumn('tier')">
                <UBadge
                  :color="customer.tier === 'STANDARD' ? 'neutral' : 'primary'"
                  variant="soft"
                >
                  {{ customer.tier }}
                </UBadge>
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-900 dark:text-gray-100 font-semibold" v-if="isShowColumn('volume_30d')">
                {{ customer.volume_last_30d !== undefined ? formatLargeNumber(customer.volume_last_30d) : '—' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-900 dark:text-gray-100 font-semibold" v-if="isShowColumn('volume_7d')">
                {{ customer.volume_last_7d !== undefined ? formatLargeNumber(customer.volume_last_7d) : '—' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-900 dark:text-gray-100 font-semibold" v-if="isShowColumn('volume_today')">
                {{ customer.volume_last_1d !== undefined ? formatLargeNumber(customer.volume_last_1d) : '—' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-900 dark:text-gray-100 font-semibold" v-if="isShowColumn('total_volume')">
                {{ customer.total_volume !== undefined ? formatLargeNumber(customer.total_volume) : '—' }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-600 dark:text-white whitespace-nowrap" v-if="isShowColumn('registered_at')">
                {{ formatDate(customer.registered_at) }}
              </td>
              <td class="px-2 py-4 truncate max-w-0 overflow-hidden text-sm text-gray-600 dark:text-white" v-if="isShowColumn('note')">
                <div class="flex items-center gap-2">
                  <span
                    v-if="getAssignmentNote(customer.id ?? customer.customer_id)"
                    class="block max-w-[150px] truncate cursor-help flex-1"
                    v-tippy="getAssignmentNote(customer.id ?? customer.customer_id) || ''"
                  >
                    {{ getAssignmentNote(customer.id ?? customer.customer_id) }}
                  </span>
                  <span v-else class="text-gray-400 flex-1">—</span>
                  <UButton
                    v-if="getSalesUserForCustomer(customer.id ?? customer.customer_id)"
                    icon="i-heroicons-pencil-square"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    class="!px-1.5 !py-1.5 flex-shrink-0"
                    @click="openEditNoteModal(customer)"
                  />
                </div>
              </td>
              <td v-if="!isSalesRole && isShowColumn('sale')" class="px-2 py-4 truncate max-w-0 overflow-hidden">
                <template v-if="getSalesUserForCustomer(customer.id ?? customer.customer_id)">
                  <div class="flex items-center gap-2">
                    <UAvatar 
                      :src="getSalesUserForCustomer(customer.id ?? customer.customer_id)?.avatar" 
                      :alt="getSalesUserForCustomer(customer.id ?? customer.customer_id)?.full_name" 
                      size="sm" 
                      class="flex-shrink-0"
                    />
                    <span class="text-sm text-gray-900 dark:text-gray-100 font-medium truncate min-w-0 flex-1">
                      {{ getSalesUserForCustomer(customer.id ?? customer.customer_id)?.full_name }}
                    </span>
                    <UButton 
                      icon="i-heroicons-information-circle"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      @click="openSalesUserDetailModal(customer.id ?? customer.customer_id)"
                    />
                  </div>
                </template>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
              <td class="px-2 py-4 whitespace-nowrap" v-if="isShowColumn('action')">
                <div class="flex items-center gap-2">
                  <UButton
                    v-if="isAdmin"
                    size="xs"
                    color="primary"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    @click="openEditCustomerModal(customer)"
                    class="!px-1.5 !py-1.5"
                    title="Edit Customer"
                  />
                  <UBadge
                    v-if="selectedSalesUserId && customerActionMeta(customer).label"
                    :color="customerActionMeta(customer).color"
                    variant="soft"
                  >
                    {{ customerActionMeta(customer).label }}
                  </UBadge>
                  <UButton
                    size="xs"
                    color="primary"
                    variant="soft"
                    @click="openCareModal(customer)"
                    :disabled="!getSalesUserForCustomer(customer.id ?? customer.customer_id)"
            class="!px-1.5 !py-1.5"
                  >
                    <span class="slds-icon-glyph text-[16px] text-primary-600 slds-icons-questions_and_answers" aria-hidden="true"></span>
                  </UButton>
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="soft"
                    @click="openHistoryModal(customer)"
            class="!px-1.5 !py-1.5"
                  >
                    <span class="slds-icon-glyph text-[16px] text-gray-600 dark:text-white slds-icons-clock" aria-hidden="true"></span>
                  </UButton>
                  <UButton
                    size="xs"
                    color="primary"
                    variant="soft"
                    @click="openCustomerInfoModal(customer)"
            class="!px-1.5 !py-1.5"
                  >
                    <span class="slds-icon-glyph text-[16px] text-primary-600 slds-icons-preview" aria-hidden="true"></span>
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="filteredCustomers.length === 0" class="py-12 text-center">
          <p class="text-gray-500 dark:text-white">No customers found</p>
        </div>
      </div>
      </template>
    </UCard>

    <!-- Edit Customer Modal (Admin Only) -->
    <UModal v-model:open="isEditCustomerOpen" title="Edit Customer Profile">
      <template #body>
        <form @submit.prevent="submitEditCustomer" class="space-y-4">
          <UFormGroup label="Full Name">
            <UInput v-model="editCustomerPayload.full_name" placeholder="John Doe" required />
          </UFormGroup>
          <UFormGroup label="Email">
            <UInput v-model="editCustomerPayload.email" type="email" placeholder="john@example.com" required />
          </UFormGroup>
          <UFormGroup label="Phone Number">
            <UInput v-model="editCustomerPayload.phone_number" placeholder="+123456789" />
          </UFormGroup>
          <UFormGroup label="Tier">
            <USelect v-model="editCustomerPayload.tier" :options="['STANDARD', 'SILVER', 'GOLD', 'DIAMOND']" />
          </UFormGroup>
          <UFormGroup label="Referral Code">
            <UInput v-model="editCustomerPayload.referral_code" />
          </UFormGroup>
          <UFormGroup label="Source ID">
            <UInput v-model.number="editCustomerPayload.source_id" type="number" placeholder="Optional Lead Source ID" />
          </UFormGroup>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="isEditCustomerOpen = false" :disabled="isEditingCustomer">
            Cancel
          </UButton>
          <UButton color="primary" @click="submitEditCustomer" :loading="isEditingCustomer">
            Save Changes
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Assign Sale Modal -->
    <UModal v-model:open="isAssignSaleOpen" :title="isBulkAssign ? 'Assign Sales User to Multiple Customers' : 'Assign Sales User'">
      <template #body>
        <div class="space-y-4">
          <div v-if="isBulkAssign">
            <p class="text-sm text-gray-600 dark:text-white mb-2">
              Assign sales user to <span class="font-semibold text-gray-900 dark:text-gray-100">{{ selectedCustomers.length }}</span> selected customer(s):
            </p>
            <div class="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white">
              <table class="min-w-full table-fixed text-xs text-gray-700">
                <thead class="bg-gray-100 text-gray-500 dark:text-white">
                  <tr>
                    <th class="px-3 py-2 w-12 text-left">#</th>
                    <th class="px-3 py-2 w-16 text-left">ID</th>
                    <th class="px-3 py-2 w-32 text-left">Customer</th>
                    <th class="px-3 py-2 w-40 text-left">Email</th>
                    <th class="px-3 py-2 w-40 text-left">Current Sales</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detail in selectedCustomersDetailed"
                    :key="detail.code"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2 text-gray-400 font-mono">{{ detail.index + 1 }}</td>
                    <td class="px-3 py-2 text-gray-500 dark:text-white font-mono text-[11px]">
                      {{ detail.numericId ?? detail.code }}
                    </td>
                    <td class="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium">
                      {{ detail.fullName }}
                    </td>
                    <td class="px-3 py-2">{{ detail.email || '—' }}</td>
                    <td class="px-3 py-2">
                      <div v-if="detail.currentSalesUser" class="space-y-0.5">
                        <p class="text-gray-900 dark:text-gray-100 font-medium">
                          {{ detail.currentSalesUser.full_name }}
                        </p>
                        <p class="text-[11px] text-gray-400">
                          {{ detail.currentSalesUser.staff_code }}
                        </p>
                        <p v-if="detail.assignmentNote" class="text-[11px] text-gray-400 italic">
                          “{{ detail.assignmentNote }}”
                        </p>
                      </div>
                      <span v-else class="text-gray-400">Unassigned</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else>
            <div class="space-y-1">
              <p class="text-sm text-gray-600 dark:text-white">Assign sales user to:</p>
              <p class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ selectedCustomer?.full_name }}</p>
              <p class="text-xs text-gray-500 dark:text-white">{{ selectedCustomer?.email }}</p>
            </div>
            <div
              v-if="singleSelectedCustomerDetail"
              class="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-xs text-gray-600 dark:text-white space-y-1"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Current:
                  <span v-if="singleSelectedCustomerDetail.currentSalesUser" class="font-medium text-gray-900 dark:text-gray-100">
                    {{ singleSelectedCustomerDetail.currentSalesUser.full_name }}
                    <span class="text-gray-400">
                      ({{ singleSelectedCustomerDetail.currentSalesUser.staff_code }})
                    </span>
                  </span>
                  <span v-else class="text-gray-400">Unassigned</span>
                </span>
                <UBadge
                  v-if="selectedSalesUserId"
                  :color="singleSelectedCustomerDetail.actionColor"
                  variant="soft"
                >
                  {{ singleSelectedCustomerDetail.actionLabel }}
                </UBadge>
              </div>
              <div
                v-if="singleSelectedCustomerDetail.assignmentDate"
                class="text-[11px] text-gray-400"
              >
                Assigned on {{ singleSelectedCustomerDetail.assignmentDate }}
              </div>
              <div
                v-if="singleSelectedCustomerDetail.assignmentNote"
                class="text-[11px] text-gray-400 italic"
              >
                “{{ singleSelectedCustomerDetail.assignmentNote }}”
              </div>
            </div>
          </div>
          
          <div v-if="salesUsersPending" class="py-4 text-center text-gray-500 dark:text-white">
            Loading sales users...
          </div>
          <div v-else-if="salesUsersError" class="py-4 text-center text-red-600">
            Error loading sales users: {{ salesUsersError.message }}
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Sales User</label>
            <div v-if="salesUsersOptions.length === 0" class="text-sm text-gray-500 dark:text-white py-2">
              No sales users available
            </div>
            <select
              v-else
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
            <div v-if="selectedSalesUser" class="mt-3 flex items-center gap-2 rounded-md bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm text-gray-600 dark:text-white">
              <UIcon name="i-heroicons-user-circle" class="w-4 h-4 text-gray-500 dark:text-white" />
              <span>
                Assigning to <span class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSalesUser.full_name }}</span>
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
            <p class="mt-1 text-xs text-gray-400">
              You can leave a note to give more context for this assignment.
            </p>
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
            @click="handleAssignSale" 
            :loading="assigning"
            :disabled="!selectedSalesUserId || (isBulkAssign && selectedCustomers.length === 0)"
          >
            Assign
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Auto Assign Modal -->
    <UModal v-model:open="isAutoAssignOpen" title="Auto Assign Customers to Sales Users" size="xl">
      <template #body>
        <div class="space-y-6">
          <!-- Customers List -->
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">
              Distributing <span class="font-semibold text-gray-900 dark:text-gray-100">{{ selectedCustomers.length }}</span> selected customer(s):
            </p>
            <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white">
              <table class="min-w-full table-fixed text-xs text-gray-700">
                <thead class="bg-gray-100 text-gray-500 dark:text-white">
                  <tr>
                    <th class="px-3 py-2 w-12 text-left">#</th>
                    <th class="px-3 py-2 w-16 text-left">ID</th>
                    <th class="px-3 py-2 w-40 text-left">Customer</th>
                    <th class="px-3 py-2 w-40 text-left">Email</th>
                    <th class="px-3 py-2 w-40 text-left">Current Sales</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detail in selectedCustomersDetailed"
                    :key="detail.code"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2 text-gray-400 font-mono">{{ detail.index + 1 }}</td>
                    <td class="px-3 py-2 text-gray-500 dark:text-white font-mono text-[11px]">
                      {{ detail.numericId ?? detail.code }}
                    </td>
                    <td class="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium">
                      {{ detail.fullName }}
                    </td>
                    <td class="px-3 py-2">{{ detail.email || '—' }}</td>
                    <td class="px-3 py-2">
                      <div v-if="detail.currentSalesUser" class="space-y-0.5">
                        <p class="text-gray-900 dark:text-gray-100 font-medium text-[11px]">
                          {{ detail.currentSalesUser.full_name }}
                        </p>
                        <p class="text-[10px] text-gray-400">
                          {{ detail.currentSalesUser.staff_code }}
                        </p>
                      </div>
                      <span v-else class="text-gray-400 text-[11px]">Unassigned</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Sales Users Selection -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-gray-700">
                Select Sales Users to Distribute Customers
              </label>
              <div v-if="salesUsers && salesUsers.length > 0" class="flex items-center gap-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="primary"
                  @click="selectAllSalesUsers"
                  :disabled="allSalesUsersSelected"
                >
                  Select All
                </UButton>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="deselectAllSalesUsers"
                  :disabled="autoAssignSelectedSalesUsers.length === 0"
                >
                  Deselect All
                </UButton>
              </div>
            </div>
            <div v-if="salesUsersPending" class="py-4 text-center text-gray-500 dark:text-white">
              Loading sales users...
            </div>
            <div v-else-if="salesUsersError" class="py-4 text-center text-red-600">
              Error loading sales users: {{ salesUsersError.message }}
            </div>
            <div v-else-if="!salesUsers || salesUsers.length === 0" class="text-sm text-gray-500 dark:text-white py-2">
              No sales users available
            </div>
            <div v-else class="space-y-1 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white p-2">
              <div
                v-for="user in salesUsers"
                :key="user.staff_code"
                class="flex items-center gap-3 p-2.5 rounded-md hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
                :class="{ 'bg-primary-50': autoAssignSelectedSalesUsers.includes(user.staff_code) }"
              >
                <input
                  type="checkbox"
                  :id="`auto-assign-${user.staff_code}`"
                  :checked="autoAssignSelectedSalesUsers.includes(user.staff_code)"
                  @change="toggleAutoAssignSalesUser(user.staff_code)"
                  class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label
                  :for="`auto-assign-${user.staff_code}`"
                  class="flex-1 flex items-center gap-3 cursor-pointer"
                >
                  <UAvatar 
                    :src="user.avatar || undefined" 
                    :alt="user.full_name" 
                    size="sm" 
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ user.full_name }}</p>
                    <p class="text-xs text-gray-500 dark:text-white">{{ user.staff_code }}</p>
                    <p v-if="user.department" class="text-xs text-gray-400 mt-0.5">{{ user.department }}</p>
                  </div>
                </label>
                <UBadge
                  v-if="autoAssignSelectedSalesUsers.includes(user.staff_code)"
                  color="primary"
                  variant="soft"
                  size="xs"
                >
                  Selected
                </UBadge>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <p class="text-xs text-gray-400">
                {{ autoAssignSelectedSalesUsers.length }} of {{ salesUsers?.length || 0 }} sales user(s) selected
              </p>
              <p v-if="autoAssignSelectedSalesUsers.length > 0 && selectedCustomers.length > 0" class="text-xs text-primary-600 font-medium">
                ~{{ Math.ceil(selectedCustomers.length / autoAssignSelectedSalesUsers.length) }} customers per user
              </p>
            </div>
          </div>

          <!-- Distribution Preview -->
          <div v-if="autoAssignSelectedSalesUsers.length > 0 && selectedCustomers.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Distribution Preview
            </label>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2">
              <div
                v-for="(distribution, index) in autoAssignDistributionPreview"
                :key="index"
                class="flex items-center justify-between text-sm"
              >
                <div class="flex items-center gap-2">
                  <UAvatar 
                    :src="distribution.salesUser.avatar || undefined" 
                    :alt="distribution.salesUser.full_name" 
                    size="xs" 
                  />
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{ distribution.salesUser.full_name }}</span>
                  <span class="text-gray-500 dark:text-white text-xs">({{ distribution.salesUser.staff_code }})</span>
                </div>
                <UBadge color="primary" variant="soft">
                  {{ distribution.customerCount }} customer(s)
                </UBadge>
              </div>
              <div class="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <div class="flex items-center justify-between text-sm font-medium">
                  <span class="text-gray-700">Total:</span>
                  <span class="text-gray-900 dark:text-gray-100">{{ selectedCustomers.length }} customer(s)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Note -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Note <span class="text-gray-400">(optional)</span>
            </label>
            <textarea
              v-model="autoAssignNote"
              class="w-full min-h-[80px] resize-y rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add an optional note for these assignments..."
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
            @click="handleAutoAssign" 
            :loading="autoAssigning"
            :disabled="autoAssignSelectedSalesUsers.length === 0 || selectedCustomers.length === 0"
          >
            Auto Assign
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Sales User Detail Modal -->
    <UModal v-model:open="isSalesUserDetailOpen" title="Sales User Details">
      <template #body>
        <div v-if="selectedSalesUserDetail" class="space-y-4">
          <div class="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <UAvatar 
              :src="selectedSalesUserDetail.avatar" 
              :alt="selectedSalesUserDetail.full_name" 
              size="lg" 
            />
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ selectedSalesUserDetail.full_name }}</h3>
              <p class="text-sm text-gray-500 dark:text-white">{{ selectedSalesUserDetail.staff_code }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Email</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ selectedSalesUserDetail.email }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Phone</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ selectedSalesUserDetail.phone || '-' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Department</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ selectedSalesUserDetail.department || '-' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Total Customers</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1 font-semibold">{{ selectedSalesUserDetail.total_customers }}</p>
            </div>
            <div v-if="selectedCustomerAssignment && selectedCustomerId" class="col-span-2">
              <label class="text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Assigned At</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ getAssignmentDate(selectedCustomerId) }}</p>
            </div>
            <div v-if="selectedCustomerAssignment?.note" class="col-span-2">
              <label class="text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Note</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ selectedCustomerAssignment.note }}</p>
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end">
          <UButton 
            color="neutral" 
            variant="ghost" 
            @click="close"
          >
            Close
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Customer Detail Modal -->
    <CustomerCareCustomerDetailModal
      v-model:open="isCustomerInfoOpen"
      :customer="customerInfoCustomer"
      :sales-user-info="customerInfoDetail"
      :customer-numeric-id="customerInfoDetail?.numericId ?? null"
      @close="closeCustomerInfoModal"
    />

    <!-- Add to Group Modal -->
    <UModal
      v-model:open="isAddToGroupModalOpen"
      title="Add Customers to Group"
      size="lg"
    >
      <template #body>
        <div class="space-y-6">
          <div>
            <p class="text-sm text-gray-600 dark:text-white mb-2">
              Add <span class="font-semibold text-gray-900 dark:text-gray-100">{{ selectedCustomers.length }}</span> selected customer(s) to a group:
            </p>
            <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white p-3">
              <div class="space-y-1">
                <div
                  v-for="(customerCode, index) in selectedCustomers"
                  :key="customerCode"
                  class="text-xs text-gray-600 dark:text-white"
                >
                  {{ index + 1 }}. {{ getCustomerByCode(customerCode)?.full_name || customerCode }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Select Group
            </label>
            <USelect
              v-model="selectedGroupId"
              :items="groupOptions"
              placeholder="Select a group"
              size="lg"
              class="w-full"
              :disabled="groupsPending"
              searchable
            />
            <p class="text-xs text-gray-500 dark:text-white">
              Choose an existing group to add customers to. Note: Each customer can only belong to one group at a time.
            </p>
          </div>

          <div v-if="selectedGroupId && selectedGroup" class="space-y-3">
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-blue-900">
                    Auto-assignment notice
                  </p>
                  <p class="text-xs text-blue-700 mt-1">
                    Customers will be automatically assigned to <span class="font-semibold">{{ selectedGroup.owner_name || 'the group owner' }}</span> (the group's owner).
                    Any existing assignments will be ended.
                  </p>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-amber-900">
                    Important constraint
                  </p>
                  <p class="text-xs text-amber-700 mt-1">
                    Each customer can only belong to one group at a time. If a selected customer is already in another group, they will not be added and you'll see an error message.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedGroupId" class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Note <span class="text-gray-400 text-xs font-normal">(optional)</span>
            </label>
            <UTextarea
              v-model="addToGroupNote"
              placeholder="Add a note for these members"
              :rows="3"
            />
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="addingToGroup"
            :disabled="!selectedGroupId"
            @click="handleAddToGroup"
          >
            Add to Group
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Care Interaction Modal -->
    <CustomerCareCareInteractionModal
      v-model:open="isCareModalOpen"
      :customer="careSelectedCustomer"
      :sales-user="careSelectedSalesUser"
      :assignment-date="careAssignmentDate"
      :assignment-note="careAssignmentNote"
      :submitting="careSubmitting"
      @submit="handleCareSubmit"
      @close="closeCareModal"
    />

    <!-- Care History Modal -->
    <CustomerCareCareHistoryModal
      v-model:open="isCareHistoryModalOpen"
      :customer="careHistoryCustomer"
      :interactions="careHistoryInteractions"
      :pending="careHistoryPending"
      :error="careHistoryError"
      @close="closeCareHistoryModal"
    />

    <!-- Edit Note Modal -->
    <UModal
      v-model:open="isEditNoteModalOpen"
      title="Edit Assignment Note"
    >
      <template #body>
        <div v-if="editNoteCustomer" class="space-y-4">
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-700">Customer</p>
            <p class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ editNoteCustomer.full_name }}
              <span class="ml-2 text-xs text-gray-500 dark:text-white">#{{ editNoteCustomer.id || editNoteCustomer.customer_id }}</span>
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
import type { SalesUser } from '~/composables/useSalesUsers'
import type { SalesUserWithCustomers, CustomerAssignment } from '~/composables/useCustomerAssignments'
import type { CustomerInteraction } from '~/composables/useCustomerInteractions'
import CustomerCareCareInteractionModal from '~/components/customer-care/CareInteractionModal.vue'
import CustomerCareCareHistoryModal from '~/components/customer-care/CareHistoryModal.vue'
import CustomerCareCustomerDetailModal from '~/components/customer-care/CustomerDetailModal.vue'

// Fetch customers with caching
const { fetchCustomers, invalidateCache, getCachedCustomers, updateCustomer, fetchConversionAnalytics } = useCustomers()
const { fetchSalesUsers } = useSalesUsers()
const { fetchSalesWithCustomers, assignOrTransferCustomers, updateSingleAssignmentNote } = useCustomerAssignments()
const { fetchCustomerGroups, addGroupMembers, fetchGroupMembers } = useCustomerGroups()
const { fetchInteractionsByCustomer, createCustomerInteraction } = useCustomerInteractions()

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

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
const toast = useToast()
const auth = useAuth()

// Permissions
const { hasPermission } = usePermissions()
const canAddToGroup = computed(() => hasPermission('customers', 'addToGroup'))
const canAssignSale = computed(() => hasPermission('customers', 'assignSale'))
const canUseSaleFilter = computed(() => hasPermission('customers', 'saleFilter'))

// Check if user role is sales (to hide Sale column)
const isSalesRole = computed(() => auth.user.value?.role === 'sales')
const isAdmin = computed(() => auth.user.value?.role === 'admin')
const isExporting = ref(false)
const selectedCustomers = ref<string[]>([])
const searchQuery = ref('')
const appliedSearchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const availableColumns = [
  { key: 'select', label: 'Select Checkbox' },
  { key: 'id', label: 'ID' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'source', label: 'Nguồn' },
  { key: 'group', label: 'Group' },
  { key: 'tier', label: 'Tier' },
  { key: 'volume_30d', label: 'Volume (30d)' },
  { key: 'volume_7d', label: 'Volume (7d)' },
  { key: 'volume_today', label: 'Volume (Today)' },
  { key: 'total_volume', label: 'Total Volume' },
  { key: 'registered_at', label: 'Registered At' },
  { key: 'note', label: 'Note' },
  { key: 'sale', label: 'Sale' },
  { key: 'action', label: 'Action' }
]

const selectedColumns = ref(availableColumns.map(c => c.key))
const isShowColumn = (key: string) => selectedColumns.value.includes(key)
const showColumnPicker = ref(false)

const jumpToPage = ref<number | null>(null)
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')
const isAssignSaleOpen = ref(false)
const isBulkAssign = ref(false)
const selectedCustomer = ref<Customer | null>(null)
const selectedSalesUserCode = ref<string | null>(null)
const assignNote = ref('')
const assigning = ref(false)

const isEditCustomerOpen = ref(false)
const isEditingCustomer = ref(false)
const editCustomerId = ref<number | string | null>(null)
const editCustomerPayload = ref({
  full_name: '',
  email: '',
  phone_number: '',
  tier: 'STANDARD',
  referral_code: '',
  source_id: undefined as number | undefined
})
const isSalesUserDetailOpen = ref(false)
const selectedCustomerId = ref<string | number | null>(null)

// Auto Assign state
const isAutoAssignOpen = ref(false)

const exportToExcel = async () => {
  if (filteredCustomers.value.length === 0) {
    toast.add({
      title: 'No data',
      description: 'There are no customers to export.',
      icon: 'i-heroicons-exclamation-circle',
      color: 'warning'
    })
    return
  }

  isExporting.value = true
  try {
    const exportData = filteredCustomers.value.map(c => {
      const salesUser = getSalesUserForCustomer(c.id ?? c.customer_id)
      const groups = getCustomerGroups(c.id ?? c.customer_id).map(g => g.groupName).join(', ')
      
      return {
        'ID': c.id ?? c.customer_id,
        'Full Name': c.full_name,
        'Email': c.email,
        'Phone': c.phone_number || '',
        'Group': groups || '',
        'Tier': c.tier,
        'Volume (30d)': c.volume_last_30d ?? 0,
        'Volume (7d)': c.volume_last_7d ?? 0,
        'Volume (Today)': c.volume_last_1d ?? 0,
        'Total Volume': c.total_volume ?? 0,
        'Registered At': formatDate(c.registered_at),
        'Sale': salesUser?.full_name || '',
        'Note': getAssignmentNote(c.id ?? c.customer_id) || ''
      }
    })

    const xlsx = await import('xlsx')
    const worksheet = xlsx.utils.json_to_sheet(exportData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Customers')

    const dateStr = new Date().toISOString().split('T')[0]
    xlsx.writeFile(workbook, `customers_export_${dateStr}.xlsx`)

    toast.add({
      title: 'Export Successful',
      description: `Exported ${exportData.length} customers to Excel.`,
      icon: 'i-heroicons-check-circle',
      color: 'success'
    })
  } catch (err: any) {
    console.error('Error exporting excel', err)
    toast.add({
      title: 'Export Failed',
      description: err.message || 'An error occurred while exporting data.',
      icon: 'i-heroicons-x-circle',
      color: 'error'
    })
  } finally {
    isExporting.value = false
  }
}

const autoAssignSelectedSalesUsers = ref<string[]>([])
const autoAssignNote = ref('')
const autoAssigning = ref(false)

const selectedSalesUser = computed(() => {
  if (!selectedSalesUserCode.value) return null
  return (salesUsers.value || []).find((u: SalesUser) => u.staff_code === selectedSalesUserCode.value) || null
})

const selectedSalesUserId = computed(() => {
  if (!selectedSalesUser.value) return null
  const rawId = selectedSalesUser.value.id ?? (selectedSalesUser.value as any).sales_user_id
  if (rawId == null) return null
  const numericId = typeof rawId === 'string' ? Number(rawId) : rawId
  return Number.isFinite(numericId) ? Number(numericId) : null
})

// Try to get cached data first
const cachedCustomers = getCachedCustomers()

const { data: customers, pending, error, refresh } = useAsyncData(
  'customers',
  async () => {
    // fetchCustomers will automatically use cache if available
    const result = await fetchCustomers()
    return result
  },
  {
    lazy: true,
    server: false, // Disable server-side fetch to use cache
    default: () => cachedCustomers || [],
  },
)

const { data: analyticsData, pending: analyticsPending, refresh: refreshAnalytics } = useAsyncData(
  'conversion-analytics',
  async () => {
    return await fetchConversionAnalytics()
  },
  {
    lazy: true,
    server: false
  }
)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { size: 12, family: "'Inter', sans-serif" }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.raw || 0;
          const dataset = context.dataset;
          const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((value * 100) / total).toFixed(1) : 0;
          return ` ${label}: ${value} Deal(s) (${percentage}%)`;
        }
      }
    }
  },
  cutout: '65%'
}

const conversionChartData = computed(() => {
  const data = analyticsData.value || [];
  if (data.length === 0) {
    return { labels: [], datasets: [] };
  }
  
  // Sort by won deals descending
  const sorted = [...data].sort((a, b) => b.won_deals - a.won_deals);
  
  return {
    labels: sorted.map(item => item.source_name || 'Nguồn Khác'),
    datasets: [
      {
        data: sorted.map(item => item.won_deals),
        backgroundColor: [
          '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
          '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }
    ]
  }
})

// Also try calling directly on client side
onMounted(() => {
  // If no data and not pending, try to refresh
  if (!customers.value?.length && !pending.value && !error.value) {
    refresh()
  }
  
  if (!analyticsData.value?.length && !analyticsPending.value) {
    refreshAnalytics()
  }
})

// Simple watchers to keep reactivity (no heavy logging)
watch(pending, () => {}, { immediate: true })
watch(customers, () => {}, { immediate: true, deep: true })
watch(error, () => {}, { immediate: true })

// Filtered customers based on search
const filters = reactive({
  tier: null as string | null,
  status: null as string | null,
  email: '',
  phone: '',
  sale: null as string | null,
  referral: '',
  hideZeroVolume: false,
  createdFromDate: null as string | null,
  createdToDate: null as string | null
})

const formatTierLabel = (tier: string) => {
  if (!tier) return 'Unknown'
  return tier
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

interface TierVisual {
  label: string
  symbol: string
  icon: string
  rowClass: string
  iconWrapper: string
  iconColor: string
  badgeColor: 'primary' | 'warning' | 'info' | 'neutral'
  trackClass: string
  progressClass: string
  accentText: string
  order: number
}

const tierVisualConfig: Record<string, TierVisual> = {
  DIAMOND: {
    label: 'Diamond',
    symbol: '💎',
    icon: 'i-heroicons-sparkles',
    rowClass: 'bg-purple-50/70 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-700',
    iconWrapper: 'bg-purple-100 dark:bg-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-300',
    badgeColor: 'primary',
    trackClass: 'bg-purple-100 dark:bg-purple-900',
    progressClass: 'bg-purple-500',
    accentText: 'text-purple-700 dark:text-purple-300',
    order: 1,
  },
  GOLD: {
    label: 'Gold',
    symbol: '🏆',
    icon: 'i-heroicons-trophy',
    rowClass: 'bg-amber-50/70 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-700',
    iconWrapper: 'bg-amber-100 dark:bg-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-300',
    badgeColor: 'warning',
    trackClass: 'bg-amber-100 dark:bg-amber-900',
    progressClass: 'bg-amber-500',
    accentText: 'text-amber-700 dark:text-amber-300',
    order: 2,
  },
  SILVER: {
    label: 'Silver',
    symbol: '🥈',
    icon: 'i-heroicons-sparkles',
    rowClass: 'bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600',
    iconWrapper: 'bg-slate-200 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-300',
    badgeColor: 'info',
    trackClass: 'bg-slate-200 dark:bg-slate-700',
    progressClass: 'bg-slate-500 dark:bg-slate-400',
    accentText: 'text-slate-700 dark:text-slate-200',
    order: 3,
  },
  STANDARD: {
    label: 'Standard',
    symbol: '⭐',
    icon: 'i-heroicons-user',
    rowClass: 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700',
    iconWrapper: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-white',
    badgeColor: 'neutral',
    trackClass: 'bg-gray-200 dark:bg-gray-700',
    progressClass: 'bg-gray-500 dark:bg-gray-400',
    accentText: 'text-gray-700 dark:text-gray-200',
    order: 4,
  },
}

interface TierStat {
  tier: string
  count: number
  percentage: number
  icon: string
  displayLabel: string
  symbol: string
  visual: TierVisual
  order: number
}
 
const getTierVisual = (tier: string) => {
  const config = tierVisualConfig[tier] || null
  if (config) {
    return config
  }
  return {
    label: formatTierLabel(tier),
    symbol: '•',
    icon: 'i-heroicons-question-mark-circle',
    rowClass: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800',
    iconWrapper: 'bg-gray-100',
    iconColor: 'text-gray-600 dark:text-white',
    badgeColor: 'neutral',
    trackClass: 'bg-gray-200',
    progressClass: 'bg-gray-50 dark:bg-gray-800/500',
    accentText: 'text-gray-700',
    order: 99,
  } satisfies TierVisual
}

const tierFilterOptions = computed(() => {
  const tiers = new Set<string>()
  for (const customer of customers.value || []) {
    if (customer.tier) {
      tiers.add(customer.tier)
    }
  }

  const sortedTiers = Array.from(tiers).sort((a, b) => a.localeCompare(b))

  return [
    { label: 'All tiers', value: null as string | null },
    ...sortedTiers.map((tier) => ({
      label: formatTierLabel(tier),
      value: tier
    }))
  ]
})


const statusFilterOptions = computed(() => [
  { label: 'All statuses', value: null },
  { label: 'Has sale', value: 'assigned' },
  { label: 'Unassigned', value: 'unassigned' }
])

const saleFilterOptions = computed(() => {
  const options = (salesUsersOptions.value || []).filter((option) => option?.value)

  return [{ label: 'All sales', value: null as string | null }, ...options]
})

const hasActiveFilters = computed(() => {
  return !!(
    filters.tier ||
    filters.status ||
    filters.email ||
    filters.phone ||
    filters.sale ||
    filters.referral ||
    filters.hideZeroVolume ||
    filters.createdFromDate ||
    filters.createdToDate ||
    appliedSearchQuery.value
  )
})

const resetFilters = () => {
  filters.tier = null
  filters.status = null
  filters.email = ''
  filters.phone = ''
  filters.sale = null
  filters.referral = ''
  filters.hideZeroVolume = false
  filters.createdFromDate = null
  filters.createdToDate = null
  searchQuery.value = ''
  appliedSearchQuery.value = ''
  currentPage.value = 1
}

// Get current user's sales_user_id if role is "sales"
const currentUserSalesUserId = computed(() => {
  const currentUser = auth.user.value
  if (!currentUser || currentUser.role !== 'sales') return null
  
  // Find sales user that matches current user's id
  const salesUser = (salesUsers.value || []).find(
    (u: SalesUser) => u.user_id === currentUser.id
  )
  
  if (!salesUser) return null
  
  // Return sales_user_id (not user_id)
  return salesUser.sales_user_id ?? salesUser.id ?? null
})

// Get customer IDs assigned to current sales user
const currentSalesUserCustomerIds = computed(() => {
  if (!currentUserSalesUserId.value || !salesWithCustomers.value) return new Set<string>()
  
  const salesUser = salesWithCustomers.value.find(
    (s: SalesUserWithCustomers) => s.sales_user_id === currentUserSalesUserId.value
  )
  
  if (!salesUser) return new Set<string>()
  
  // Collect all customer IDs from assignments (normalize to strings for comparison)
  const customerIds = new Set<string>()
  for (const assignment of salesUser.customers) {
    const customerId = assignment.customer_id
    if (customerId !== null && customerId !== undefined) {
      // Normalize to string for consistent comparison
      customerIds.add(String(customerId))
    }
  }
  
  return customerIds
})

const filteredCustomers = computed(() => {
  if (!customers.value) return []
  
  const currentUser = auth.user.value
  const isSalesRole = currentUser?.role === 'sales'
  
  // If sales role, don't show any customers until data is ready
  // This prevents showing all customers before filter is applied
  if (isSalesRole) {
    // If stats are not ready, return empty array to prevent showing all customers
    if (!isStatsReady.value) {
      return []
    }
  }
  
  let result = customers.value

  // Filter by sales role: only show customers assigned to current sales user
  if (currentUserSalesUserId.value !== null) {
    const assignedCustomerIds = currentSalesUserCustomerIds.value
    result = result.filter((customer) => {
      // Check customer_id (string code)
      if (customer.customer_id && assignedCustomerIds.has(customer.customer_id)) {
        return true
      }
      
      // Check numeric id - need to resolve customer_id from id
      if (customer.id !== null && customer.id !== undefined) {
        const customerCode = customerCodeByIdMap.value.get(String(customer.id))
        if (customerCode && assignedCustomerIds.has(customerCode)) {
          return true
        }
        // Also check if id itself matches (in case assignment uses numeric id)
        if (assignedCustomerIds.has(String(customer.id))) {
          return true
        }
      }
      
      return false
    })
  }

  // Apply search filter (only when user explicitly applies search)
  if (appliedSearchQuery.value) {
    const query = appliedSearchQuery.value.toLowerCase()
    result = result.filter((customer) => {
      const idString =
        customer.id !== null && customer.id !== undefined
          ? String(customer.id).toLowerCase()
          : ''
      return (
        idString.includes(query) ||
        customer.customer_id.toLowerCase().includes(query) ||
        customer.full_name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone_number?.toLowerCase().includes(query) ||
        customer.referral_code.toLowerCase().includes(query)
      )
    })
  }

  // Apply advanced filters
  if (filters.tier) {
    result = result.filter((customer) => customer.tier === filters.tier)
  }

  if (filters.status) {
    result = result.filter((customer) => {
      const hasSale = !!getSalesUserForCustomer(customer.id ?? customer.customer_id)
      return filters.status === 'assigned' ? hasSale : !hasSale
    })
  }

  if (filters.email) {
    const emailQuery = filters.email.toLowerCase()
    result = result.filter((customer) => customer.email.toLowerCase().includes(emailQuery))
  }

  if (filters.phone) {
    const phoneQuery = filters.phone.toLowerCase()
    result = result.filter((customer) => customer.phone_number?.toLowerCase().includes(phoneQuery))
  }

  if (filters.referral) {
    const referralQuery = filters.referral.toLowerCase()
    result = result.filter((customer) => customer.referral_code.toLowerCase().includes(referralQuery))
  }

  if (filters.sale) {
    result = result.filter((customer) => {
      const saleUser = getSalesUserForCustomer(customer.id ?? customer.customer_id)
      if (!saleUser) return false
      return saleUser.staff_code === filters.sale
    })
  }

  // Filter out zero volume customers if hideZeroVolume is enabled
  if (filters.hideZeroVolume) {
    result = result.filter((customer) => {
      const volume = getCustomerVolume(customer.id ?? customer.customer_id)
      const volume30d = volume?.volume_last_30d ?? 0
      const totalVolume = volume?.total_volume ?? 0
      return volume30d > 0 || totalVolume > 0
    })
  }

  // Filter by created date range
  if (filters.createdFromDate || filters.createdToDate) {
    result = result.filter((customer) => {
      if (!customer.registered_at) return false
      const registeredDate = new Date(customer.registered_at)
      
      if (filters.createdFromDate) {
        const start = new Date(filters.createdFromDate)
        start.setHours(0, 0, 0, 0)
        if (registeredDate < start) return false
      }
      
      if (filters.createdToDate) {
        const end = new Date(filters.createdToDate)
        end.setHours(23, 59, 59, 999)
        if (registeredDate > end) return false
      }
      
      return true
    })
  }

  // Apply sorting
  if (sortColumn.value === 'id') {
    result = [...result].sort((a, b) => {
      // Handle null/undefined - put them at the end
      if (!a.id && !b.id) return 0
      if (!a.id) return 1
      if (!b.id) return -1
      
      const aNum = typeof a.id === 'number' ? a.id : Number(a.id) || 0
      const bNum = typeof b.id === 'number' ? b.id : Number(b.id) || 0
      
      if (sortDirection.value === 'asc') {
        return aNum - bNum
      } else {
        return bNum - aNum
      }
    })
  } else if (sortColumn.value === 'volume_30d') {
    result = [...result].sort((a, b) => {
      const aVolume = getCustomerVolume(a.id ?? a.customer_id)
      const bVolume = getCustomerVolume(b.id ?? b.customer_id)
      const aValue = aVolume?.volume_last_30d ?? 0
      const bValue = bVolume?.volume_last_30d ?? 0
      
      if (sortDirection.value === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  } else if (sortColumn.value === 'volume_7d') {
    result = [...result].sort((a, b) => {
      const aVolume = getCustomerVolume(a.id ?? a.customer_id)
      const bVolume = getCustomerVolume(b.id ?? b.customer_id)
      const aValue = aVolume?.volume_last_7d ?? 0
      const bValue = bVolume?.volume_last_7d ?? 0
      
      if (sortDirection.value === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  } else if (sortColumn.value === 'volume_today') {
    result = [...result].sort((a, b) => {
      const aVolume = getCustomerVolume(a.id ?? a.customer_id)
      const bVolume = getCustomerVolume(b.id ?? b.customer_id)
      const aValue = aVolume?.volume_last_1d ?? 0
      const bValue = bVolume?.volume_last_1d ?? 0
      
      if (sortDirection.value === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  } else if (sortColumn.value === 'total_volume') {
    result = [...result].sort((a, b) => {
      const aVolume = getCustomerVolume(a.id ?? a.customer_id)
      const bVolume = getCustomerVolume(b.id ?? b.customer_id)
      const aValue = aVolume?.total_volume ?? 0
      const bValue = bVolume?.total_volume ?? 0
      
      if (sortDirection.value === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }

  return result
})

const itemsPerPageOptions = computed(() => {
  return [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
  ]
})

// Check if stats data is ready (for sales role, need to wait for salesWithCustomers to load)
const isStatsReady = computed(() => {
  const currentUser = auth.user.value
  const isSalesRole = currentUser?.role === 'sales'
  
  // If not sales role, stats are ready when customers are loaded
  if (!isSalesRole) {
    return !pending.value
  }
  
  // If sales role, need to wait for:
  // 1. customers to load
  // 2. salesUsers to load (to determine currentUserSalesUserId)
  // 3. salesWithCustomers to load (to get customer assignments)
  if (pending.value || salesUsersPending.value || salesWithCustomersPending.value) {
    return false
  }
  
  // Need to have salesUsers data to determine currentUserSalesUserId
  if (!salesUsers.value || salesUsers.value.length === 0) {
    return false
  }
  
  // Need to have salesWithCustomers data
  if (!salesWithCustomers.value || salesWithCustomers.value.length === 0) {
    return false
  }
  
  // Check if we can determine the current sales user ID
  // If currentUserSalesUserId is still null after salesUsers loaded, 
  // it means user is not found in salesUsers list
  // In this case, we should still wait or show empty stats
  // But to be safe, if we can't find the user, we'll consider data ready 
  // (to avoid infinite loading) but stats will show empty
  if (currentUserSalesUserId.value === null) {
    // User role is sales but we can't find their sales_user record
    // This could mean they don't have a sales_user record yet
    // We'll wait a bit more, but if salesUsers is fully loaded, we'll proceed
    // The stats will show empty (0 customers) which is correct
    return true // Allow stats to show (will be empty/0)
  }
  
  // Check if we can find the current sales user in salesWithCustomers data
  const salesUserFound = salesWithCustomers.value.some(
    (s: SalesUserWithCustomers) => s.sales_user_id === currentUserSalesUserId.value
  )
  
  // Data is ready if we found the sales user (even if they have no customers)
  // OR if we have customer IDs (meaning data was processed and filtered)
  return salesUserFound || currentSalesUserCustomerIds.value.size > 0
})

// Statistics
// Use filtered customers for statistics when user has "sales" role
const customersForStatistics = computed(() => {
  const currentUser = auth.user.value
  const isSalesRole = currentUser?.role === 'sales'
  
  // When user has "sales" role, only use filtered customers if data is ready
  // This prevents showing all customers before filter is applied
  if (isSalesRole) {
    // If stats are not ready yet, return empty array to prevent showing all customers
    if (!isStatsReady.value) {
      return []
    }
    // Only return filtered customers when stats are ready (meaning all data is loaded and filtered)
    return filteredCustomers.value
  }
  
  // For non-sales roles, use all customers (only when customers are loaded)
  if (pending.value) {
    return []
  }
  return customers.value || []
})

const totalCustomers = computed(() => customersForStatistics.value.length)

const tierStatistics = computed(() => {
   const list = customersForStatistics.value
   if (list.length === 0) return [] as TierStat[]
 
   const counts: Record<string, number> = {}
   for (const c of list) {
     const key = c.tier || 'UNKNOWN'
     counts[key] = (counts[key] || 0) + 1
   }
 
   const total = list.length
  return Object.entries(counts)
    .map(([tier, count]) => buildTierStat(tier, count, total))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order
      }
      return b.count - a.count
    })
})

const buildTierStat = (tier: string, count: number, total: number) => {
  const visual = getTierVisual(tier)
  return {
    tier,
    count,
    percentage: Math.round((count / total) * 1000) / 10,
    icon: visual.icon,
    displayLabel: visual.label,
    symbol: visual.symbol,
    visual,
    order: visual.order,
  } as TierStat
}

// New users this month
const newUsersThisMonth = computed(() => {
  const list = customersForStatistics.value
  if (list.length === 0) return 0
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  return list.filter((c) => {
    const d = new Date(c.registered_at)
    return d.getMonth() === m && d.getFullYear() === y
  }).length
})

const currentMonthLabel = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / itemsPerPage.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage.value, filteredCustomers.value.length)
})

const paginatedCustomers = computed(() => {
  const customers = filteredCustomers.value.slice(startIndex.value, endIndex.value)
  // Enrich customers with volume data
  return customers.map((customer) => {
    const volume = getCustomerVolume(customer.id ?? customer.customer_id)
    return {
      ...customer,
      volume_last_30d: volume?.volume_last_30d,
      volume_last_7d: volume?.volume_last_7d,
      volume_last_1d: volume?.volume_last_1d,
      total_volume: volume?.total_volume,
    }
  })
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

// Sort function
const toggleSort = (column: string) => {
  if (sortColumn.value === column) {
    // Toggle direction if same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new column with ascending direction
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  // Reset to first page when sorting
  currentPage.value = 1
}

watch(
  () => [
    filters.tier,
    filters.status,
    filters.email,
    filters.phone,
    filters.sale,
    filters.referral,
    filters.hideZeroVolume,
    filters.createdFromDate,
    filters.createdToDate
  ],
  () => {
    currentPage.value = 1
  }
)

// Auto-adjust date range if from date is after to date
watch(
  () => [filters.createdFromDate, filters.createdToDate],
  ([fromDate, toDate]) => {
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      if (from > to) {
        filters.createdToDate = fromDate
      }
    }
  }
)

// Fetch sales users for assign sale modal - fetch immediately when page loads
const { data: salesUsers, pending: salesUsersPending, error: salesUsersError, refresh: refreshSalesUsers } = useAsyncData(
  'sales-users-for-assign',
  async () => {
    const result = await fetchSalesUsers()
    return result
  },
  { 
    default: () => [],
    lazy: true,
    server: true // Execute on server
  }
)

// Also try calling directly on client side
onMounted(async () => {
  // If no data and not pending, try to refresh
  if (!salesUsers.value?.length && !salesUsersPending.value && !salesUsersError.value) {
    refreshSalesUsers()
  }

  // Deep-link: auto-open customer detail if ?customer_id=X is in the URL
  const route = useRoute()
  const deepLinkCustomerId = route.query.customer_id as string | undefined
  if (deepLinkCustomerId) {
    // Wait for customers data to be available
    const waitForData = () => new Promise<void>((resolve) => {
      if (customers.value && customers.value.length > 0) {
        resolve()
        return
      }
      const unwatch = watch(customers, (val) => {
        if (val && val.length > 0) {
          unwatch()
          resolve()
        }
      }, { immediate: true })
      // Timeout after 10s
      setTimeout(() => { unwatch(); resolve() }, 10000)
    })

    await waitForData()

    // Find customer by numeric id
    const targetCustomer = (customers.value || []).find(
      (c: Customer) => String(c.id) === deepLinkCustomerId || String(c.customer_id) === deepLinkCustomerId
    )
    if (targetCustomer) {
      // Set search to highlight the customer in the table
      searchQuery.value = targetCustomer.full_name || targetCustomer.email || ''
      applySearch()
      // Open the detail modal
      openCustomerInfoModal(targetCustomer)
    }
  }
})

// Keep reactive without logs
watch(salesUsers, () => {}, { immediate: true, deep: true })

const salesUsersOptions = computed(() => {
  const users = salesUsers.value || []
  // Format as simple array of objects with label and value
  return users.map((user: SalesUser) => ({
    label: `${user.full_name} (${user.staff_code})`,
    value: user.staff_code,
  }))
})

// Fetch sales with customers assignments
const { data: salesWithCustomers, pending: salesWithCustomersPending, refresh: refreshSalesWithCustomers } = useAsyncData(
  'sales-with-customers',
  async () => {
    const result = await fetchSalesWithCustomers()
    return result
  },
  {
    default: () => [],
    lazy: true,
    server: true
  }
)

// Fetch customer volumes from monitoring API
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase || 'http://localhost:4000'

const getAuthHeaders = (): Record<string, string> => {
  const raw = auth?.getAuthHeaders?.() ?? {}
  return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      acc[key] = value
    }
    return acc
  }, {})
}

interface CustomerVolume {
  customer_id: number
  volume_last_1d: number
  volume_last_7d: number
  volume_last_30d: number
  total_volume: number
  tx_count_30d: number
  last_tx_at: Date | null
  last_topup_at: Date | null
  volume_change_rate: number
  avg_volume_30d: number
  failed_tx_ratio: number
}

const fetchCustomerVolumes = async (): Promise<CustomerVolume[]> => {
  try {
    const response: { success?: boolean; data?: CustomerVolume[] } = await $fetch(
      `${apiBaseUrl}/monitoring/customer-volumes`,
      {
        headers: getAuthHeaders(),
      },
    )
    return response?.data ?? []
  } catch (error) {
    return []
  }
}

const { data: customerVolumes } = useLazyAsyncData(
  'customer-volumes',
  fetchCustomerVolumes,
  {
    default: () => [] as CustomerVolume[],
    server: false,
  }
)

// Map customer volumes by customer_id for quick lookup
const customerVolumesMap = computed(() => {
  const map = new Map<number, CustomerVolume>()
  if (!customerVolumes.value) return map
  
  for (const volume of customerVolumes.value) {
    map.set(volume.customer_id, volume)
  }
  return map
})

// Helper function to get volume for a customer
const getCustomerVolume = (customerKey: string | number | null | undefined): CustomerVolume | null => {
  if (customerKey === null || customerKey === undefined) return null
  
  const numericId = resolveCustomerNumericId(customerKey)
  if (numericId === null) return null
  
  return customerVolumesMap.value.get(numericId) || null
}

// Build lookup maps between customer ids and codes
const customerIdByCodeMap = computed(() => {
  const map = new Map<string, string | number>()
  for (const customer of customers.value || []) {
    if (customer.customer_id && customer.id !== undefined && customer.id !== null) {
      map.set(customer.customer_id, customer.id)
    }
  }
  return map
})

const customerCodeByIdMap = computed(() => {
  const map = new Map<string, string>()
  for (const customer of customers.value || []) {
    const key = customer.id != null ? String(customer.id) : customer.customer_id
    if (key) {
      map.set(key, customer.customer_id)
    }
  }
  return map
})

const resolveCustomerCode = (customerKey: string | number | null | undefined): string | null => {
  if (customerKey === null || customerKey === undefined) return null
  const code = customerCodeByIdMap.value.get(String(customerKey))
  if (code) return code
  return typeof customerKey === 'string' ? customerKey : null
}

const resolveCustomerIdentifier = (customerKey: string | number | null | undefined): string | null => {
  if (customerKey === null || customerKey === undefined) return null

  if (typeof customerKey === 'number' && Number.isFinite(customerKey)) {
    return String(customerKey)
  }

  if (typeof customerKey === 'string') {
    const directMatch = customerIdByCodeMap.value.get(customerKey)
    if (directMatch !== undefined && directMatch !== null) {
      return String(directMatch)
    }

    const normalizedCode = resolveCustomerCode(customerKey)
    if (normalizedCode) {
      return normalizedCode
    }

    if (customerKey.trim().length > 0) {
      return customerKey.trim()
    }
  }

  return null
}

const resolveCustomerNumericId = (customerKey: string | number | null | undefined): number | null => {
  if (customerKey === null || customerKey === undefined) return null
  if (typeof customerKey === 'number' && Number.isFinite(customerKey)) {
    return customerKey
  }
  const mapped = customerIdByCodeMap.value.get(String(customerKey))
  if (mapped !== undefined && mapped !== null) {
    const numeric = Number(mapped)
    if (Number.isFinite(numeric)) return numeric
  }
  const numeric = Number(customerKey)
  return Number.isFinite(numeric) ? numeric : null
}

const customerActionMeta = (customer: Customer) => {
  if (!selectedSalesUserId.value) {
    return { label: '', color: 'neutral' as const }
  }

  const key = customer.id ?? customer.customer_id
  const detail = buildCustomerDetail(String(key))

  switch (detail.plannedAction) {
    case 'assign':
      return { label: 'Assign', color: 'primary' as const }
    case 'transfer':
      return { label: 'Transfer', color: 'warning' as const }
    case 'no-change':
      return { label: 'No change', color: 'neutral' as const }
    default:
      return { label: '', color: 'neutral' as const }
  }
}

// Create a map of customer id to sales user
const customerToSalesUserMap = computed(() => {
   const map = new Map<string, SalesUserWithCustomers>()
   if (!salesWithCustomers.value) return map
   
   for (const salesUser of salesWithCustomers.value) {
     for (const customer of salesUser.customers) {
      const rawKey = String(customer.customer_id)
      const mappedKey = customerIdByCodeMap.value.get(rawKey)
      const normalizedKey = mappedKey !== undefined ? mappedKey : rawKey
      map.set(String(normalizedKey), salesUser)
     }
   }
   return map
 })

const assignedCustomersCount = computed(() => {
  // When user has "sales" role, all filtered customers are assigned (100%)
  if (currentUserSalesUserId.value !== null) {
    return totalCustomers.value
  }
  // Otherwise, count from the map
  return customerToSalesUserMap.value.size
})

const assignedPercentage = computed(() => {
  if (totalCustomers.value === 0) return 0
  // When user has "sales" role, all customers shown are assigned
  if (currentUserSalesUserId.value !== null) {
    return 100
  }
  return Math.round((assignedCustomersCount.value / totalCustomers.value) * 100)
})

// Helper function to get sales user for a customer
const getSalesUserForCustomer = (customerKey: string | number | null | undefined): SalesUserWithCustomers | null => {
  if (customerKey === null || customerKey === undefined) return null
  return customerToSalesUserMap.value.get(String(customerKey)) || null
}

// Helper to get assignment object for a customer (using numeric customer id)
const getAssignmentForCustomer = (
  customerKey: string | number | null | undefined,
): CustomerAssignment | null => {
  if (customerKey === null || customerKey === undefined) return null

  const salesUser = getSalesUserForCustomer(customerKey)
  if (!salesUser) return null

  const numericId = resolveCustomerNumericId(customerKey)
  if (numericId === null) return null

  const matched = salesUser.customers.find((assignment) => {
    const assignmentNumeric = resolveCustomerNumericId(assignment.customer_id)
    return assignmentNumeric !== null && assignmentNumeric === numericId
  })

  return matched ?? null
}

// Helper function to get assignment date
const getAssignmentDate = (customerKey: string | number | null): string => {
  const assignment = getAssignmentForCustomer(customerKey)
  return assignment?.assigned_at ? formatDate(assignment.assigned_at) : '-'
}

const getAssignmentNote = (customerKey: string | number | null): string | null => {
  const assignment = getAssignmentForCustomer(customerKey)
  return assignment?.note || null
}

// Sales user detail modal
const selectedSalesUserDetail = computed(() => {
  if (selectedCustomerId.value === null || selectedCustomerId.value === undefined) return null
  return getSalesUserForCustomer(selectedCustomerId.value)
})

const selectedCustomerAssignment = computed(() => {
  if (selectedCustomerId.value === null || selectedCustomerId.value === undefined || !selectedSalesUserDetail.value) return null
  return getAssignmentForCustomer(selectedCustomerId.value)
})

const openSalesUserDetailModal = (customerKey: string | number | null) => {
  selectedCustomerId.value = customerKey
  isSalesUserDetailOpen.value = true
}

// Assign sale functions
const openAssignSaleModal = (customer: Customer) => {
  isBulkAssign.value = false
  selectedCustomer.value = customer
  selectedSalesUserCode.value = null
  assignNote.value = ''
  isAssignSaleOpen.value = true
}

const openBulkAssignSaleModal = () => {
  if (selectedCustomers.value.length === 0) return
  isBulkAssign.value = true
  selectedCustomer.value = null
  selectedSalesUserCode.value = null
  assignNote.value = ''
  isAssignSaleOpen.value = true
}

const getCustomerByCode = (customerCode: string) => {
  return customers.value?.find(c => c.customer_id === customerCode) || null
}

const buildCustomerDetail = (customerCode: string) => {
   const customer = getCustomerByCode(customerCode)
   const numericId = resolveCustomerNumericId(customer?.id ?? customerCode)
   const mapKey = numericId != null ? String(numericId) : String(customerCode)
   const currentSalesUser = getSalesUserForCustomer(mapKey)
 
   let currentAssignment: CustomerAssignment | null = null
   if (currentSalesUser) {
     const matched = currentSalesUser.customers.find((assignment) => {
       const assignmentNumeric = resolveCustomerNumericId(assignment.customer_id)
       return numericId != null && assignmentNumeric === numericId
     })
     currentAssignment = matched ?? null
   }
 
   const assignmentDateValue = getAssignmentDate(numericId ?? customerCode)
   const assignmentDate = assignmentDateValue && assignmentDateValue !== '—' ? assignmentDateValue : null
   const assignmentNoteValue = getAssignmentNote(numericId ?? customerCode)
   const assignmentNote = assignmentNoteValue && assignmentNoteValue.length ? assignmentNoteValue : null

  const currentSalesUserInfo = currentSalesUser
    ? {
        sales_user_id: currentSalesUser.sales_user_id,
        full_name: currentSalesUser.full_name,
        staff_code: currentSalesUser.staff_code,
        avatar: currentSalesUser.avatar,
        department: currentSalesUser.department,
      }
    : null

  let plannedAction: 'assign' | 'transfer' | 'no-change' | 'pending' = 'pending'
  if (selectedSalesUserId.value) {
    if (!currentSalesUserInfo) {
      plannedAction = 'assign'
    } else if (currentSalesUserInfo.sales_user_id === selectedSalesUserId.value) {
      plannedAction = 'no-change'
    } else {
      plannedAction = 'transfer'
    }
  }

  const actionMeta = (() => {
    switch (plannedAction) {
      case 'assign':
        return { label: 'New assign', color: 'primary' as const }
      case 'transfer':
        return { label: 'Transfer', color: 'warning' as const }
      case 'no-change':
        return { label: 'No change', color: 'neutral' as const }
      default:
        return { label: 'Select sales user', color: 'neutral' as const }
    }
  })()
 
   return {
    code: customerCode,
    id: customer?.id ?? null,
    numericId,
    fullName: customer?.full_name ?? customerCode,
    email: customer?.email ?? null,
    assignmentDate,
    assignmentNote,
    plannedAction,
    actionLabel: actionMeta.label,
    actionColor: actionMeta.color,
    currentSalesUser: currentSalesUserInfo,
  }
}

const selectedCustomersDetailed = computed(() => {
  return selectedCustomers.value.map((customerCode, index) => ({
    index,
    ...buildCustomerDetail(customerCode),
  }))
})

const singleSelectedCustomerDetail = computed(() => {
  if (!selectedCustomer.value) return null
  return buildCustomerDetail(selectedCustomer.value.customer_id)
})

const isCustomerInfoOpen = ref(false)
const customerInfoCustomer = ref<Customer | null>(null)
const customerInfoDetail = ref<ReturnType<typeof buildCustomerDetail> | null>(null)

watch(isCustomerInfoOpen, (open) => {
  if (!open) {
    customerInfoCustomer.value = null
    customerInfoDetail.value = null
  }
})

watch(isAutoAssignOpen, async (open) => {
  if (open) {
    // Ensure sales users are loaded when modal opens
    if (!salesUsers.value?.length && !salesUsersPending.value && !salesUsersError.value) {
      await refreshSalesUsers()
    }
  } else {
    autoAssignSelectedSalesUsers.value = []
    autoAssignNote.value = ''
    autoAssigning.value = false
  }
})

const closeCustomerInfoModal = () => {
  isCustomerInfoOpen.value = false
}

const openCustomerInfoModal = (customer: Customer) => {
  customerInfoCustomer.value = customer
  customerInfoDetail.value = buildCustomerDetail(customer.customer_id)
  isCustomerInfoOpen.value = true
}

const handleAssignSale = async () => {
   if (!selectedSalesUser.value || !selectedSalesUserId.value) {
     toast.add({
       title: 'Missing sales user',
       description: 'Please choose a sales user before assigning.',
       color: 'warning',
     })
     return
   }
 
   try {
     assigning.value = true
 
    let numericCustomerIds: number[] = []

    if (isBulkAssign.value) {
      if (selectedCustomers.value.length === 0) {
        toast.add({
          title: 'No customers selected',
          description: 'Select at least one customer to assign.',
          color: 'warning',
        })
        return
      }

      numericCustomerIds = selectedCustomersDetailed.value
        .map((detail) => detail.numericId)
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))

      if (!numericCustomerIds.length) {
        toast.add({
          title: 'Unable to assign customers',
          description: 'Could not resolve the selected customer IDs.',
          color: 'error',
        })
        return
      }
    } else {
      if (!selectedCustomer.value) {
        toast.add({
          title: 'Unable to assign',
          description: 'Could not determine the selected customer.',
          color: 'error',
        })
        return
      }

      const numericId = resolveCustomerNumericId(selectedCustomer.value.id ?? selectedCustomer.value.customer_id)
      if (!numericId) {
        toast.add({
          title: 'Unable to assign',
          description: 'Could not identify the customer ID to assign.',
          color: 'error',
        })
        return
      }

      numericCustomerIds = [numericId]
    }

    const result = await assignOrTransferCustomers({
      target_sales_user_id: selectedSalesUserId.value,
      customer_ids: numericCustomerIds,
      note: assignNote.value.trim() ? assignNote.value.trim() : null,
    })

    const summaryParts: string[] = []
    if (result.newly_assigned) summaryParts.push(`${result.newly_assigned} assigned`)
    if (result.transferred) summaryParts.push(`${result.transferred} transferred`)
    if (result.skipped) summaryParts.push(`${result.skipped} skipped`)

    toast.add({
      title: 'Assignment result',
      description: summaryParts.length ? summaryParts.join(', ') : 'No changes applied.',
      color: result.newly_assigned || result.transferred ? 'primary' : 'warning',
    })

    await Promise.all([refresh(), refreshSalesWithCustomers()])

    isAssignSaleOpen.value = false
    selectedCustomer.value = null
    selectedSalesUserCode.value = null
    isBulkAssign.value = false
    assignNote.value = ''
    selectedCustomers.value = []
  } catch (e: any) {
    toast.add({
      title: 'Failed to assign sales user',
      description: e?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    assigning.value = false
  }
}

// Auto Assign functionality
const openAutoAssignModal = async () => {
  if (selectedCustomers.value.length === 0) {
    toast.add({
      title: 'No customers selected',
      description: 'Please select at least one customer to auto assign.',
      color: 'warning',
    })
    return
  }
  
  // Ensure sales users are loaded
  if (!salesUsers.value?.length && !salesUsersPending.value && !salesUsersError.value) {
    await refreshSalesUsers()
  }
  
  autoAssignSelectedSalesUsers.value = []
  autoAssignNote.value = ''
  isAutoAssignOpen.value = true
}

const toggleAutoAssignSalesUser = (staffCode: string) => {
  const index = autoAssignSelectedSalesUsers.value.indexOf(staffCode)
  if (index > -1) {
    autoAssignSelectedSalesUsers.value.splice(index, 1)
  } else {
    autoAssignSelectedSalesUsers.value.push(staffCode)
  }
}

const allSalesUsersSelected = computed(() => {
  if (!salesUsers.value || salesUsers.value.length === 0) return false
  return autoAssignSelectedSalesUsers.value.length === salesUsers.value.length
})

const selectAllSalesUsers = () => {
  if (!salesUsers.value) return
  autoAssignSelectedSalesUsers.value = salesUsers.value.map((user: SalesUser) => user.staff_code)
}

const deselectAllSalesUsers = () => {
  autoAssignSelectedSalesUsers.value = []
}

// Compute distribution preview
const autoAssignDistributionPreview = computed(() => {
  if (autoAssignSelectedSalesUsers.value.length === 0 || selectedCustomers.value.length === 0) {
    return []
  }

  const selectedUsers = (salesUsers.value || []).filter((user: SalesUser) =>
    autoAssignSelectedSalesUsers.value.includes(user.staff_code)
  )

  if (selectedUsers.length === 0) return []

  // Get numeric customer IDs
  const customerIds = selectedCustomersDetailed.value
    .map((detail) => detail.numericId)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))

  // Distribute customers evenly using round-robin
  const distribution: Record<string, number> = {}
  selectedUsers.forEach((user) => {
    distribution[user.staff_code] = 0
  })

  // Round-robin distribution
  customerIds.forEach((_, index) => {
    const userIndex = index % selectedUsers.length
    const user = selectedUsers[userIndex]
    distribution[user.staff_code]++
  })

  return selectedUsers.map((user) => ({
    salesUser: user,
    customerCount: distribution[user.staff_code] || 0,
  }))
})

const handleAutoAssign = async () => {
  if (autoAssignSelectedSalesUsers.value.length === 0) {
    toast.add({
      title: 'No sales users selected',
      description: 'Please select at least one sales user to distribute customers.',
      color: 'warning',
    })
    return
  }

  if (selectedCustomers.value.length === 0) {
    toast.add({
      title: 'No customers selected',
      description: 'Please select at least one customer to assign.',
      color: 'warning',
    })
    return
  }

  try {
    autoAssigning.value = true

    // Get selected sales users with their IDs
    const selectedUsers = (salesUsers.value || []).filter((user: SalesUser) =>
      autoAssignSelectedSalesUsers.value.includes(user.staff_code)
    )

    if (selectedUsers.length === 0) {
      toast.add({
        title: 'Invalid sales users',
        description: 'Could not find selected sales users.',
        color: 'error',
      })
      return
    }

    // Get numeric customer IDs
    const customerIds = selectedCustomersDetailed.value
      .map((detail) => detail.numericId)
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))

    if (customerIds.length === 0) {
      toast.add({
        title: 'Unable to assign customers',
        description: 'Could not resolve the selected customer IDs.',
        color: 'error',
      })
      return
    }

    // Distribute customers evenly using round-robin
    const assignments: Array<{ sales_user_id: number; customer_ids: number[] }> = []
    const distribution: Record<string, number[]> = {}
    
    selectedUsers.forEach((user) => {
      const salesUserId = user.sales_user_id ?? user.id
      if (salesUserId !== null && salesUserId !== undefined) {
        distribution[user.staff_code] = []
      }
    })

    // Round-robin distribution
    customerIds.forEach((customerId, index) => {
      const userIndex = index % selectedUsers.length
      const user = selectedUsers[userIndex]
      if (distribution[user.staff_code]) {
        distribution[user.staff_code].push(customerId)
      }
    })

    // Build assignment requests
    for (const user of selectedUsers) {
      const rawId = user.sales_user_id ?? user.id ?? (user as any).sales_user_id
      if (rawId == null) continue
      const numericId = typeof rawId === 'string' ? Number(rawId) : rawId
      const salesUserId = Number.isFinite(numericId) ? Number(numericId) : null
      
      if (salesUserId !== null && distribution[user.staff_code]?.length > 0) {
        assignments.push({
          sales_user_id: salesUserId,
          customer_ids: distribution[user.staff_code],
        })
      }
    }

    // Execute assignments
    const results = await Promise.all(
      assignments.map((assignment) =>
        assignOrTransferCustomers({
          target_sales_user_id: assignment.sales_user_id,
          customer_ids: assignment.customer_ids,
          note: autoAssignNote.value.trim() ? autoAssignNote.value.trim() : null,
        })
      )
    )

    // Aggregate results
    let totalAssigned = 0
    let totalTransferred = 0
    let totalSkipped = 0

    results.forEach((result) => {
      totalAssigned += result.newly_assigned || 0
      totalTransferred += result.transferred || 0
      totalSkipped += result.skipped || 0
    })

    const summaryParts: string[] = []
    if (totalAssigned) summaryParts.push(`${totalAssigned} assigned`)
    if (totalTransferred) summaryParts.push(`${totalTransferred} transferred`)
    if (totalSkipped) summaryParts.push(`${totalSkipped} skipped`)

    toast.add({
      title: 'Auto assignment completed',
      description: summaryParts.length ? summaryParts.join(', ') : 'No changes applied.',
      color: totalAssigned || totalTransferred ? 'primary' : 'warning',
    })

    await Promise.all([refresh(), refreshSalesWithCustomers()])

    isAutoAssignOpen.value = false
    autoAssignSelectedSalesUsers.value = []
    autoAssignNote.value = ''
    selectedCustomers.value = []
  } catch (e: any) {
    toast.add({
      title: 'Failed to auto assign customers',
      description: e?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    autoAssigning.value = false
  }
}

// Add to Group functionality
const isAddToGroupModalOpen = ref(false)
const selectedGroupId = ref<number | null>(null)
const addToGroupNote = ref('')
const addingToGroup = ref(false)

// Map to store group members: groupId -> members[]
const groupMembersMap = ref<Map<number, Array<{ customer_id: number }>>>(new Map())

// Fetch groups for selection and display
const {
  data: groups,
  pending: groupsPending,
  refresh: refreshGroups,
} = useAsyncData('customer-groups-for-add', async () => {
  const groupsData = await fetchCustomerGroups()
  // Pre-load members for all groups to build customer-to-group mapping
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
    
    // Check members
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
const getCustomerGroups = (customerKey: string | number | null | undefined): Array<{ groupId: number; groupName: string; isLeader: boolean }> => {
  if (customerKey === null || customerKey === undefined) return []
  
  const numericId = resolveCustomerNumericId(customerKey)
  if (numericId === null) return []
  
  return customerToGroupsMap.value.get(numericId) || []
}

const groupOptions = computed(() => {
  return (groups.value || []).map((group) => ({
    label: `${group.name} (${group.member_count || 0} members)`,
    value: group.id ?? null,
  })).filter((item) => item.value !== null)
})

// Get selected group details
const selectedGroup = computed(() => {
  if (!selectedGroupId.value || !groups.value) return null
  return groups.value.find((g) => g.id === selectedGroupId.value) || null
})

const openAddToGroupModal = () => {
  selectedGroupId.value = null
  addToGroupNote.value = ''
  isAddToGroupModalOpen.value = true
}

const handleAddToGroup = async () => {
  if (!selectedGroupId.value || selectedCustomers.value.length === 0) return

  try {
    addingToGroup.value = true

    // Get numeric customer IDs
    const numericCustomerIds = selectedCustomers.value
      .map((code) => {
        const customer = getCustomerByCode(code)
        const numericId = resolveCustomerNumericId(customer?.id ?? code)
        return numericId
      })
      .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))

    if (numericCustomerIds.length === 0) {
      toast.add({
        title: 'Invalid customers',
        description: 'Could not resolve customer IDs.',
        color: 'warning',
      })
      return
    }

    const result = await addGroupMembers(selectedGroupId.value, {
      customer_ids: numericCustomerIds,
      note: addToGroupNote.value.trim() || null,
    })

    const groupName = selectedGroup.value?.name || 'the group'
    const ownerName = selectedGroup.value?.owner_name || 'the group owner'

    // Handle response with partial success
    if (result.failed > 0 && result.added > 0) {
      // Partial success: some added, some failed
      const errorMessages = result.errors.map((e) => {
        const customer = getCustomerByCode(e.customer_id.toString())
        const customerName = customer?.full_name || `Customer #${e.customer_id}`
        return `${customerName}: ${e.error}`
      }).join('\n')

      toast.add({
        title: 'Partially completed',
        description: `Added ${result.added} customer(s) to ${groupName}. ${result.failed} customer(s) could not be added.`,
        color: 'warning',
      })

      // Show detailed errors in a separate toast
      if (result.errors.length > 0) {
        toast.add({
          title: 'Errors details',
          description: errorMessages,
          color: 'error',
        })
      }
    } else if (result.failed > 0) {
      // All failed
      const errorMessages = result.errors.map((e) => {
        const customer = getCustomerByCode(e.customer_id.toString())
        const customerName = customer?.full_name || `Customer #${e.customer_id}`
        return `${customerName}: ${e.error}`
      }).join('\n')

      toast.add({
        title: 'Failed to add customers to group',
        description: errorMessages,
        color: 'error',
      })
    } else {
      // All succeeded
      toast.add({
        title: 'Customers added to group',
        description: `Successfully added ${result.added} customer(s) to ${groupName}. They have been automatically assigned to ${ownerName}.`,
        color: 'primary',
      })
    }

    // Refresh groups to update the mapping
    await refreshGroups()
    
    // Refresh sales assignments to update the Sale column
    // Customers added to group are automatically assigned to the group owner
    if (result.added > 0) {
      await refreshSalesWithCustomers()
    }

    // Only clear selection if all succeeded
    if (result.failed === 0) {
      isAddToGroupModalOpen.value = false
      selectedGroupId.value = null
      addToGroupNote.value = ''
      selectedCustomers.value = []
    } else {
      // Keep modal open if there were failures, but clear successfully added customers from selection
      // This is a simple approach - in a more sophisticated UI, we could show which ones failed
      // For now, we'll just keep the modal open so user can see the errors
    }
  } catch (error: any) {
    toast.add({
      title: 'Failed to add customers to group',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    addingToGroup.value = false
  }
}

// Apply search only on demand (e.g. Enter key) to avoid lag while typing
const applySearch = () => {
  appliedSearchQuery.value = searchQuery.value.trim()
  currentPage.value = 1
}

// Selection functions
const isSelected = (customerId: string) => {
  return selectedCustomers.value.includes(customerId)
}

const toggleSelect = (customerId: string) => {
  const index = selectedCustomers.value.indexOf(customerId)
  if (index > -1) {
    selectedCustomers.value.splice(index, 1)
  } else {
    selectedCustomers.value.push(customerId)
  }
}

const toggleSelectAll = () => {
  const pageCustomerIds = paginatedCustomers.value.map((c) => c.customer_id)

  if (allSelected.value) {
    // Bỏ chọn tất cả khách hàng ở trang hiện tại, nhưng giữ lại các trang khác
    selectedCustomers.value = selectedCustomers.value.filter(
      (id) => !pageCustomerIds.includes(id),
    )
  } else {
    // Chọn thêm tất cả khách hàng ở trang hiện tại, không mất các trang khác
    const set = new Set(selectedCustomers.value)
    for (const id of pageCustomerIds) {
      set.add(id)
    }
    selectedCustomers.value = Array.from(set)
  }
}

const clearSelection = () => {
  selectedCustomers.value = []
}

const allSelected = computed(() => {
  return (
    paginatedCustomers.value.length > 0 &&
    paginatedCustomers.value.every((c) => isSelected(c.customer_id))
  )
})

const someSelected = computed(() => {
  return (
    paginatedCustomers.value.some((c) => isSelected(c.customer_id)) && !allSelected.value
  )
})

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

const jumpToPageHandler = () => {
  if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
    goToPage(jumpToPage.value)
    jumpToPage.value = null
  }
}

// Watch itemsPerPage to reset to page 1
watch(itemsPerPage, () => {
  currentPage.value = 1
})

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format large numbers with compact notation
const largeNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatLargeNumber = (value: number | null | undefined): string => {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric) || numeric === 0) return '0'
  return largeNumberFormatter.format(numeric)
}

// Care Interaction functionality
// Care modal state
const isCareModalOpen = ref(false)
const careSelectedCustomer = ref<Customer | null>(null)
const careSelectedSalesUser = ref<SalesUserWithCustomers | null>(null)
const careSubmitting = ref(false)

const careAssignmentDate = computed(() => {
  if (!careSelectedCustomer.value || !careSelectedSalesUser.value) return null
  const customerKey = careSelectedCustomer.value.id ?? careSelectedCustomer.value.customer_id
  return getAssignmentDate(customerKey)
})

const careAssignmentNote = computed(() => {
  if (!careSelectedCustomer.value) return null
  const customerKey = careSelectedCustomer.value.id ?? careSelectedCustomer.value.customer_id
  return getAssignmentNote(customerKey)
})

watch(
  () => isCareModalOpen.value,
  (open) => {
    if (!open) {
      careSelectedCustomer.value = null
      careSelectedSalesUser.value = null
      careSubmitting.value = false
    }
  }
)

const openCareModal = (customer: Customer) => {
  const salesUser = getSalesUserForCustomer(customer.id ?? customer.customer_id)
  if (!salesUser) {
    toast.add({
      title: 'No sales user assigned',
      description: 'This customer is not assigned to any sales user. Please assign a sales user first.',
      color: 'warning',
    })
    return
  }
  careSelectedCustomer.value = customer
  careSelectedSalesUser.value = salesUser
  isCareModalOpen.value = true
}

const closeCareModal = () => {
  isCareModalOpen.value = false
}

const handleCareSubmit = async (payload: Parameters<typeof createCustomerInteraction>[0]) => {
  try {
    careSubmitting.value = true
    await createCustomerInteraction(payload)
    toast.add({
      title: 'Interaction saved',
      description: 'Customer care interaction has been recorded successfully.',
      color: 'primary',
    })
    isCareModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: 'Failed to save interaction',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    careSubmitting.value = false
  }
}

// Care History functionality
const isCareHistoryModalOpen = ref(false)
const careHistoryCustomer = ref<Customer | null>(null)
const careHistoryInteractions = ref<CustomerInteraction[]>([])
const careHistoryPending = ref(false)
const careHistoryError = ref<string | null>(null)

watch(
  () => isCareHistoryModalOpen.value,
  (open) => {
    if (!open) {
      careHistoryCustomer.value = null
      careHistoryInteractions.value = []
      careHistoryError.value = null
      careHistoryPending.value = false
    }
  }
)

const loadCareHistory = async (customer: Customer) => {
  careHistoryPending.value = true
  careHistoryError.value = null
  try {
    const customerNumericId = resolveCustomerNumericId(customer.id ?? customer.customer_id)
    if (!customerNumericId) {
      throw new Error('Could not resolve customer ID')
    }
    const interactions = await fetchInteractionsByCustomer(customerNumericId)
    careHistoryInteractions.value = interactions
  } catch (error: any) {
    careHistoryError.value = error?.message || 'Failed to load interactions'
  } finally {
    careHistoryPending.value = false
  }
}

const openHistoryModal = async (customer: Customer) => {
  careHistoryCustomer.value = customer
  isCareHistoryModalOpen.value = true
  await loadCareHistory(customer)
}

const handleCareHistoryModalClosePrevented = () => {
  // No-op: keep modal open while viewer is active
}

const closeCareHistoryModal = () => {
  isCareHistoryModalOpen.value = false
}

// Edit Note Modal
const isEditNoteModalOpen = ref(false)
const editNoteCustomer = ref<Customer | null>(null)
const editNoteText = ref('')
const editNoteSubmitting = ref(false)

const openEditNoteModal = (customer: Customer) => {
  const salesUser = getSalesUserForCustomer(customer.id ?? customer.customer_id)
  if (!salesUser) {
    toast.add({
      title: 'No sales user assigned',
      description: 'This customer is not assigned to any sales user.',
      color: 'warning',
    })
    return
  }
  editNoteCustomer.value = customer
  editNoteText.value = getAssignmentNote(customer.id ?? customer.customer_id) || ''
  isEditNoteModalOpen.value = true
}

const closeEditNoteModal = () => {
  isEditNoteModalOpen.value = false
  editNoteCustomer.value = null
  editNoteText.value = ''
  editNoteSubmitting.value = false
}

const handleSaveNote = async () => {
  if (!editNoteCustomer.value) return

  const salesUser = getSalesUserForCustomer(editNoteCustomer.value.id ?? editNoteCustomer.value.customer_id)
  if (!salesUser) return

  const customerNumericId = resolveCustomerNumericId(editNoteCustomer.value.id ?? editNoteCustomer.value.customer_id)
  if (!customerNumericId) {
    toast.add({
      title: 'Invalid customer ID',
      description: 'Could not resolve customer ID.',
      color: 'error',
    })
    return
  }

  const salesUserId = salesUser.sales_user_id
  if (!salesUserId || !Number.isInteger(Number(salesUserId))) {
    toast.add({
      title: 'Invalid sales user ID',
      description: 'Could not resolve sales user ID.',
      color: 'error',
    })
    return
  }

  try {
    editNoteSubmitting.value = true
    await updateSingleAssignmentNote({
      sales_user_id: Number(salesUserId),
      customer_id: Number(customerNumericId),
      note: editNoteText.value.trim() || null,
    })

    // Refresh data
    await refreshSalesWithCustomers()

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

const openEditCustomerModal = (customer: Customer) => {
  editCustomerId.value = customer.id ?? customer.customer_id
  editCustomerPayload.value = {
    full_name: customer.full_name,
    email: customer.email,
    phone_number: customer.phone_number || '',
    tier: customer.tier || 'STANDARD',
    referral_code: customer.referral_code || '',
    source_id: customer.source_id
  }
  isEditCustomerOpen.value = true
}

const submitEditCustomer = async () => {
  if (!editCustomerId.value) return
  isEditingCustomer.value = true
  try {
    await updateCustomer(editCustomerId.value, editCustomerPayload.value)
    toast.add({
      title: 'Success',
      description: 'Customer updated successfully',
      color: 'success',
    })
    isEditCustomerOpen.value = false
    refresh()
  } catch (error: any) {
    toast.add({
      title: 'Error updating customer',
      description: error.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    isEditingCustomer.value = false
  }
}

watch(isEditNoteModalOpen, (open) => {
  if (!open) {
    editNoteCustomer.value = null
    editNoteText.value = ''
    editNoteSubmitting.value = false
  }
})
</script>

<style scoped>
:deep(.popper) {
  z-index: 9999 !important;
}

:deep([role="listbox"]) {
  z-index: 9999 !important;
}

.filters-container {
  min-height: 4.5rem;
}

.filter-control {
  width: 100%;
}

@media (min-width: 768px) {
  .filter-control {
    width: 16rem;
  }
}

.filter-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

@media (min-width: 768px) {
  .filter-action {
    width: auto;
  }
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
</style>
