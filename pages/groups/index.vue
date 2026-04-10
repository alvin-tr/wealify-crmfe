<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
        <p class="text-sm text-gray-500">Manage and organize customer groups.</p>
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
        <UButton 
          v-if="canCreateGroup"
          color="primary" 
          icon="i-heroicons-plus" 
          @click="openCreateGroupModal"
        >
          New Group
        </UButton>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Loading groups...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-12 text-center">
      <p class="text-red-600">Error loading groups: {{ error.message }}</p>
      <UButton color="primary" variant="soft" @click="() => refresh()" class="mt-4">
        Retry
      </UButton>
    </div>

    <!-- Groups Table -->
    <UCard v-else-if="groups.length > 0">
      <template #header>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col md:flex-row md:items-start gap-3 filters-container">
            <UInput
              v-model="searchQuery"
              placeholder="Search groups..."
              icon="i-heroicons-magnifying-glass"
              class="w-full md:w-64"
            />
            <div class="flex flex-wrap items-center gap-2 w-full">
              <div v-if="canViewOwnerFilter" class="filter-control">
                <USelect
                  v-model="filters.ownerId"
                  :items="ownerFilterOptions"
                  placeholder="Filter by owner"
                  title="Filter by owner"
                  class="w-full"
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
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12">
                <!-- Expand/Collapse column -->
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Group Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Members
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Owner
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Leader Customer
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-for="group in filteredGroups" :key="group.id">
              <!-- Group Row -->
              <tr
                class="hover:bg-gray-50 dark:bg-gray-800/50 transition-colors"
                :class="{ 'bg-indigo-50': expandedGroups.has(group.id!) }"
              >
                <td class="px-4 py-4">
                  <button
                    type="button"
                    class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-200 transition-colors"
                    @click="toggleGroupExpand(group.id!)"
                  >
                    <UIcon
                      :name="expandedGroups.has(group.id!) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                      class="w-5 h-5 text-gray-600 dark:text-gray-300"
                    />
                  </button>
                </td>
                <td class="px-4 py-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="slds-icon-glyph text-[20px] text-indigo-500 slds-icons-groups" aria-hidden="true"></span>
                      <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ group.name }}</span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300 mt-2">
                      <div class="flex items-center gap-1">
                        <UIcon name="i-heroicons-chart-bar" class="h-3.5 w-3.5 text-gray-400" />
                        <span>30d: <span class="font-semibold text-gray-900 dark:text-white">{{ formatLargeNumber(getGroupVolume30d(group)) }}</span></span>
                      </div>
                      <div class="flex items-center gap-1">
                        <UIcon name="i-heroicons-currency-dollar" class="h-3.5 w-3.5 text-gray-400" />
                        <span>Total: <span class="font-semibold text-gray-900 dark:text-white">{{ formatLargeNumber(getGroupTotalVolume(group)) }}</span></span>
                      </div>
                    </div>
                    <div class="mt-2">
                      <UButton
                        icon="i-heroicons-clock"
                        variant="ghost"
                        color="primary"
                        size="xs"
                        title="View Care History"
                        @click="openGroupCareHistoryModal(group)"
                      >
                        View Care History
                      </UButton>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate" :title="group.description || ''">
                    {{ group.description || '—' }}
                  </p>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-users" class="h-4 w-4 text-indigo-500" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ group.member_count || 0 }}</span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div v-if="group.owner_name" class="flex items-center gap-2">
                    <UIcon name="i-heroicons-user-circle" class="h-4 w-4 text-gray-400" />
                    <span class="text-sm text-gray-600 dark:text-gray-300">{{ group.owner_name }}</span>
                  </div>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <td class="px-4 py-4">
                  <div v-if="getLeaderCustomerName(group)" class="flex items-center gap-2">
                    <span class="slds-icon-glyph text-[16px] text-amber-500 slds-icons-new_opportunity" aria-hidden="true"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-300">{{ getLeaderCustomerName(group) }}</span>
                  </div>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <UButton
                      icon="i-heroicons-chart-bar"
                      variant="ghost"
                      color="primary"
                      size="xs"
                      title="View Analytics"
                      @click="openGroupAnalyticsModal(group)"
                    />
                    <UButton
                      icon="i-heroicons-pencil"
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      @click="openEditGroupModal(group)"
                    />
                    <UButton
                      icon="i-heroicons-user-plus"
                      variant="ghost"
                      color="primary"
                      size="xs"
                      title="Assign to Sales User"
                      @click="openAssignGroupToSaleModal(group)"
                    />
                    <UButton
                      v-if="canAddMember"
                      icon="i-heroicons-plus"
                      variant="ghost"
                      color="primary"
                      size="xs"
                      @click="openAddMembersModalForGroup(group)"
                    />
                    <UButton
                      v-if="canRemoveGroup"
                      icon="i-heroicons-trash"
                      variant="ghost"
                      color="error"
                      size="xs"
                      @click="openDeleteConfirm(group)"
                    />
                  </div>
                </td>
              </tr>

              <!-- Expanded Members Rows -->
              <tr v-if="expandedGroups.has(group.id!)" class="bg-gray-50 dark:bg-gray-800/50">
                <td colspan="7" class="px-4 py-4">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Members ({{ groupMembersMap.get(group.id!)?.length || 0 }})
                      </h4>
                      <UButton
                        v-if="canAddMember"
                        color="primary"
                        variant="soft"
                        size="xs"
                        icon="i-heroicons-plus"
                        @click="openAddMembersModalForGroup(group)"
                      >
                        Add Members
                      </UButton>
                    </div>

                    <!-- Loading Members -->
                    <div v-if="loadingMembers.has(group.id!)" class="py-4 text-center text-gray-500">
                      <div class="flex items-center justify-center gap-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span class="text-xs">Loading members...</span>
                      </div>
                    </div>

                    <!-- Members Table -->
                    <div v-else-if="groupMembersMap.get(group.id!)?.length" class="overflow-x-auto">
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="border-b border-gray-300">
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">ID</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Email</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Phone</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Volume (30d)</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total Volume</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Assigned At</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Note</th>
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                          <tr
                            v-for="member in groupMembersMap.get(group.id!)"
                            :key="member.id"
                            class="hover:bg-white dark:bg-gray-900 transition-colors"
                          >
                            <td class="px-3 py-2">
                              <span class="text-sm font-mono text-gray-900 dark:text-white">
                                {{ member.customer_id }}
                              </span>
                            </td>
                            <td class="px-3 py-2">
                              <span class="font-medium text-gray-900 dark:text-white">
                                {{ getCustomerInfo(member).name || `Customer #${member.customer_id}` }}
                              </span>
                            </td>
                            <td class="px-3 py-2 text-gray-600 dark:text-gray-300">
                              {{ getCustomerInfo(member).email || '—' }}
                            </td>
                            <td class="px-3 py-2 text-gray-600 dark:text-gray-300">
                              {{ getCustomerInfo(member).phone || '—' }}
                            </td>
                            <td class="px-3 py-2 text-gray-900 dark:text-white font-semibold">
                              {{ formatLargeNumber(getCustomerVolume(member.customer_id)?.volume_last_30d) }}
                            </td>
                            <td class="px-3 py-2 text-gray-900 dark:text-white font-semibold">
                              {{ formatLargeNumber(getCustomerVolume(member.customer_id)?.total_volume) }}
                            </td>
                            <td class="px-3 py-2 text-gray-600 dark:text-gray-300">
                              {{ formatDate(member.assigned_at) }}
                            </td>
                            <td class="px-3 py-2 text-gray-600 dark:text-gray-300">
                              <span v-if="member.note" class="text-xs italic">"{{ member.note }}"</span>
                              <span v-else class="text-gray-400">—</span>
                            </td>
                            <td class="px-3 py-2">
                              <div class="flex items-center gap-1 flex-wrap">
                                <UButton
                                  icon="i-heroicons-document-plus"
                                  variant="ghost"
                                  color="primary"
                                  size="xs"
                                  title="Log Care Interaction"
                                  @click="openCareModalForMember(member, group)"
                                >
                                  Log Care
                                </UButton>
                                <UButton
                                  icon="i-heroicons-clock"
                                  variant="ghost"
                                  color="neutral"
                                  size="xs"
                                  title="View History"
                                  @click="openHistoryModalForMember(member, group)"
                                >
                                  History
                                </UButton>
                                <UButton
                                  variant="ghost"
                                  color="primary"
                                  size="xs"
                                  title="View Detail"
                                  @click="openCustomerInfoModalForMember(member)"
                                >
                                  <span class="slds-icon-glyph text-[16px] text-primary-600 slds-icons-preview" aria-hidden="true"></span>
                                </UButton>
                                <UButton
                                  v-if="group.leader_customer_id !== member.customer_id"
                                  variant="ghost"
                                  color="primary"
                                  size="xs"
                                  title="Set as Leader Customer"
                                  @click="handleSetLeaderCustomer(group, member)"
                                >
                                  <span class="slds-icon-glyph text-[14px] text-amber-500 slds-icons-new_opportunity" aria-hidden="true"></span>
                                </UButton>
                                <UBadge
                                  v-else
                                  color="warning"
                                  variant="soft"
                                  size="xs"
                                  class="text-xs"
                                >
                                  <span class="slds-icon-glyph text-[12px] mr-1 slds-icons-new_opportunity" aria-hidden="true"></span>
                                  Leader
                                </UBadge>
                                <UButton
                                  icon="i-heroicons-trash"
                                  variant="ghost"
                                  color="error"
                                  size="xs"
                                  @click="openRemoveMemberConfirm(member, group)"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- No Members -->
                    <div v-else class="py-4 text-center text-gray-500">
                      <p class="text-sm">No members in this group</p>
                      <UButton
                        v-if="canAddMember"
                        color="primary"
                        variant="soft"
                        size="xs"
                        icon="i-heroicons-plus"
                        class="mt-2"
                        @click="openAddMembersModalForGroup(group)"
                      >
                        Add Members
                      </UButton>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Empty State -->
    <UCard v-else>
      <div class="py-12 text-center text-gray-500">
        <div class="flex flex-col items-center gap-3">
          <span class="slds-icon-glyph text-[48px] text-gray-300 slds-icons-groups" aria-hidden="true"></span>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ hasActiveFilters ? 'No groups match your filters' : 'No groups found' }}
          </p>
          <p class="text-xs text-gray-500">
            {{ hasActiveFilters ? 'Try adjusting your filters or create a new group.' : 'Create your first group to get started.' }}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <UButton 
              v-if="hasActiveFilters"
              color="neutral" 
              variant="soft"
              @click="resetFilters"
            >
              Clear Filters
            </UButton>
            <UButton 
              v-if="canCreateGroup"
              color="primary" 
              icon="i-heroicons-plus" 
              @click="openCreateGroupModal"
            >
              Create Group
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Create/Edit Group Modal -->
    <CreateGroupModal
      v-model:open="isGroupModalOpen"
      :group="editingGroup"
      @saved="handleGroupSaved"
    />

    <!-- Group Detail Modal -->
    <UModal
      v-model:open="isDetailModalOpen"
      :title="selectedGroup ? `Group: ${selectedGroup.name}` : 'Group Details'"
      size="xl"
    >
      <template #body>
        <div v-if="selectedGroup" class="space-y-6">
          <!-- Group Info -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
            <div>
              <h3 class="text-sm font-semibold text-gray-500 uppercase">Description</h3>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ selectedGroup.description || 'No description' }}
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase">Owner</h3>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ selectedGroup.owner_name || '—' }}
                </p>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase">Leader Customer</h3>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  {{ selectedGroup ? getLeaderCustomerName(selectedGroup) || '—' : '—' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Members Section -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Members ({{ groupMembers.length }})
              </h3>
              <UButton
                v-if="canAddMember"
                color="primary"
                variant="soft"
                size="sm"
                icon="i-heroicons-plus"
                @click="openAddMembersModal"
              >
                Add Members
              </UButton>
            </div>

            <div v-if="membersPending" class="py-8 text-center text-gray-500">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
              <p class="mt-2 text-sm">Loading members...</p>
            </div>

            <div v-else-if="groupMembers.length === 0" class="py-8 text-center text-gray-500">
              <p class="text-sm">No members in this group</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="member in groupMembers"
                :key="member.id"
                class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:bg-gray-800/50"
              >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ getCustomerInfo(member).name || `Customer #${member.customer_id}` }}
                  </p>
                  <div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span v-if="getCustomerInfo(member).email">{{ getCustomerInfo(member).email }}</span>
                    <span v-if="getCustomerInfo(member).phone">{{ getCustomerInfo(member).phone }}</span>
                    <span v-if="member.assigned_at">
                      Added {{ formatDate(member.assigned_at) }}
                    </span>
                  </div>
                  <p v-if="member.note" class="mt-1 text-xs text-gray-600 dark:text-gray-300 italic">
                    "{{ member.note }}"
                  </p>
                </div>
                <UButton
                  icon="i-heroicons-trash"
                  variant="ghost"
                  color="error"
                  size="xs"
                  @click="openRemoveMemberConfirm(member)"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Close</UButton>
          <UButton
            v-if="selectedGroup"
            color="primary"
            variant="soft"
            icon="i-heroicons-pencil"
            @click="openEditGroupModal(selectedGroup)"
          >
            Edit Group
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Add Members Modal -->
    <UModal
      v-model:open="isAddMembersModalOpen"
      title="Add Members to Group"
      :ui="{ content: 'w-full max-w-2xl' }"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Search Input -->
          <UInput
            v-model="addMembersSearchQuery"
            placeholder="Search customers..."
            icon="i-heroicons-magnifying-glass"
            class="mb-4"
          />

          <!-- Selected Customers -->
          <div v-if="selectedCustomerIdsForAdd.length > 0" class="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-primary-700">
                Selected ({{ selectedCustomerIdsForAdd.length }})
              </span>
              <UButton
                variant="ghost"
                color="primary"
                size="xs"
                @click="selectedCustomerIdsForAdd = []"
              >
                Clear All
              </UButton>
            </div>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="customerId in selectedCustomerIdsForAdd"
                :key="customerId"
                :label="getCustomerNameForAdd(customerId)"
                color="primary"
                variant="soft"
                class="cursor-pointer hover:opacity-80"
                @click="toggleCustomerForAdd(customerId)"
              >
                <template #trailing>
                  <UIcon name="i-heroicons-x-mark" class="h-3 w-3 ml-1" />
                </template>
              </UBadge>
            </div>
          </div>

          <!-- Customers List -->
          <div v-if="addMembersCustomersLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-500">Loading customers...</p>
          </div>
          <div v-else-if="!addMembersSearchQueryDebounced.trim()" class="text-center py-8 text-sm text-gray-400">
            Start typing to search for customers (minimum 2 characters)...
          </div>
          <div v-else-if="addMembersSearchQueryDebounced.trim().length < 2" class="text-center py-8 text-sm text-gray-400">
            Please type at least 2 characters to search...
          </div>
          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="customer in filteredCustomersForAdd"
              :key="customer.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800/50"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ customer.full_name.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ customer.email }} · {{ customer.customer_id }}</p>
                </div>
              </div>
              <UButton
                v-if="isCustomerSelectedForAdd(customer.id!)"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="toggleCustomerForAdd(customer.id!)"
              >
                Remove
              </UButton>
              <UButton
                v-else
                variant="ghost"
                color="primary"
                size="xs"
                icon="i-heroicons-plus"
                @click="toggleCustomerForAdd(customer.id!)"
              >
                Add
              </UButton>
            </div>
            <div v-if="filteredCustomersForAdd.length === 0 && addMembersSearchQueryDebounced.trim()" class="text-center py-8 text-sm text-gray-400">
              No customers found
            </div>
          </div>

          <!-- Note Textarea -->
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Note <span class="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <UTextarea
                v-model="addMembersForm.note"
                placeholder="Add a note for these members"
                :rows="4"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="addingMembers"
            :disabled="selectedCustomerIdsForAdd.length === 0"
            @click="handleAddMembers"
          >
            Add Members ({{ selectedCustomerIdsForAdd.length }})
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteConfirmOpen" title="Delete Group">
      <template #body>
        <p class="text-sm text-gray-700 dark:text-gray-200">
          Are you sure you want to delete the group
          <span class="font-semibold">"{{ groupToDelete?.name }}"</span>?
          This action cannot be undone and all members will be removed from this group.
        </p>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="error"
            :loading="deleting"
            @click="handleDeleteGroup"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Remove Member Confirmation Modal -->
    <UModal v-model:open="isRemoveMemberConfirmOpen" title="Remove Member">
      <template #body>
        <p class="text-sm text-gray-700 dark:text-gray-200">
          Are you sure you want to remove
          <span class="font-semibold">
            {{ memberToRemove ? (getCustomerInfo(memberToRemove).name || `Customer #${memberToRemove.customer_id}`) : '' }}
          </span>
          from this group?
        </p>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="error"
            :loading="removingMember"
            @click="handleRemoveMember"
          >
            Remove
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Assign Group to Sale Modal -->
    <UModal
      v-model:open="isAssignGroupToSaleModalOpen"
      title="Assign Group to Sales User"
      size="lg"
    >
      <template #body>
        <div class="space-y-6">
          <div v-if="groupToAssign">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Assign sales user to group:
            </p>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ groupToAssign.name }}</p>
              <p v-if="groupToAssign.description" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {{ groupToAssign.description }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Sales User
              <span class="text-gray-400 text-xs font-normal ml-1">(optional)</span>
            </label>
            <USelect
              v-model="selectedSalesUserForGroup"
              :items="salesUserOptionsForAssign"
              placeholder="Select sales user"
              size="lg"
              class="w-full"
              :disabled="salesUsersForAssignPending"
            />
            <p class="text-xs text-gray-500">
              Assign a sales user as the group owner. Leave empty to remove current owner.
            </p>
          </div>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="close">Cancel</UButton>
          <UButton
            color="primary"
            :loading="assigningGroupToSale"
            @click="handleAssignGroupToSale"
          >
            Assign
          </UButton>
        </div>
      </template>
    </UModal>

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

    <!-- Group Care History Modal -->
    <GroupCareHistoryModal
      v-model:open="isGroupCareHistoryModalOpen"
      :group-name="selectedGroupForHistory?.name || null"
      :customer-ids="groupHistoryCustomerIds"
      :customers="customers || []"
    />

    <!-- Customer Detail Modal -->
    <CustomerCareCustomerDetailModal
      v-model:open="isCustomerInfoOpen"
      :customer="customerInfoCustomer"
      :sales-user-info="customerInfoDetail"
      :customer-numeric-id="customerInfoDetail?.numericId ?? null"
      @close="closeCustomerInfoModal"
    />

    <!-- Group Analytics Modal -->
    <UModal
      v-model:open="isGroupAnalyticsModalOpen"
      :ui="{ content: 'w-[95vw] max-w-[1400px] h-[90vh]' }"
      :title="selectedGroupForAnalytics ? `Analytics · ${selectedGroupForAnalytics.name}` : 'Group Analytics'"
    >
      <template #body>
        <div class="h-full flex flex-col">
          <div v-if="groupAnalyticsLoading" class="flex h-full items-center justify-center text-gray-500 px-4 py-12">
            <div class="flex items-center gap-3">
              <div class="h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600"></div>
              <span>Loading analytics dashboard…</span>
            </div>
          </div>
          <div v-else-if="groupAnalyticsError" class="h-full flex items-center justify-center text-sm text-red-600 px-4 text-center">
            {{ groupAnalyticsError }}
          </div>
          <iframe
            v-else-if="groupAnalyticsEmbedUrl"
            :src="groupAnalyticsEmbedUrl"
            class="w-full h-full border-0 flex-1"
            allowtransparency="true"
            allowfullscreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-downloads"
          />
          <div v-else class="h-full flex items-center justify-center text-sm text-gray-400 px-4 py-12">
            No analytics dashboard available.
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end">
          <UButton variant="ghost" color="neutral" @click="closeGroupAnalyticsModal">Close</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type {
  CustomerGroupWithDetails,
  CustomerGroupMember,
  CreateCustomerGroupPayload,
  UpdateCustomerGroupPayload,
} from '~/composables/useCustomerGroups'
import type { Customer } from '~/composables/useCustomers'
import type { SalesUser } from '~/composables/useSalesUsers'
import type { SalesUserWithCustomers, CustomerAssignment } from '~/composables/useCustomerAssignments'
import type { CustomerInteraction, InteractionType } from '~/composables/useCustomerInteractions'
import { useCustomerGroups } from '~/composables/useCustomerGroups'
import { useSalesUsers } from '~/composables/useSalesUsers'
import { useCustomers } from '~/composables/useCustomers'
import { useCustomerAssignments } from '~/composables/useCustomerAssignments'
import { useCustomerInteractions } from '~/composables/useCustomerInteractions'
import { useImageViewer } from '~/composables/useImageViewer'
import CreateGroupModal from '~/components/groups/CreateGroupModal.vue'
import GroupCareHistoryModal from '~/components/groups/GroupCareHistoryModal.vue'
import CustomerCareCustomerDetailModal from '~/components/customer-care/CustomerDetailModal.vue'

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()
const auth = useAuth()

// Permissions
const { hasPermission } = usePermissions()
const canCreateGroup = computed(() => {
  // Allow sales users to create groups
  if (auth.user.value?.role === 'sales') {
    return true
  }
  return hasPermission('groups', 'createGroup')
})
const canAddMember = computed(() => {
  // Allow sales users to add members to groups
  if (auth.user.value?.role === 'sales') {
    return true
  }
  return hasPermission('groups', 'addMember')
})
const canRemoveGroup = computed(() => hasPermission('groups', 'removeGroup'))
const canViewOwnerFilter = computed(() => hasPermission('groups', 'viewOwnerFilter'))

// Check if user role is sales
const isSalesRole = computed(() => auth.user.value?.role === 'sales')

const {
  fetchCustomerGroups,
  deleteCustomerGroup,
  fetchGroupMembers,
  addGroupMembers,
  removeGroupMember,
  updateCustomerGroup,
} = useCustomerGroups()

const { fetchCustomers, getCachedCustomers } = useCustomers()
const { fetchSalesUsers } = useSalesUsers()
const { fetchSalesWithCustomers } = useCustomerAssignments()
const { fetchInteractionsByCustomer, createCustomerInteraction } = useCustomerInteractions()

// Use image viewer composable
const {
  galleryImages,
  attachmentGalleryRef,
  isViewerActive,
  isImageAttachment,
  getAttachmentIcon,
  openViewer,
} = useImageViewer()

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
    console.error('Failed to fetch customer volumes:', error)
    return []
  }
}

const { data: customerVolumes } = useLazyAsyncData(
  'customer-volumes-for-groups',
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
const getCustomerVolume = (customerId: number | null | undefined): CustomerVolume | null => {
  if (customerId === null || customerId === undefined) return null
  return customerVolumesMap.value.get(customerId) || null
}

// Helper to calculate group volume 30d (sum of all members)
const getGroupVolume30d = (group: CustomerGroupWithDetails): number => {
  const members = groupMembersMap.value.get(group.id!)
  if (!members || members.length === 0) return 0
  
  return members.reduce((sum, member) => {
    const volume = getCustomerVolume(member.customer_id)
    return sum + (volume?.volume_last_30d || 0)
  }, 0)
}

// Helper to calculate group total volume (sum of all members)
const getGroupTotalVolume = (group: CustomerGroupWithDetails): number => {
  const members = groupMembersMap.value.get(group.id!)
  if (!members || members.length === 0) return 0
  
  return members.reduce((sum, member) => {
    const volume = getCustomerVolume(member.customer_id)
    return sum + (volume?.total_volume || 0)
  }, 0)
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

// Expanded groups tracking (moved before fetchGroups to ensure it's available)
const expandedGroups = ref<Set<number>>(new Set())
const groupMembersMap = ref<Map<number, CustomerGroupMember[]>>(new Map())
const loadingMembers = ref<Set<number>>(new Set())

// Filters
const searchQuery = ref('')
const filters = reactive({
  ownerId: null as number | null,
})

// Fetch groups
const {
  data: groups,
  pending,
  error,
  refresh,
} = useAsyncData('customer-groups', async () => {
  const groupsData = await fetchCustomerGroups()
  // Pre-load members for all groups in background to calculate volumes
  if (groupsData && groupsData.length > 0) {
    // Load members for all groups in parallel (background, don't await to show groups immediately)
    Promise.all(
      groupsData.map(async (group) => {
        if (group.id) {
          try {
            const members = await fetchGroupMembers(group.id)
            groupMembersMap.value.set(group.id, members)
          } catch (error) {
            // Silently fail - members will be loaded on expand
            console.warn(`Failed to pre-load members for group ${group.id}:`, error)
          }
        }
      })
    ).catch((error) => {
      console.warn('Some groups failed to pre-load members:', error)
    })
  }
  return groupsData
}, {
  default: () => [],
  lazy: true,
  server: false,
})


// Fetch customers (with cache) for member details
const cachedCustomers = getCachedCustomers()
const {
  data: customers,
  pending: customersPending,
} = useAsyncData('customers-for-groups', () => fetchCustomers(), {
  default: () => cachedCustomers || [],
  lazy: true,
  server: false,
})

// Create a map for quick customer lookup
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

// Helper to get customer info from member
const getCustomerInfo = (member: CustomerGroupMember) => {
  const customer = customersMap.value.get(member.customer_id)
  if (!customer) {
    return {
      name: null,
      email: null,
      phone: null,
    }
  }
  return {
    name: customer.full_name,
    email: customer.email,
    phone: customer.phone_number || null,
  }
}

// Helper to get leader customer name from members
const getLeaderCustomerName = (group: CustomerGroupWithDetails) => {
  if (!group.leader_customer_id) return null
  
  // Try to get from members if loaded
  const members = groupMembersMap.value.get(group.id!)
  if (members) {
    const leaderMember = members.find(m => m.customer_id === group.leader_customer_id)
    if (leaderMember) {
      const info = getCustomerInfo(leaderMember)
      return info.name
    }
  }
  
  // Fallback to customers map
  const customer = customersMap.value.get(group.leader_customer_id)
  return customer?.full_name || null
}

// Group modal
const isGroupModalOpen = ref(false)
const editingGroup = ref<CustomerGroupWithDetails | null>(null)

const openCreateGroupModal = () => {
  editingGroup.value = null
  isGroupModalOpen.value = true
}

const openEditGroupModal = (group: CustomerGroupWithDetails) => {
  editingGroup.value = group
  isGroupModalOpen.value = true
}

const handleGroupSaved = async () => {
  await refresh()
}

const toggleGroupExpand = async (groupId: number) => {
  if (expandedGroups.value.has(groupId)) {
    // Collapse
    expandedGroups.value.delete(groupId)
  } else {
    // Expand - load members if not already loaded
    expandedGroups.value.add(groupId)
    if (!groupMembersMap.value.has(groupId)) {
      await loadGroupMembers(groupId)
    }
  }
}

const loadGroupMembers = async (groupId: number) => {
  loadingMembers.value.add(groupId)
  try {
    const members = await fetchGroupMembers(groupId)
    groupMembersMap.value.set(groupId, members)
  } catch (error: any) {
    toast.add({
      title: 'Failed to load members',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    loadingMembers.value.delete(groupId)
  }
}

// Group detail (kept for backward compatibility with modals)
const isDetailModalOpen = ref(false)
const selectedGroup = ref<CustomerGroupWithDetails | null>(null)
const groupMembers = ref<CustomerGroupMember[]>([])
const membersPending = ref(false)

const openGroupDetail = async (group: CustomerGroupWithDetails) => {
  selectedGroup.value = group
  isDetailModalOpen.value = true
  await loadGroupMembersForModal(group.id!)
}

const loadGroupMembersForModal = async (groupId: number) => {
  membersPending.value = true
  try {
    groupMembers.value = await fetchGroupMembers(groupId)
  } catch (error: any) {
    toast.add({
      title: 'Failed to load members',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    membersPending.value = false
  }
}

// Add members
const isAddMembersModalOpen = ref(false)
const addingMembers = ref(false)
const addMembersForm = reactive({
  note: '',
})
const addMembersGroupId = ref<number | null>(null)
const selectedCustomerIdsForAdd = ref<number[]>([])
const addMembersSearchQuery = ref('')
const addMembersSearchQueryDebounced = ref('')
const addMembersCustomersLoading = ref(false)
const addMembersCustomers = ref<Customer[]>([])

// Debounce search query for better performance
let addMembersSearchTimeout: ReturnType<typeof setTimeout> | null = null

watch(addMembersSearchQuery, (newValue) => {
  if (addMembersSearchTimeout) {
    clearTimeout(addMembersSearchTimeout)
  }
  addMembersSearchTimeout = setTimeout(() => {
    addMembersSearchQueryDebounced.value = newValue
  }, 300) // 300ms debounce
})

// Filtered customers for add members
const filteredCustomersForAdd = computed(() => {
  // Only show results when there's a search query (minimum 2 characters)
  if (!addMembersSearchQueryDebounced.value.trim() || addMembersSearchQueryDebounced.value.trim().length < 2) {
    return []
  }
  const query = addMembersSearchQueryDebounced.value.toLowerCase()
  
  // Start with all customers
  let availableCustomers = addMembersCustomers.value
  
  // If user is sales role, filter to only show customers assigned to them
  if (isSalesRole.value && currentSalesUserCustomerIds.value.size > 0) {
    availableCustomers = availableCustomers.filter((customer) => {
      const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
      if (Number.isFinite(numericId)) {
        return currentSalesUserCustomerIds.value.has(numericId)
      }
      return false
    })
  }
  
  // Apply search filter
  const filtered = availableCustomers.filter((customer) =>
    customer.full_name.toLowerCase().includes(query) ||
    customer.email.toLowerCase().includes(query) ||
    customer.customer_id.toLowerCase().includes(query)
  )
  return filtered.slice(0, 100) // Limit to 100 results for performance
})

// Check if customer is selected
const isCustomerSelectedForAdd = (customerId: number | string): boolean => {
  const id = typeof customerId === 'string' ? Number(customerId) : customerId
  return selectedCustomerIdsForAdd.value.includes(id)
}

// Toggle customer selection
const toggleCustomerForAdd = (customerId: number | string) => {
  const id = typeof customerId === 'string' ? Number(customerId) : customerId
  const index = selectedCustomerIdsForAdd.value.indexOf(id)
  if (index > -1) {
    selectedCustomerIdsForAdd.value.splice(index, 1)
  } else {
    selectedCustomerIdsForAdd.value.push(id)
  }
}

// Get customer name for display
const getCustomerNameForAdd = (customerId: number): string => {
  const customer = addMembersCustomers.value.find((c) => {
    const id = typeof c.id === 'string' ? Number(c.id) : c.id
    return id === customerId
  })
  return customer ? `${customer.full_name} (${customer.customer_id})` : `Customer #${customerId}`
}

const openAddMembersModal = () => {
  selectedCustomerIdsForAdd.value = []
  addMembersForm.note = ''
  addMembersSearchQuery.value = ''
  addMembersSearchQueryDebounced.value = ''
  addMembersGroupId.value = null
  isAddMembersModalOpen.value = true
  
  // Load customers from cache or fetch in background
  const cached = getCachedCustomers()
  if (cached && cached.length > 0) {
    addMembersCustomers.value = cached
  } else if (addMembersCustomers.value.length === 0) {
    addMembersCustomersLoading.value = true
    fetchCustomers()
      .then((customers) => {
        addMembersCustomers.value = customers
      })
      .catch((error: any) => {
        console.error('[Groups] Error loading customers:', error)
      })
      .finally(() => {
        addMembersCustomersLoading.value = false
      })
  }
}

const openAddMembersModalForGroup = (group: CustomerGroupWithDetails) => {
  // Check if sales user is the owner of the group
  if (isSalesRole.value && currentUserSalesUserId.value !== null) {
    if (group.owner_id !== currentUserSalesUserId.value) {
      toast.add({
        title: 'Permission denied',
        description: 'You can only add members to groups that you own.',
        color: 'error',
      })
      return
    }
  }
  
  selectedCustomerIdsForAdd.value = []
  addMembersForm.note = ''
  addMembersSearchQuery.value = ''
  addMembersSearchQueryDebounced.value = ''
  addMembersGroupId.value = group.id ?? null
  selectedGroup.value = group
  isAddMembersModalOpen.value = true
  
  // Load customers from cache or fetch in background
  const cached = getCachedCustomers()
  if (cached && cached.length > 0) {
    addMembersCustomers.value = cached
  } else if (addMembersCustomers.value.length === 0) {
    addMembersCustomersLoading.value = true
    fetchCustomers()
      .then((customers) => {
        addMembersCustomers.value = customers
      })
      .catch((error: any) => {
        console.error('[Groups] Error loading customers:', error)
      })
      .finally(() => {
        addMembersCustomersLoading.value = false
      })
  }
}

const handleAddMembers = async () => {
  const groupId = addMembersGroupId.value || selectedGroup.value?.id
  if (!groupId || selectedCustomerIdsForAdd.value.length === 0) return

  // Check if sales user is the owner of the group
  if (isSalesRole.value && currentUserSalesUserId.value !== null && selectedGroup.value) {
    if (selectedGroup.value.owner_id !== currentUserSalesUserId.value) {
      toast.add({
        title: 'Permission denied',
        description: 'You can only add members to groups that you own.',
        color: 'error',
      })
      return
    }
  }

  try {
    addingMembers.value = true

    const result = await addGroupMembers(groupId, {
      customer_ids: selectedCustomerIdsForAdd.value,
      note: addMembersForm.note.trim() || null,
    })

    // Check the actual result from API
    const { added, failed, errors } = result

    // All members added successfully
    if (added > 0 && failed === 0) {
      toast.add({
        title: 'Members added',
        description: `Successfully added ${added} member(s) to the group.`,
        color: 'primary',
      })
    }
    // Some members added, some failed
    else if (added > 0 && failed > 0) {
      const errorMessages = errors?.map(e => {
        const customerName = getCustomerNameForAdd(e.customer_id)
        return `${customerName}: ${e.error}`
      }).join('; ') || 'Some customers could not be added'
      
      toast.add({
        title: 'Partially added',
        description: `Added ${added} member(s), ${failed} failed. ${errorMessages}`,
        color: 'warning',
      })
    }
    // All members failed
    else if (added === 0 && failed > 0) {
      const errorMessages = errors?.map(e => {
        const customerName = getCustomerNameForAdd(e.customer_id)
        return `${customerName}: ${e.error}`
      }).join('; ') || 'All customers could not be added'
      
      toast.add({
        title: 'Failed to add members',
        description: `None of the selected members could be added. ${errorMessages}`,
        color: 'error',
      })
      // Don't close modal if all failed, so user can see what went wrong
      return
    }
    // No members processed (shouldn't happen, but handle it)
    else {
      toast.add({
        title: 'No members added',
        description: 'No members were processed. Please try again.',
        color: 'warning',
      })
      return
    }

    // Only close modal and reset if at least some members were added
    isAddMembersModalOpen.value = false
    selectedCustomerIdsForAdd.value = []
    addMembersForm.note = ''
    addMembersSearchQuery.value = ''
    addMembersSearchQueryDebounced.value = ''
    
    // Reload members for the group if it's expanded
    if (expandedGroups.value.has(groupId)) {
      await loadGroupMembers(groupId)
    }
    // Also reload for modal if it's open
    if (isDetailModalOpen.value && selectedGroup.value?.id === groupId) {
      await loadGroupMembersForModal(groupId)
    }
    await refresh() // Refresh groups list to update member count
  } catch (error: any) {
    toast.add({
      title: 'Failed to add members',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    addingMembers.value = false
  }
}

// Delete group
const isDeleteConfirmOpen = ref(false)
const groupToDelete = ref<CustomerGroupWithDetails | null>(null)
const deleting = ref(false)

const openDeleteConfirm = (group: CustomerGroupWithDetails) => {
  groupToDelete.value = group
  isDeleteConfirmOpen.value = true
}

const handleDeleteGroup = async () => {
  if (!groupToDelete.value?.id) return

  try {
    deleting.value = true
    await deleteCustomerGroup(groupToDelete.value.id)
    toast.add({
      title: 'Group deleted',
      description: 'The group has been deleted successfully.',
      color: 'primary',
    })
    isDeleteConfirmOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete group',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

// Remove member
const isRemoveMemberConfirmOpen = ref(false)
const memberToRemove = ref<CustomerGroupMember | null>(null)
const removingMember = ref(false)
const memberToRemoveGroupId = ref<number | null>(null)

const openRemoveMemberConfirm = (member: CustomerGroupMember, group?: CustomerGroupWithDetails) => {
  memberToRemove.value = member
  memberToRemoveGroupId.value = group?.id ?? selectedGroup.value?.id ?? null
  isRemoveMemberConfirmOpen.value = true
}

const handleRemoveMember = async () => {
  const groupId = memberToRemoveGroupId.value || selectedGroup.value?.id
  if (!groupId || !memberToRemove.value) return

  try {
    removingMember.value = true
    await removeGroupMember(groupId, memberToRemove.value.customer_id)
    toast.add({
      title: 'Member removed',
      description: 'The member has been removed from the group.',
      color: 'primary',
    })
    isRemoveMemberConfirmOpen.value = false
    // Reload members for the group if it's expanded
    if (expandedGroups.value.has(groupId)) {
      await loadGroupMembers(groupId)
    }
    // Also reload for modal if it's open
    if (isDetailModalOpen.value && selectedGroup.value?.id === groupId) {
      await loadGroupMembersForModal(groupId)
    }
    await refresh() // Refresh groups list to update member count
  } catch (error: any) {
    toast.add({
      title: 'Failed to remove member',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    removingMember.value = false
  }
}

// Set Leader Customer
const settingLeader = ref(false)

const handleSetLeaderCustomer = async (group: CustomerGroupWithDetails, member: CustomerGroupMember) => {
  if (!group.id) return

  try {
    settingLeader.value = true
    await updateCustomerGroup(group.id, {
      leader_customer_id: member.customer_id,
    })

    toast.add({
      title: 'Leader customer set',
      description: `Successfully set ${getCustomerInfo(member).name || `Customer #${member.customer_id}`} as leader customer.`,
      color: 'primary',
    })

    // Refresh groups list to update leader_customer_name
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to set leader customer',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    settingLeader.value = false
  }
}

// Assign Group to Sale
const isAssignGroupToSaleModalOpen = ref(false)
const groupToAssign = ref<CustomerGroupWithDetails | null>(null)
const selectedSalesUserForGroup = ref<number | null>(null)
const assigningGroupToSale = ref(false)

// Fetch sales users for assignment
const {
  data: salesUsersForAssign,
  pending: salesUsersForAssignPending,
} = useAsyncData('sales-users-for-group-assign', () => fetchSalesUsers(), {
  default: () => [],
  lazy: true,
  server: false,
})

const salesUserOptionsForAssign = computed(() => {
  return (salesUsersForAssign.value || []).map((user: SalesUser) => ({
    label: `${user.full_name} (${user.staff_code})`,
    value: user.id ?? user.sales_user_id ?? null,
  })).filter((item) => item.value !== null)
})

// Owner filter options
const ownerFilterOptions = computed(() => {
  const base = [{ label: 'All owners', value: null as number | null }]
  const items = (salesUsersForAssign.value || []).map((user: SalesUser) => ({
    label: `${user.full_name} (${user.staff_code})`,
    value: user.id ?? user.sales_user_id ?? null,
  })).filter((item) => item.value !== null)
  return [...base, ...items]
})

// Filtered groups
const filteredGroups = computed(() => {
  if (!groups.value) return []
  
  let result = groups.value

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter((group) => {
      return (
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query)) ||
        (group.owner_name && group.owner_name.toLowerCase().includes(query))
      )
    })
  }

  // Apply owner filter
  if (filters.ownerId !== null) {
    result = result.filter((group) => group.owner_id === filters.ownerId)
  }

  return result
})

// Check if filters are active
const hasActiveFilters = computed(() => {
  return !!(searchQuery.value.trim() || filters.ownerId !== null)
})

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  filters.ownerId = null
}

const openAssignGroupToSaleModal = (group: CustomerGroupWithDetails) => {
  groupToAssign.value = group
  selectedSalesUserForGroup.value = group.owner_id ?? null
  isAssignGroupToSaleModalOpen.value = true
}

const handleAssignGroupToSale = async () => {
  if (!groupToAssign.value?.id) return

  try {
    assigningGroupToSale.value = true
    await updateCustomerGroup(groupToAssign.value.id, {
      owner_id: selectedSalesUserForGroup.value,
    })

    toast.add({
      title: 'Group assigned',
      description: selectedSalesUserForGroup.value
        ? 'Group has been assigned to sales user successfully.'
        : 'Group owner has been removed.',
      color: 'primary',
    })

    isAssignGroupToSaleModalOpen.value = false
    groupToAssign.value = null
    selectedSalesUserForGroup.value = null
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to assign group',
      description: error?.message || 'Unknown error',
      color: 'error',
    })
  } finally {
    assigningGroupToSale.value = false
  }
}

// Fetch sales with customers for care interactions
const {
  data: salesWithCustomers,
} = useAsyncData('sales-with-customers-for-groups', () => fetchSalesWithCustomers(), {
  default: () => [],
  lazy: true,
  server: false,
})

// Get current user's sales_user_id if role is "sales"
const currentUserSalesUserId = computed(() => {
  const currentUser = auth.user.value
  if (!currentUser || currentUser.role !== 'sales') return null
  
  // Find sales user that matches current user's id
  const salesUser = (salesUsersForAssign.value || []).find(
    (u: any) => u.user_id === currentUser.id
  )
  
  if (!salesUser) return null
  
  // Return sales_user_id (not user_id)
  return salesUser.sales_user_id ?? salesUser.id ?? null
})

// Get customer IDs assigned to current sales user
const currentSalesUserCustomerIds = computed(() => {
  if (!currentUserSalesUserId.value || !salesWithCustomers.value) return new Set<number>()
  
  const salesUser = salesWithCustomers.value.find(
    (s: SalesUserWithCustomers) => s.sales_user_id === currentUserSalesUserId.value
  )
  
  if (!salesUser) return new Set<number>()
  
  // Collect all customer IDs from assignments
  const customerIds = new Set<number>()
  for (const assignment of salesUser.customers) {
    const customerId = typeof assignment.customer_id === 'number' 
      ? assignment.customer_id 
      : Number(assignment.customer_id)
    if (Number.isFinite(customerId)) {
      customerIds.add(customerId)
    }
  }
  
  return customerIds
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

// Interface for CareEntry (similar to customer-care)
interface CareEntry {
  customer: Customer
  assignment: CustomerAssignment
  salesUser: SalesUserWithCustomers
  customerNumericId: number
}

// Helper to build CareEntry from member
const buildCareEntryFromMember = (member: CustomerGroupMember, group: CustomerGroupWithDetails): CareEntry | null => {
  const customer = customersMap.value.get(member.customer_id)
  if (!customer) return null
  
  const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
  if (!Number.isFinite(numericId)) return null
  
  const salesInfo = customerToSalesUserMap.value.get(numericId)
  if (!salesInfo) {
    // If no assignment, use group owner as fallback
    if (!group.owner_id) return null
    
    // Create a minimal assignment and sales user structure
    const salesUser = salesUsersForAssign.value?.find((u: any) => (u.id ?? u.sales_user_id) === group.owner_id)
    if (!salesUser) return null
    
    return {
      customer,
      assignment: {
        customer_id: member.customer_id,
        assigned_at: new Date().toISOString(),
        note: null,
      } as CustomerAssignment,
      salesUser: {
        ...salesUser,
        customers: [],
        total_customers: 0,
      } as SalesUserWithCustomers,
      customerNumericId: numericId,
    }
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
    iconColor: 'text-gray-600 dark:text-gray-300',
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

const openCareModalForMember = async (member: CustomerGroupMember, group: CustomerGroupWithDetails) => {
  const entry = buildCareEntryFromMember(member, group)
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

const openHistoryModalForMember = async (member: CustomerGroupMember, group: CustomerGroupWithDetails) => {
  const entry = buildCareEntryFromMember(member, group)
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

// Group Care History Modal
const isGroupCareHistoryModalOpen = ref(false)
const selectedGroupForHistory = ref<CustomerGroupWithDetails | null>(null)

const groupHistoryCustomerIds = computed(() => {
  if (!selectedGroupForHistory.value?.id) return []
  const members = groupMembersMap.value.get(selectedGroupForHistory.value.id)
  if (!members) return []
  return members.map(m => m.customer_id)
})

const openGroupCareHistoryModal = async (group: CustomerGroupWithDetails) => {
  selectedGroupForHistory.value = group
  // Ensure members are loaded for this group
  if (group.id && !groupMembersMap.value.has(group.id)) {
    await loadGroupMembers(group.id)
  }
  isGroupCareHistoryModalOpen.value = true
}

// Group Analytics Modal
const { generateGroupAnalyticsUrl } = useEmbedUrl()
const isGroupAnalyticsModalOpen = ref(false)
const selectedGroupForAnalytics = ref<CustomerGroupWithDetails | null>(null)
const groupAnalyticsEmbedUrl = ref<string | null>(null)
const groupAnalyticsLoading = ref(false)
const groupAnalyticsError = ref<string | null>(null)

const openGroupAnalyticsModal = async (group: CustomerGroupWithDetails) => {
  selectedGroupForAnalytics.value = group
  groupAnalyticsEmbedUrl.value = null
  groupAnalyticsError.value = null
  groupAnalyticsLoading.value = true
  isGroupAnalyticsModalOpen.value = true

  try {
    // Ensure members are loaded for this group
    if (group.id && !groupMembersMap.value.has(group.id)) {
      await loadGroupMembers(group.id)
    }

    // Get member IDs
    const members = groupMembersMap.value.get(group.id!)
    if (!members || members.length === 0) {
      groupAnalyticsError.value = 'No members in this group to display analytics.'
      return
    }

    const memberIds = members.map(m => m.customer_id)
    const url = await generateGroupAnalyticsUrl(memberIds)

    if (url) {
      groupAnalyticsEmbedUrl.value = url
    } else {
      groupAnalyticsError.value = 'Unable to generate analytics dashboard URL.'
    }
  } catch (error: any) {
    console.error('[openGroupAnalyticsModal] Error:', error)
    groupAnalyticsError.value = error?.message || 'Failed to load analytics dashboard.'
  } finally {
    groupAnalyticsLoading.value = false
  }
}

const closeGroupAnalyticsModal = () => {
  isGroupAnalyticsModalOpen.value = false
  selectedGroupForAnalytics.value = null
  groupAnalyticsEmbedUrl.value = null
  groupAnalyticsError.value = null
  groupAnalyticsLoading.value = false
}

// Customer Detail Modal
const isCustomerInfoOpen = ref(false)
const customerInfoCustomer = ref<Customer | null>(null)
const customerInfoDetail = ref<ReturnType<typeof buildCustomerDetailForMember> | null>(null)

watch(isCustomerInfoOpen, (open) => {
  if (!open) {
    customerInfoCustomer.value = null
    customerInfoDetail.value = null
  }
})

const closeCustomerInfoModal = () => {
  isCustomerInfoOpen.value = false
}

// Helper function to build customer detail from member
const buildCustomerDetailForMember = (member: CustomerGroupMember) => {
  const customer = customersMap.value.get(member.customer_id)
  if (!customer) {
    return {
      code: String(member.customer_id),
      id: null,
      numericId: member.customer_id,
      fullName: `Customer #${member.customer_id}`,
      email: null,
      assignmentDate: null,
      assignmentNote: null,
      plannedAction: 'pending' as const,
      actionLabel: 'Select sales user',
      actionColor: 'neutral' as const,
      currentSalesUser: null,
    }
  }

  const numericId = typeof customer.id === 'number' ? customer.id : Number(customer.id)
  const salesInfo = customerToSalesUserMap.value.get(numericId || member.customer_id)
  
  const currentSalesUser = salesInfo?.salesUser || null
  const assignment = salesInfo?.assignment || null

  const assignmentDate = assignment?.assigned_at ? formatDate(assignment.assigned_at) : null
  const assignmentNote = assignment?.note || null

  const currentSalesUserInfo = currentSalesUser
    ? {
        sales_user_id: currentSalesUser.sales_user_id,
        full_name: currentSalesUser.full_name,
        staff_code: currentSalesUser.staff_code,
        avatar: currentSalesUser.avatar,
        department: currentSalesUser.department,
      }
    : null

  return {
    code: customer.customer_id,
    id: customer.id ?? null,
    numericId: numericId || member.customer_id,
    fullName: customer.full_name,
    email: customer.email ?? null,
    assignmentDate: assignmentDate && assignmentDate !== '—' ? assignmentDate : null,
    assignmentNote: assignmentNote && assignmentNote.length ? assignmentNote : null,
    plannedAction: 'pending' as const,
    actionLabel: 'Select sales user',
    actionColor: 'neutral' as const,
    currentSalesUser: currentSalesUserInfo,
  }
}

const openCustomerInfoModalForMember = (member: CustomerGroupMember) => {
  const customer = customersMap.value.get(member.customer_id)
  if (!customer) {
    toast.add({
      title: 'Customer not found',
      description: 'Could not find customer information.',
      color: 'warning',
    })
    return
  }
  customerInfoCustomer.value = customer
  customerInfoDetail.value = buildCustomerDetailForMember(member)
  isCustomerInfoOpen.value = true
}

// Format date
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
.filters-container {
  min-height: 4.5rem;
}

.filter-control {
  width: 100%;
}

.filter-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

@media (min-width: 768px) {
  .filter-control {
    width: 16rem;
  }

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
