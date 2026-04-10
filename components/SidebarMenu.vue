<template>
  <aside 
    class="flex h-full flex-col border-r-2 shadow-lg transition-all duration-300 relative z-50"
    :class="[
      isCollapsed ? 'w-20 px-3 py-6 items-center' : 'w-72 p-6',
      isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
    ]"
  >
    <!-- Collapse Toggle Button -->
    <button
      @click="isCollapsed = !isCollapsed"
      class="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors z-[100] focus:outline-none"
      :class="isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700'"
      :title="isCollapsed ? 'Expand menu' : 'Collapse menu'"
    >
      <UIcon
        :name="isCollapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'"
        class="h-4 w-4"
      />
    </button>
    <!-- Title Section -->
    <div class="mb-10 w-full" :class="isCollapsed ? 'flex justify-center' : ''">
      <h1 
        v-if="!isCollapsed" 
        :class="['text-lg font-bold text-center transition-colors truncate', isDark ? 'text-gray-100' : 'text-gray-900']"
      >
        Customer Relationship Management
      </h1>
      <h1 
        v-else 
        :class="['text-lg font-bold text-center transition-colors', isDark ? 'text-gray-100' : 'text-gray-900']"
        title="Customer Relationship Management"
      >
        CRM
      </h1>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex flex-1 flex-col gap-2 w-full">
      <div v-for="link in links" :key="link.to" class="flex flex-col gap-1 w-full">
        <div class="flex items-center gap-2 relative w-full group">
          <NuxtLink
            :to="link.to"
            class="flex items-center rounded-lg transition-colors duration-200 w-full"
            :class="[
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
              isActive(link.to) 
                ? (isDark ? 'bg-green-900/30 text-green-400 font-medium' : 'bg-green-50 text-green-600 font-medium') 
                : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')
            ]"
            :title="isCollapsed ? link.label : ''"
          >
            <span
              aria-hidden="true"
              class="slds-icon-glyph text-[24px] flex-shrink-0"
              :class="link.iconClass"
            ></span>
            <span v-if="!isCollapsed" class="truncate">{{ link.label }}</span>
          </NuxtLink>

          <button
            v-if="!isCollapsed && link.children?.length"
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-600"
            :aria-expanded="isSectionOpen(link)"
            :aria-controls="`submenu-${link.to}`"
            @click.stop="toggleSection(link)"
          >
            <UIcon
              name="i-heroicons-chevron-down"
              class="h-4 w-4 transition-transform"
              :class="isSectionOpen(link) ? 'rotate-180 text-green-600' : ''"
            />
          </button>
        </div>

        <div
          v-if="!isCollapsed && link.children?.length && isSectionOpen(link)"
          :id="`submenu-${link.to}`"
          class="child-link-group flex flex-col gap-1"
        >
          <NuxtLink
            v-for="child in link.children"
            :key="child.to"
            :to="child.to"
            class="child-link relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200"
            :class="isChildActive(child.to)
              ? (isDark ? 'bg-green-900/30 text-green-400 font-medium' : 'bg-green-50 text-green-600 font-medium')
              : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')"
          >
            <span
              v-if="child.iconClass"
              aria-hidden="true"
              class="slds-icon-glyph text-[18px]"
              :class="child.iconClass"
            ></span>
            <span v-else class="h-1.5 w-1.5 rounded-full bg-current"></span>
            <span>{{ child.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    

  </aside>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const route = useRoute()
const auth = useAuth()
const { isDark } = useTheme()

// Collapsed state
const isCollapsed = useState('sidebar-collapsed', () => false)

interface SidebarChildLink {
  label: string
  to: string
  iconClass?: string
  rolesAllowed?: string[]
}

interface SidebarLink {
  label: string
  iconClass: string
  to: string
  rolesAllowed?: string[]
  children?: SidebarChildLink[]
}

const expandedSections = ref<Record<string, boolean>>({})

const menuItems: SidebarLink[] = [
  { 
    label: 'Dashboard', 
    iconClass: 'slds-icons-dashboard text-emerald-500', 
    to: '/',
    rolesAllowed: ['admin', 'sales', 'customer_support', 'marketing']
  },
  { 
    label: 'Customers', 
    iconClass: 'slds-icons-customers text-sky-500', 
    to: '/customers',
    rolesAllowed: ['admin', 'sales', 'marketing']
  },
  { 
    label: 'Groups', 
    iconClass: 'slds-icons-groups text-indigo-500', 
    to: '/groups',
    rolesAllowed: ['admin', 'sales', 'marketing']
  },
  {
    label: 'Leads',
    iconClass: 'slds-icons-lead text-purple-500',
    to: '/leads',
    rolesAllowed: ['admin', 'sales', 'marketing'],
    children: [
      { 
        label: 'History', 
        to: '/leads/history', 
        iconClass: 'slds-icons-time_period text-purple-400',
        rolesAllowed: ['admin', 'sales', 'marketing']
      },
    ],
  },
  {
    label: 'Customer Care',
    iconClass: 'slds-icons-questions_and_answers text-rose-500',
    to: '/customer-care',
    rolesAllowed: ['admin', 'sales', 'marketing', 'customer_support'],
    children: [
      { 
        label: 'Monitoring', 
        to: '/customer-care/monitoring', 
        iconClass: 'slds-icons-indicator_performance_period text-rose-400',
        rolesAllowed: ['admin', 'sales', 'marketing', 'customer_support']
      },
      { 
        label: 'History', 
        to: '/customer-care/history', 
        iconClass: 'slds-icons-time_period text-rose-400',
        rolesAllowed: ['admin', 'sales', 'marketing', 'customer_support']
      },
    ],
  },
  { 
    label: 'Tasks', 
    iconClass: 'slds-icons-task text-teal-500', 
    to: '/tasks',
    rolesAllowed: ['admin', 'sales', 'sales_manager']
  },
  { 
    label: 'Sales Requests', 
    iconClass: 'slds-icons-approval text-orange-500', 
    to: '/sales-requests',
    rolesAllowed: ['admin', 'sales', 'sales_manager']
  },
  { 
    label: 'Sales Users', 
    iconClass: 'slds-icons-team_member text-amber-500', 
    to: '/sales-users',
    rolesAllowed: ['admin', 'sales_manager']
  },
  { 
    label: 'Settings', 
    iconClass: 'slds-icons-settings text-slate-500', 
    to: '/settings',
    rolesAllowed: ['admin']
  },
]

// Filter menu items based on user role
const links = computed(() => {
  const userRole = auth.user.value?.role?.toLowerCase()
  if (!userRole) return []

  return menuItems
    .filter((item) => {
      // If no rolesAllowed specified, allow all (backward compatibility)
      if (!item.rolesAllowed || item.rolesAllowed.length === 0) return true
      return item.rolesAllowed.map(r => r.toLowerCase()).includes(userRole)
    })
    .map((item) => {
      // Filter children based on role as well
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter((child) => {
          if (!child.rolesAllowed || child.rolesAllowed.length === 0) return true
          return child.rolesAllowed.map(r => r.toLowerCase()).includes(userRole)
        })
        return { ...item, children: filteredChildren }
      }
      return item
    })
    .filter((item) => {
      // Remove parent items if they have no visible children
      if (item.children && item.children.length === 0) return false
      return true
    })
})

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const isChildActive = (path: string) => route.path.startsWith(path)

const isSectionOpen = (link: SidebarLink) => {
  if (!link.children?.length) return false
  return expandedSections.value[link.to] ?? false
}

const toggleSection = (link: SidebarLink) => {
  if (isCollapsed.value) {
    // If clicking to expand while collapsed, automatically open the sidebar
    isCollapsed.value = false;
  }
  
  if (!link.children?.length) return
  expandedSections.value = {
    ...expandedSections.value,
    [link.to]: !isSectionOpen(link),
  }
}

// Watch collapsed state to ensure submenus are handled reasonably
watch(isCollapsed, (collapsed) => {
  if (collapsed) {
    // Optionally close all submenus when collapsing, or keep them for restore
    // expandedSections.value = {}
  }
})

watch(
  () => route.path,
  (path) => {
    for (const link of links.value) {
      if (!link.children?.length) continue
      if (path.startsWith(link.to)) {
        expandedSections.value = {
          ...expandedSections.value,
          [link.to]: true,
        }
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.child-link-group {
  position: relative;
  padding-left: 2.5rem;
  margin-left: 0.25rem;
}

.child-link-group::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 0.6rem;
  bottom: 0.6rem;
  width: 2px;
  background: linear-gradient(180deg, #a7f3d0 0%, #34d399 100%);
  border-radius: 9999px;
  opacity: 0.65;
}

.child-link::before {
  content: '';
  position: absolute;
  left: -1.2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.1rem;
  height: 2px;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgba(167, 243, 208, 0.6) 0%, rgba(16, 185, 129, 0.9) 100%);
  opacity: 0.7;
}

.child-link:hover::before,
.child-link.bg-green-50::before {
  background: linear-gradient(90deg, rgba(110, 231, 183, 0.7) 0%, rgba(5, 150, 105, 0.95) 100%);
  opacity: 0.95;
}
</style>

