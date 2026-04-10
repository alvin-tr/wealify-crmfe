<template>
  <div :class="['dashboard-page', isDark ? 'dark-dashboard' : 'light-dashboard']">
    <!-- Dashboard Tab Navigation -->
    <div class="dash-tabs-bar">
      <template v-if="dashboardMode === 'custom'">
        <button v-for="tab in dashTabs" :key="tab.key"
          :class="['dash-tab', { active: activeView === tab.key }]"
          @click="activeView = tab.key">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.badge" class="tab-badge" :class="tab.badgeClass">{{ tab.badge }}</span>
        </button>
      </template>
      <template v-else>
        <div class="dash-tab active">
          <span class="tab-icon">📈</span>
          <span class="tab-label">Classic Dashboard (Metabase)</span>
        </div>
      </template>

      <!-- Right side controls -->
      <div class="ml-auto flex items-center gap-3 px-4 whitespace-nowrap">
        <!-- Dashboard Mode Toggle -->
        <button
          class="dash-mode-toggle"
          @click="toggleDashboardMode"
          :title="dashboardMode === 'custom' ? 'Chuyển sang Dashboard cũ (Metabase)' : 'Chuyển sang Dashboard mới'"
        >
          <span class="toggle-icon">{{ dashboardMode === 'custom' ? '📈' : '📊' }}</span>
          <span class="toggle-label">{{ dashboardMode === 'custom' ? 'Classic' : 'Custom' }}</span>
        </button>

        <!-- Admin Dashboard Switcher -->
        <template v-if="isAdminRole && dashboardMode === 'custom'">
          <span class="text-xs font-semibold text-gray-400">Xem Dashboard của:</span>
          <select
            v-model="adminTargetUserId"
            class="bg-[#111527] border border-[rgba(148,163,184,0.1)] text-gray-300 text-xs rounded-md px-2 py-1 outline-none transition-colors hover:border-[rgba(124,58,237,0.4)] focus:border-[#7c3aed]"
          >
            <option v-for="opt in userOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </div>
    </div>

    <!-- Loading spinner -->
    <div v-if="!isReady" class="loading-center">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu dashboard...</p>
    </div>

    <!-- Custom Dashboard View -->
    <div v-else-if="dashboardMode === 'custom'" class="view-container crm-dashboard-theme">
      <ClientOnly>
        <KeepAlive>
          <component :is="currentComponent" :key="activeView" />
        </KeepAlive>
      </ClientOnly>
    </div>

    <!-- Classic Metabase Dashboard View -->
    <div v-else class="metabase-container">
      <div v-if="classicLoading" class="loading-center">
        <div class="spinner"></div>
        <p>Đang tải Metabase dashboard...</p>
      </div>
      <iframe
        v-if="classicIframeUrl"
        :src="classicIframeUrl"
        frameborder="0"
        width="100%"
        height="100%"
        allowtransparency
        class="metabase-iframe"
        @load="classicLoading = false"
      ></iframe>
      <div v-else-if="!classicLoading" class="no-metabase">
        <div class="no-metabase-content">
          <span style="font-size:2rem;display:block;margin-bottom:8px">📊</span>
          <p v-if="!isSalesRole" style="margin-bottom:8px"><strong>Classic Dashboard chỉ có cho Sales users.</strong></p>
          <p v-if="!isSalesRole">Admin sử dụng <strong>Custom Dashboard</strong> với đầy đủ tính năng hơn.</p>
          <p v-else>⚠️ Không thể tải Metabase dashboard. Thử lại sau hoặc chuyển về Custom Dashboard.</p>
          <button class="dash-mode-toggle" style="margin-top:12px" @click="dashboardMode = 'custom'">
            <span class="toggle-icon">📊</span>
            <span class="toggle-label">Chuyển về Custom</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import type { SalesUser } from '~/composables/useSalesUsers'

const { isDark } = useTheme()

// Lazy-load dashboard components
const ExecutiveDashboard = defineAsyncComponent(() => import('~/components/dashboard/ExecutiveDashboard.vue'))
const PipelineDashboard = defineAsyncComponent(() => import('~/components/dashboard/PipelineDashboard.vue'))
const LeadsDashboard = defineAsyncComponent(() => import('~/components/dashboard/LeadsDashboard.vue'))
const CustomersDashboard = defineAsyncComponent(() => import('~/components/dashboard/CustomersDashboard.vue'))
const CareDashboard = defineAsyncComponent(() => import('~/components/dashboard/CareDashboard.vue'))
const MarketDashboard = defineAsyncComponent(() => import('~/components/dashboard/MarketDashboard.vue'))
const AgentsDashboard = defineAsyncComponent(() => import('~/components/dashboard/AgentsDashboard.vue'))
const CeoDashboard = defineAsyncComponent(() => import('~/components/dashboard/CeoDashboard.vue'))
const ExportDashboard = defineAsyncComponent(() => import('~/components/dashboard/ExportDashboard.vue'))
const SettingsDashboard = defineAsyncComponent(() => import('~/components/dashboard/SettingsDashboard.vue'))

const auth = useAuth()

import { useState } from '#app'

// --- Role checks ---
const isAdminRole = computed(() => auth.user.value?.role === 'admin')
const isSalesRole = computed(() => auth.user.value?.role === 'sales' || auth.user.value?.department === 'sales')

// --- Admin Target State ---
const adminTargetUserId = useCookie<string | null>('adminTargetUserId', {
  default: () => null,
  watch: true,
  maxAge: 60 * 60 * 24 * 7 // 1 week
})
const userOptions = ref<{ value: string | null; label: string }[]>([
  { value: null, label: 'Của Tôi (Admin)' }
])

// --- View state ---
const activeView = ref('executive')
const isReady = ref(false)

const componentMap: Record<string, any> = {
  executive: ExecutiveDashboard,
  pipeline: PipelineDashboard,
  leads: LeadsDashboard,
  customers: CustomersDashboard,
  care: CareDashboard,
  market: MarketDashboard,
  agents: AgentsDashboard,
  ceo: CeoDashboard,
  export: ExportDashboard,
  settings: SettingsDashboard,
}

const currentComponent = computed(() => componentMap[activeView.value] || ExecutiveDashboard)

// --- Tab items ---
const dashTabs: Array<{ key: string; label: string; icon: string; badge?: string; badgeClass?: string }> = [
  { key: 'executive', label: 'Executive', icon: '📊' },
  { key: 'pipeline', label: 'Pipeline', icon: '🔀' },
  { key: 'leads', label: 'Leads', icon: '🎯' },
  { key: 'customers', label: 'Khách hàng', icon: '👥' },
  { key: 'care', label: 'Care', icon: '🎧' },
  { key: 'market', label: 'Thị trường', icon: '🌍' },
  { key: 'agents', label: 'NV Sale', icon: '👤' },
  { key: 'ceo', label: 'CEO', icon: '💹' },
  { key: 'export', label: 'Export', icon: '📁' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
]

// --- Sales iframe ---
const { generateSalesAnalyticsUrl, generateCustomerAnalyticsUrl, generateAdminOverviewUrl } = useEmbedUrl()
const iframeUrl = ref('')
const iframeKey = ref(0)
const iframeLoading = ref(true)

// --- Dashboard Mode (Custom vs Classic/Metabase) ---
const dashboardMode = useCookie<'custom' | 'classic'>('dashboardMode', {
  default: () => 'custom',
  watch: true,
  maxAge: 60 * 60 * 24 * 365 // 1 year
})

const classicIframeUrl = ref('')
const classicLoading = ref(false)

const toggleDashboardMode = async () => {
  if (dashboardMode.value === 'custom') {
    dashboardMode.value = 'classic'
    await loadClassicDashboard()
  } else {
    dashboardMode.value = 'custom'
  }
}

const loadClassicDashboard = async () => {
  classicLoading.value = true
  try {
    if (isSalesRole.value) {
      // Sales users: show their personal Metabase dashboard (dashboard 72)
      const { fetchSalesUsers } = useSalesUsers()
      const salesUsers = await fetchSalesUsers()
      const currentUser = auth.user.value
      if (currentUser) {
        const salesUser = salesUsers.find((u: SalesUser) => u.user_id === currentUser.id)
        const saleUserId = salesUser?.sales_user_id ?? salesUser?.id
        if (saleUserId) {
          classicIframeUrl.value = await generateSalesAnalyticsUrl(saleUserId) || ''
        }
      }
    } else {
      // Admin doesn't have a Metabase dashboard — show message
      classicIframeUrl.value = ''
      classicLoading.value = false
    }
  } catch (e) {
    console.error('Failed to load classic dashboard:', e)
    classicIframeUrl.value = ''
  } finally {
    if (!classicIframeUrl.value) classicLoading.value = false
  }
}

const generateAnalyticsUrl = async () => {
  if (!isSalesRole.value) return
  iframeLoading.value = true
  try {
    const { fetchSalesUsers } = useSalesUsers()
    const salesUsers = await fetchSalesUsers()
    const currentUser = auth.user.value
    if (!currentUser) { iframeUrl.value = ''; return }
    const salesUser = salesUsers.find((u: SalesUser) => u.user_id === currentUser.id)
    if (!salesUser) { iframeUrl.value = ''; return }
    const saleUserId = salesUser.sales_user_id ?? salesUser.id
    if (!saleUserId) { iframeUrl.value = ''; return }
    const url = await generateSalesAnalyticsUrl(saleUserId)
    iframeUrl.value = url || ''
  } catch { iframeUrl.value = '' }
  finally { iframeLoading.value = false }
}

// --- Init ---
onMounted(async () => {
  if (isSalesRole.value) {
    await generateAnalyticsUrl()
  }

  if (isAdminRole.value) {
    try {
      const { fetchUsers } = useUsers()
      const users = await fetchUsers()
      const mapped = users.map((u: any) => ({
        value: String(u.id),
        label: `${u.full_name || u.email} (${u.role})`
      }))
      userOptions.value = [
        { value: null, label: 'Của Tôi (Admin)' },
        ...mapped
      ]
    } catch(e) { console.error('Failed to load users for dashboard filter:', e) }
  }

  // Auto-load classic dashboard if user was previously in classic mode
  if (dashboardMode.value === 'classic') {
    await loadClassicDashboard()
  }

  isReady.value = true
})
</script>

<style>
/* ══════════════════════════════════════════════════════
   DASHBOARD PAGE — fits inside the CRM's default layout
   NOT position:fixed — renders normally in the <main> slot
   ══════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap');

.dashboard-page {
  --bg: #07080f;
  --bg2: #0d0f1c;
  --bg3: #111527;
  --bg4: #161929;
  --purple: #7c3aed;
  --purple-light: #a78bfa;
  --purple-glow: rgba(124, 58, 237, 0.3);
  --blue: #2563eb;
  --blue-light: #60a5fa;
  --cyan: #06b6d4;
  --teal: #14b8a6;
  --gold: #f59e0b;
  --green: #22c55e;
  --red: #ef4444;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --border: rgba(148, 163, 184, 0.1);
  --border2: rgba(148, 163, 184, 0.06);
  --card: rgba(255, 255, 255, 0.035);
  --card2: rgba(255, 255, 255, 0.06);
  --r: 12px;
  --r2: 18px;

  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', 'Salesforce Sans', 'Manrope', sans-serif;
  min-height: calc(100vh - 80px);
  margin: -24px; /* counteract the p-6 padding from the layout */
  padding: 0;
}

/* ── TAB BAR ── */
.dash-tabs-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
  overflow-x: auto;
  flex-shrink: 0;
}

.dash-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: .78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}

.dash-tab:hover { background: rgba(255,255,255,.04); color: var(--text); }

.dash-tab.active {
  background: linear-gradient(135deg, rgba(124,58,237,.15), rgba(37,99,235,.1));
  color: var(--purple-light);
  font-weight: 600;
  border: 1px solid rgba(124,58,237,.25);
}

.tab-icon { font-size: .9rem; }

.tab-badge {
  font-size: .6rem; font-weight: 700;
  padding: 1px 6px; border-radius: 8px;
  background: rgba(124,58,237,.15); color: var(--purple-light);
}
.tab-badge.badge-purple { background: rgba(124,58,237,.15); color: var(--purple-light); }
.tab-badge.badge-red { background: rgba(239,68,68,.15); color: #f87171; }
.tab-badge.badge-blue { background: rgba(37,99,235,.15); color: var(--blue-light); }

/* ── VIEW CONTAINER ── */
.view-container { padding: 20px; }

.loading-center {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 400px; gap: 12px;
}
.loading-center p { font-size: .85rem; color: var(--text-dim); }

.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top: 3px solid var(--purple); border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.sales-iframe { width: 100%; height: 800px; border: 0; border-radius: var(--r2); }
.iframe-wrapper { border-radius: var(--r2); overflow: hidden; }

/* ══════════════════════════════════════════════════════
   CRM DASHBOARD THEME — SHARED COMPONENT STYLES
   All child components inherit these through .crm-dashboard-theme
   ══════════════════════════════════════════════════════ */

.crm-dashboard-theme {
  color: var(--text);
}

/* KPI Cards */
.crm-dashboard-theme .kpi-row,
.crm-dashboard-theme .kpi-row-3 {
  display: grid;
  gap: 14px;
}
.crm-dashboard-theme .kpi-row { grid-template-columns: repeat(5, 1fr); }
.crm-dashboard-theme .kpi-row-3 { grid-template-columns: repeat(3, 1fr); }

.crm-dashboard-theme .kpi {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  transition: transform .2s, border-color .2s;
}
.crm-dashboard-theme .kpi:hover { transform: translateY(-2px); border-color: rgba(124,58,237,.3); }
.crm-dashboard-theme .kpi::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at top left, rgba(124,58,237,.06), transparent 60%);
  pointer-events: none;
}

.crm-dashboard-theme .kpi-label {
  font-size: .68rem; font-weight: 600; letter-spacing: .07em;
  text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px;
}
.crm-dashboard-theme .kpi-value {
  font-size: 1.55rem; font-weight: 800; color: var(--text); line-height: 1; margin-bottom: 6px;
}
.crm-dashboard-theme .kpi-mom { display: flex; align-items: center; gap: 4px; font-size: .7rem; font-weight: 600; }
.crm-dashboard-theme .kpi-mom.up { color: var(--green); }
.crm-dashboard-theme .kpi-mom.down { color: var(--red); }
.crm-dashboard-theme .kpi-mom.neutral { color: var(--text-dim); }
.crm-dashboard-theme .kpi-spark {
  position: absolute; bottom: 10px; right: 12px; opacity: .4; font-size: 1.4rem;
}

/* Charts */
.crm-dashboard-theme .charts-grid {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-top: 16px;
}

.crm-dashboard-theme .chart-card {
  background: var(--card); border: 1px solid var(--border); border-radius: var(--r2);
  padding: 20px; display: flex; flex-direction: column; gap: 14px; transition: border-color .2s;
}
.crm-dashboard-theme .chart-card:hover { border-color: rgba(124,58,237,.25); }
.crm-dashboard-theme .chart-card.full { grid-column: 1 / -1; }

.crm-dashboard-theme .chart-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
}
.crm-dashboard-theme .chart-title { font-size: .92rem; font-weight: 700; color: var(--text); }
.crm-dashboard-theme .chart-sub { font-size: .7rem; color: var(--text-dim); margin-top: 2px; }

.crm-dashboard-theme .chart-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.crm-dashboard-theme .legend-item { display: flex; align-items: center; gap: 5px; font-size: .68rem; color: var(--text-muted); }
.crm-dashboard-theme .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.crm-dashboard-theme .chart-wrap { position: relative; flex: 1; min-height: 0; }

/* Section headers */
.crm-dashboard-theme .section-header {
  display: flex; align-items: center; justify-content: space-between;
}

/* Tables */
.crm-dashboard-theme .table-card,
.crm-dashboard-theme .data-table-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--r2); padding: 20px; margin-top: 16px;
}

.crm-dashboard-theme .table-toolbar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;
}

.crm-dashboard-theme .search-input {
  flex: 1; min-width: 150px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 10px; padding: 8px 14px; color: var(--text-muted); font-size: .78rem;
  font-family: inherit; outline: none; transition: border-color .2s;
}
.crm-dashboard-theme .search-input:focus { border-color: var(--purple); }
.crm-dashboard-theme .search-input::placeholder { color: var(--text-dim); }

.crm-dashboard-theme .filter-btn {
  background: transparent; border: 1px solid var(--border); border-radius: 8px;
  padding: 5px 12px; color: var(--text-dim); font-size: .72rem; font-weight: 600;
  cursor: pointer; transition: all .15s; font-family: inherit;
}
.crm-dashboard-theme .filter-btn:hover { border-color: var(--purple); color: var(--text-muted); }
.crm-dashboard-theme .filter-btn.active {
  background: var(--purple); border-color: var(--purple); color: white;
}

.crm-dashboard-theme .export-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.25);
  border-radius: 8px; padding: 6px 14px; color: var(--green);
  font-size: .72rem; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit;
}
.crm-dashboard-theme .export-btn:hover { background: rgba(34,197,94,.15); }

.crm-dashboard-theme .crm-table {
  width: 100%; border-collapse: collapse;
}
.crm-dashboard-theme .crm-table th {
  text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border);
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-dim);
}
.crm-dashboard-theme .crm-table td {
  padding: 10px 12px; border-bottom: 1px solid var(--border2);
  font-size: .8rem; color: var(--text-muted);
}
.crm-dashboard-theme .crm-table tr:hover { background: rgba(255,255,255,.02); }

/* Agents table */
.crm-dashboard-theme .agents-big-table {
  width: 100%; border-collapse: collapse;
}
.crm-dashboard-theme .agents-big-table th {
  text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border);
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-dim);
}
.crm-dashboard-theme .agents-big-table td {
  padding: 10px 12px; border-bottom: 1px solid var(--border2);
  font-size: .8rem; color: var(--text-muted);
}
.crm-dashboard-theme .agents-big-table tr:hover { background: rgba(255,255,255,.02); }

/* Top Customers table */
.crm-dashboard-theme .top-cust-table {
  width: 100%; border-collapse: collapse;
}
.crm-dashboard-theme .top-cust-table th {
  text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--border);
  font-size: .6rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-dim);
}
.crm-dashboard-theme .top-cust-table td {
  padding: 8px 10px; border-bottom: 1px solid var(--border2);
  font-size: .76rem; color: var(--text-muted);
}
.crm-dashboard-theme .top-cust-table tr:hover { background: rgba(255,255,255,.02); }

/* Cell name with avatar */
.crm-dashboard-theme .cell-name { display: flex; align-items: center; gap: 10px; }
.crm-dashboard-theme .avatar-sm {
  width: 32px; height: 32px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center;
  font-size: .6rem; font-weight: 700; color: white; flex-shrink: 0;
}
.crm-dashboard-theme .cell-name-text { font-size: .82rem; font-weight: 600; color: var(--text); }
.crm-dashboard-theme .cell-name-sub { font-size: .68rem; color: var(--text-dim); }

/* Pagination */
.crm-dashboard-theme .pagination {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border2);
}
.crm-dashboard-theme .page-info { font-size: .72rem; color: var(--text-dim); }
.crm-dashboard-theme .page-btns { display: flex; gap: 4px; }
.crm-dashboard-theme .page-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; border: 1px solid var(--border); background: transparent;
  color: var(--text-dim); font-size: .72rem; cursor: pointer; font-family: inherit;
}
.crm-dashboard-theme .page-btn.active {
  background: var(--purple); border-color: var(--purple); color: white;
}

/* Status badges */
.crm-dashboard-theme .status-badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;
  border-radius: 8px; font-size: .7rem; font-weight: 600;
}
.crm-dashboard-theme .badge-urgent { background: rgba(239,68,68,.12); color: #f87171; }
.crm-dashboard-theme .badge-pending { background: rgba(245,158,11,.12); color: #fbbf24; }
.crm-dashboard-theme .badge-open { background: rgba(37,99,235,.12); color: var(--blue-light); }
.crm-dashboard-theme .badge-resolved { background: rgba(34,197,94,.12); color: #4ade80; }
.crm-dashboard-theme .badge-active { background: rgba(34,197,94,.12); color: #4ade80; }

/* Tier badges */
.crm-dashboard-theme .tier-badge {
  display: inline-flex; align-items: center; gap: 3px; padding: 3px 10px;
  border-radius: 8px; font-size: .7rem; font-weight: 700;
}
.crm-dashboard-theme .tier-diamond { background: rgba(6,182,212,.12); color: #67e8f9; border: 1px solid rgba(6,182,212,.3); }
.crm-dashboard-theme .tier-gold { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.3); }
.crm-dashboard-theme .tier-silver { background: rgba(148,163,184,.1); color: #cbd5e1; border: 1px solid rgba(148,163,184,.2); }
.crm-dashboard-theme .tier-standard { background: rgba(148,163,184,.06); color: var(--text-dim); }

/* Care grid layout */
.crm-dashboard-theme .care-grid {
  display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-top: 16px;
}

/* Cohort table */
.crm-dashboard-theme .cohort-table {
  width: 100%; border-collapse: collapse;
}
.crm-dashboard-theme .cohort-table th,
.crm-dashboard-theme .cohort-table td {
  padding: 6px 10px; text-align: center; font-size: .72rem;
  border-bottom: 1px solid var(--border2);
}
.crm-dashboard-theme .cohort-table th { color: var(--text-dim); font-weight: 700; }

/* Detail sections */
.crm-dashboard-theme .detail-section {
  background: var(--bg3); border: 1px solid var(--border); border-radius: var(--r);
  padding: 12px 16px; display: flex; flex-direction: column; gap: 8px;
}
.crm-dashboard-theme .detail-section-title { font-size: .78rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.crm-dashboard-theme .detail-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border2); }
.crm-dashboard-theme .detail-row:last-child { border-bottom: none; }
.crm-dashboard-theme .detail-row-label { font-size: .76rem; color: var(--text-muted); }
.crm-dashboard-theme .detail-row-value { font-size: .76rem; font-weight: 600; color: var(--text); }

/* Toggle switch */
.crm-dashboard-theme .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
.crm-dashboard-theme .toggle-switch input { opacity: 0; width: 0; height: 0; }
.crm-dashboard-theme .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--bg4); border-radius: 10px; transition: .3s; }
.crm-dashboard-theme .toggle-slider::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: var(--text-dim); border-radius: 50%; transition: .3s; }
.crm-dashboard-theme .toggle-switch input:checked + .toggle-slider { background: var(--purple); }
.crm-dashboard-theme .toggle-switch input:checked + .toggle-slider::before { transform: translateX(16px); background: white; }

/* Agents table styles */
.crm-dashboard-theme .agents-table { width: 100%; border-collapse: collapse; }
.crm-dashboard-theme .agents-table th { font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-dim); padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border); }
.crm-dashboard-theme .agents-table td { padding: 10px 10px; border-bottom: 1px solid var(--border2); vertical-align: middle; font-size: .8rem; }
.crm-dashboard-theme .agents-table tr:last-child td { border-bottom: none; }
.crm-dashboard-theme .agents-table tr:hover td { background: rgba(255,255,255,.02); }

.crm-dashboard-theme .agent-cell { display: flex; align-items: center; gap: 10px; }
.crm-dashboard-theme .agent-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .65rem; font-weight: 700; color: white; flex-shrink: 0; }
.crm-dashboard-theme .agent-name { font-weight: 600; color: var(--text); }

.crm-dashboard-theme .rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; font-size: .7rem; font-weight: 700; }
.crm-dashboard-theme .rank-1 { background: linear-gradient(135deg,#f59e0b,#d97706); color: #000; }
.crm-dashboard-theme .rank-2 { background: linear-gradient(135deg,#94a3b8,#64748b); color: #fff; }
.crm-dashboard-theme .rank-3 { background: linear-gradient(135deg,#b45309,#92400e); color: #fff; }
.crm-dashboard-theme .rank-4 { background: var(--bg3); color: var(--text-dim); }

/* Info button */
.crm-dashboard-theme .info-btn { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; background: rgba(148,163,184,.15); color: var(--text-dim); font-size: .58rem; font-weight: 700; font-style: italic; cursor: help; margin-left: 5px; vertical-align: middle; border: 1px solid rgba(148,163,184,.22); transition: all .2s; position: relative; }
.crm-dashboard-theme .info-btn:hover { background: rgba(124,58,237,.2); color: var(--purple-light); border-color: rgba(124,58,237,.4); transform: scale(1.1); }
/* Custom tooltip popup for info buttons */
.crm-dashboard-theme .info-btn[data-tooltip]:hover::after { content: attr(data-tooltip); position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: rgba(15,23,42,.96); color: #e2e8f0; font-size: .72rem; font-weight: 400; font-style: normal; line-height: 1.45; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(124,58,237,.3); box-shadow: 0 8px 24px rgba(0,0,0,.4); min-width: 260px; max-width: 380px; white-space: normal; z-index: 9999; pointer-events: none; animation: tooltipFadeIn .15s ease; }
.crm-dashboard-theme .info-btn[data-tooltip]:hover::before { content: ''; position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgba(15,23,42,.96); z-index: 9999; pointer-events: none; }
/* Custom tooltip for kpi-label with data-tooltip */
.crm-dashboard-theme .kpi-label[data-tooltip] { position: relative; cursor: help; }
.crm-dashboard-theme .kpi-label[data-tooltip]:hover::after { content: attr(data-tooltip); position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: rgba(15,23,42,.96); color: #e2e8f0; font-size: .72rem; font-weight: 400; line-height: 1.45; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(124,58,237,.3); box-shadow: 0 8px 24px rgba(0,0,0,.4); min-width: 260px; max-width: 380px; white-space: normal; z-index: 9999; pointer-events: none; animation: tooltipFadeIn .15s ease; }
.crm-dashboard-theme .kpi-label[data-tooltip]:hover::before { content: ''; position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgba(15,23,42,.96); z-index: 9999; pointer-events: none; }
/* Custom tooltip for stage-name and chart-title */
.crm-dashboard-theme .stage-name[data-tooltip], .crm-dashboard-theme .chart-title[data-tooltip] { position: relative; cursor: help; }
.crm-dashboard-theme .stage-name[data-tooltip]:hover::after, .crm-dashboard-theme .chart-title[data-tooltip]:hover::after { content: attr(data-tooltip); position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: rgba(15,23,42,.96); color: #e2e8f0; font-size: .72rem; font-weight: 400; line-height: 1.45; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(124,58,237,.3); box-shadow: 0 8px 24px rgba(0,0,0,.4); min-width: 260px; max-width: 380px; white-space: normal; z-index: 9999; pointer-events: none; animation: tooltipFadeIn .15s ease; }
.crm-dashboard-theme .stage-name[data-tooltip]:hover::before, .crm-dashboard-theme .chart-title[data-tooltip]:hover::before { content: ''; position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgba(15,23,42,.96); z-index: 9999; pointer-events: none; }
@keyframes tooltipFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* Pipeline styles */
.crm-dashboard-theme .pipeline-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
.crm-dashboard-theme .pipeline-stage { background: var(--card); border: 1px solid var(--border); border-radius: var(--r2); padding: 20px; text-align: center; transition: transform .2s, border-color .2s; }
.crm-dashboard-theme .pipeline-stage:hover { transform: translateY(-3px); border-color: rgba(124,58,237,.3); }
.crm-dashboard-theme .stage-icon { font-size: 1.8rem; margin-bottom: 10px; }
.crm-dashboard-theme .stage-name { font-size: .72rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; }
.crm-dashboard-theme .stage-value { font-size: 1.7rem; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.crm-dashboard-theme .stage-count { font-size: .72rem; color: var(--text-muted); }
.crm-dashboard-theme .funnel-bar-wrap { background: var(--card); border: 1px solid var(--border); border-radius: var(--r2); padding: 24px; margin-top: 16px; }
.crm-dashboard-theme .funnel-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.crm-dashboard-theme .funnel-row:last-child { margin-bottom: 0; }
.crm-dashboard-theme .funnel-label { font-size: .78rem; font-weight: 600; color: var(--text-muted); width: 100px; flex-shrink: 0; }
.crm-dashboard-theme .funnel-track { flex: 1; height: 28px; background: rgba(255,255,255,.04); border-radius: 6px; overflow: hidden; }
.crm-dashboard-theme .funnel-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 12px; font-size: .75rem; font-weight: 700; color: #fff; }
.crm-dashboard-theme .funnel-count { font-size: .78rem; font-weight: 600; width: 60px; text-align: right; flex-shrink: 0; }

/* Market stats */
.crm-dashboard-theme .market-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.crm-dashboard-theme .bottom-row { display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; margin-top: 16px; }
.crm-dashboard-theme .view-all-link { font-size: .72rem; color: var(--purple-light); cursor: pointer; text-decoration: none; }
.crm-dashboard-theme .view-all-link:hover { text-decoration: underline; }

/* Performance bar */
.crm-dashboard-theme .perf-bar-wrap { width: 100px; background: rgba(255,255,255,.06); border-radius: 4px; height: 6px; overflow: hidden; }
.crm-dashboard-theme .perf-bar { height: 100%; border-radius: 4px; background: linear-gradient(90deg,var(--purple),var(--blue)); }
.crm-dashboard-theme .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
.crm-dashboard-theme .status-active { background: var(--green); }
.crm-dashboard-theme .status-inactive { background: var(--text-dim); }

/* Sortable columns */
.crm-dashboard-theme .sortable { cursor: pointer; user-select: none; white-space: nowrap; }
.crm-dashboard-theme .sortable:after { content: ' ↕'; opacity: .3; font-size: .72em; }
.crm-dashboard-theme .sortable.asc:after { content: ' ↑'; opacity: 1; color: var(--purple-light); }
.crm-dashboard-theme .sortable.desc:after { content: ' ↓'; opacity: 1; color: var(--purple-light); }
.crm-dashboard-theme th.sortable:hover { color: var(--text); background: rgba(124,58,237,.06); }

/* ── RESPONSIVE ── */
@media(max-width:1100px) {
  .crm-dashboard-theme .kpi-row { grid-template-columns: repeat(3, 1fr); }
  .crm-dashboard-theme .charts-grid { grid-template-columns: 1fr; }
  .crm-dashboard-theme .care-grid { grid-template-columns: 1fr; }
}
@media(max-width:768px) {
  .crm-dashboard-theme .kpi-row,
  .crm-dashboard-theme .kpi-row-3 { grid-template-columns: 1fr 1fr; }
  .crm-dashboard-theme .kpi-value { font-size: 1.3rem; }
}
/* ── LIGHT MODE OVERRIDES ── */
.light-dashboard {
  --bg: #f8fafc;
  --bg2: #ffffff;
  --bg3: #f1f5f9;
  --bg4: #e2e8f0;
  --text: #1e293b;
  --text-muted: #475569;
  --text-dim: #94a3b8;
  --border: rgba(30, 41, 59, 0.1);
  --border2: rgba(30, 41, 59, 0.06);
  --card: rgba(255, 255, 255, 0.8);
  --card2: rgba(255, 255, 255, 0.95);
  background: var(--bg);
  color: var(--text);
}

.light-dashboard .dash-tab {
  color: var(--text-muted);
}
.light-dashboard .dash-tab:hover {
  background: rgba(0,0,0,.04);
  color: var(--text);
}
.light-dashboard .dash-tab.active {
  background: linear-gradient(135deg, rgba(124,58,237,.08), rgba(37,99,235,.06));
  color: #6d28d9;
  border: 1px solid rgba(124,58,237,.2);
}

.light-dashboard .kpi {
  background: rgba(255,255,255,.9);
  border-color: rgba(0,0,0,.08);
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.light-dashboard .kpi::before {
  background: radial-gradient(ellipse at top left, rgba(124,58,237,.04), transparent 60%);
}

.light-dashboard .chart-card,
.light-dashboard .table-card,
.light-dashboard .data-table-card {
  background: rgba(255,255,255,.9);
  border-color: rgba(0,0,0,.08);
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

.light-dashboard .search-input {
  background: #f1f5f9;
  border-color: rgba(0,0,0,.1);
  color: #1e293b;
}

.light-dashboard .detail-section {
  background: #f1f5f9;
  border-color: rgba(0,0,0,.08);
}

.light-dashboard .toggle-slider {
  background: #cbd5e1;
}
.light-dashboard .toggle-switch input:checked + .toggle-slider {
  background: var(--purple);
}

.light-dashboard .pipeline-stage {
  background: rgba(255,255,255,.9);
  border-color: rgba(0,0,0,.08);
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

.light-dashboard .page-btn {
  border-color: rgba(0,0,0,.1);
  color: var(--text-muted);
}

.light-dashboard .funnel-track {
  background: rgba(0,0,0,.04);
}

/* ── Dashboard Mode Toggle ── */
.dash-mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 20px;
  color: var(--purple-light);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.dash-mode-toggle:hover {
  background: rgba(124, 58, 237, 0.2);
  border-color: var(--purple);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.25);
}

.toggle-icon {
  font-size: 0.85rem;
}

.toggle-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Metabase Classic View ── */
.metabase-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  background: var(--bg);
  border-radius: var(--r);
  overflow: hidden;
}

.metabase-iframe {
  flex: 1;
  min-height: calc(100vh - 120px);
  border: none;
  border-radius: var(--r);
}

.no-metabase {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.no-metabase-content {
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}

.light-dashboard .dash-mode-toggle {
  background: rgba(124, 58, 237, 0.06);
  border-color: rgba(124, 58, 237, 0.2);
  color: var(--purple);
}

.light-dashboard .dash-mode-toggle:hover {
  background: rgba(124, 58, 237, 0.12);
  color: var(--purple);
}

.light-dashboard .metabase-container {
  background: #fff;
}
</style>

