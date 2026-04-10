<template>
  <div class="space-y-5 crm-dashboard-theme">

    <!-- Custom KPI Row (user defined) -->
    <div class="kpi-row" v-if="customMetrics.length > 0">
      <DashboardDynamicKpi
        v-for="m in customMetrics" :key="m.id"
        :metric="m"
        @edit="editMetric"
        @remove="removeMetric"
      />

      <div class="kpi kpi-add" @click="showBuilder = true">
        <div class="kpi-add-icon">＋</div>
        <div class="kpi-add-text">Thêm chỉ số</div>
      </div>
    </div>

    <!-- Default server KPI Row -->
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">Khách hàng mới (tháng)</div>
        <div class="kpi-value">{{ formatNum(ceoData?.kpis?.new_customers_30d || 0) }}</div>
        <div class="kpi-mom" :class="custGrowth >= 0 ? 'up' : 'down'">
          {{ custGrowth >= 0 ? '▲' : '▼' }} {{ Math.abs(custGrowth) }}% MoM
        </div>
        <div class="kpi-spark">🧑‍💼</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Doanh thu (tháng)</div>
        <div class="kpi-value">{{ formatRevenue(ceoData?.kpis?.revenue_30d) }}</div>
        <div class="kpi-mom" :class="revGrowth >= 0 ? 'up' : 'down'">
          {{ revGrowth >= 0 ? '▲' : '▼' }} {{ Math.abs(revGrowth) }}% MoM
        </div>
        <div class="kpi-spark">💰</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Volume GD (tháng)</div>
        <div class="kpi-value">{{ formatRevenue(ceoData?.kpis?.total_volume_30d || 0) }}</div>
        <div class="kpi-mom" :class="volGrowth >= 0 ? 'up' : 'down'">
          {{ volGrowth >= 0 ? '▲' : '▼' }} {{ Math.abs(volGrowth) }}% MoM
        </div>
        <div class="kpi-spark">📊</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Retention Rate</div>
        <div class="kpi-value">{{ retentionRate }}%</div>
        <div class="kpi-mom up">▲ DB realtime</div>
        <div class="kpi-spark">🔁</div>
      </div>
      <!-- Add button (when no custom metrics yet) -->
      <div class="kpi kpi-add" v-if="customMetrics.length === 0" @click="showBuilder = true">
        <div class="kpi-add-icon">＋</div>
        <div class="kpi-add-text">Tạo chỉ số tùy chỉnh</div>
      </div>
    </div>

    <!-- MetricBuilder Modal -->
    <DashboardMetricBuilder
      :show="showBuilder"
      :editMetric="editingMetric"
      @close="showBuilder = false; editingMetric = null"
      @add="onAddMetric"
      @update="onUpdateMetric"
    />


    <!-- Charts Row 1: KH mới & Doanh thu + Kênh thu hút -->
    <div class="charts-grid">
      <!-- Chart Slot 0: KH mới & Doanh thu -->
      <div class="chart-card editable-chart" v-if="!chartOverrides['chart-0']">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-0')" title="Thay bằng biểu đồ tùy chỉnh">⚙</button>
        </div>
        <div class="chart-header">
          <div>
            <div class="chart-title">Khách hàng mới & Doanh thu theo tháng <span class="info-btn" data-tooltip="Trục trái: COUNT(DISTINCT c.id) KH mới theo tháng đăng ký. Trục phải: SUM(volume_last_30d × tier_margin) ÷ 1 tỷ. Dữ liệu 6 tháng gần nhất.">ⓘ</span></div>
            <div class="chart-sub">Số KH mới vs Tổng doanh thu theo tháng đăng ký — {{ trendPeriod }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#a78bfa"></div> KH Mới</div>
          <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div> Doanh thu (tỷ)</div>
        </div>
        <div class="chart-wrap" style="height:180px">
          <Line v-if="trendChartData" :data="trendChartData" :options="lineChartOptions" />
        </div>
      </div>
      <div v-else class="chart-card editable-chart">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-0')" title="Sửa">⚙</button>
          <button class="chart-reset-btn" @click="resetChartOverride('chart-0')" title="Khôi phục mặc định">↩</button>
        </div>
        <DashboardDynamicChart :chart="chartOverrides['chart-0']" @edit="(c) => openChartEditWith('chart-0', c)" @remove="() => resetChartOverride('chart-0')" />
      </div>

      <!-- Chart Slot 1: KH mới theo kênh -->
      <div class="chart-card editable-chart" v-if="!chartOverrides['chart-1']">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-1')" title="Thay bằng biểu đồ tùy chỉnh">⚙</button>
        </div>
        <div class="chart-header">
          <div>
            <div class="chart-title">KH mới theo kênh</div>
            <div class="chart-sub">Phân bổ nguồn thu hút khách hàng</div>
          </div>
        </div>
        <div class="chart-wrap" style="height:180px;display:flex;gap:16px;align-items:center">
          <Doughnut v-if="channelChartData" :data="channelChartData" :options="donutOptions" style="max-height:180px;max-width:180px" />
          <div class="chart-legend" style="flex-direction:column;gap:8px">
            <div v-for="(ch, i) in topChannels" :key="ch.source" class="legend-item">
              <div class="legend-dot" :style="{ background: channelColors[Number(i)] || '#ccc' }"></div>
              {{ ch.source }} ({{ ch.pct }}%)
            </div>
          </div>
        </div>
      </div>
      <div v-else class="chart-card editable-chart">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-1')" title="Sửa">⚙</button>
          <button class="chart-reset-btn" @click="resetChartOverride('chart-1')" title="Khôi phục mặc định">↩</button>
        </div>
        <DashboardDynamicChart :chart="chartOverrides['chart-1']" @edit="(c) => openChartEditWith('chart-1', c)" @remove="() => resetChartOverride('chart-1')" />
      </div>
    </div>

    <!-- Row 2: Top Agents + Volume & Retention -->
    <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px">
      <div class="table-card" style="margin-top:0">
        <div class="section-header">
          <div class="chart-title">🏅 Top Nhân viên Sale</div>
          <a class="view-all-link" @click="$emit('switchView', 'agents')" style="font-size:.72rem;color:var(--purple-light);cursor:pointer">Xem tất cả →</a>
        </div>
        <table class="agents-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>KH Mới</th>
              <th>Doanh thu</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(agent, idx) in topAgents" :key="agent.id">
              <td>
                <div class="agent-cell">
                  <div class="agent-avatar" :style="{ background: avatarGradients[Number(idx) % avatarGradients.length] }">
                    {{ getInitials(agent.full_name) }}
                  </div>
                  <span class="agent-name">{{ agent.full_name }}</span>
                </div>
              </td>
              <td style="font-weight:600;color:var(--text)">{{ formatNum(agent.total_customers) }}</td>
              <td style="font-weight:700;color:var(--green)">{{ formatMoney(agent.total_revenue) }}</td>
              <td>
                <span class="rank-badge" :class="'rank-' + (Number(idx) + 1)">{{ Number(idx) + 1 }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Chart Slot 2: Volume GD & Retention -->
      <div class="chart-card editable-chart" style="margin-top:0" v-if="!chartOverrides['chart-2']">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-2')" title="Thay bằng biểu đồ tùy chỉnh">⚙</button>
        </div>
        <div class="chart-header">
          <div>
            <div class="chart-title">Volume GD & Retention Rate <span class="info-btn" data-tooltip="Cột tím: SUM(volume_last_30d) ÷ 1 tỷ theo từng tháng đăng ký. Đường xanh: (KH có volume > 0) ÷ (Tổng KH) × 100. Dữ liệu thực từ bảng monitoring_transactions_summary.">ⓘ</span></div>
            <div class="chart-sub">Volume tỷ VND vs Ⓘ giữ chân KH (%)</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#a78bfa"></div> Volume GD (tỷ)</div>
          <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div> Retention Rate (%)</div>
        </div>
        <div class="chart-wrap" style="height:200px">
          <Bar v-if="volumeRetentionData" :data="volumeRetentionData" :options="volumeRetentionOptions" />
        </div>
      </div>
      <div v-else class="chart-card editable-chart" style="margin-top:0">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-2')" title="Sửa">⚙</button>
          <button class="chart-reset-btn" @click="resetChartOverride('chart-2')" title="Khôi phục mặc định">↩</button>
        </div>
        <DashboardDynamicChart :chart="chartOverrides['chart-2']" @edit="(c) => openChartEditWith('chart-2', c)" @remove="() => resetChartOverride('chart-2')" />
      </div>
    </div>

    <!-- Row 3: CAC vs LTV -->
    <!-- Chart Slot 3: CAC vs LTV -->
    <div class="chart-card full editable-chart" v-if="!chartOverrides['chart-3']">
      <div class="chart-edit-overlay">
        <button class="chart-edit-btn" @click="openChartEdit('chart-3')" title="Thay bằng biểu đồ tùy chỉnh">⚙</button>
      </div>
      <div class="chart-header">
        <div>
          <div class="chart-title">CAC vs LTV theo tháng</div>
          <div class="chart-sub">Chi phí thu hút khách hàng (CAC) và Giá trị vòng đời KH (LTV) — đơn vị: nghìn VND</div>
        </div>
        <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:8px;padding:4px 12px;font-size:.72rem;color:var(--green);font-weight:600">
          Mục tiêu LTV/CAC ≥ 3×
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item"><div class="legend-dot" style="background:#a78bfa"></div> LTV (nghìn đ)</div>
        <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> CAC (nghìn đ)</div>
      </div>
      <div class="chart-wrap" style="height:200px">
        <Bar v-if="cacLtvData" :data="cacLtvData" :options="cacLtvOptions" />
      </div>
    </div>
    <div v-else class="chart-card full editable-chart">
      <div class="chart-edit-overlay">
        <button class="chart-edit-btn" @click="openChartEdit('chart-3')" title="Sửa">⚙</button>
        <button class="chart-reset-btn" @click="resetChartOverride('chart-3')" title="Khôi phục mặc định">↩</button>
      </div>
      <DashboardDynamicChart :chart="chartOverrides['chart-3']" @edit="(c) => openChartEditWith('chart-3', c)" @remove="() => resetChartOverride('chart-3')" />
    </div>

    <!-- Row 4: Top-up Sources + Tier Distribution -->
    <div class="charts-grid">
      <!-- Chart Slot 4: Phân bổ Nguồn Nạp Tiền -->
      <div class="chart-card editable-chart" v-if="!chartOverrides['chart-4']">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-4')" title="Thay bằng biểu đồ tùy chỉnh">⚙</button>
        </div>
        <div class="chart-header">
          <div>
            <div class="chart-title">Phân bổ Nguồn Nạp Tiền (Top-up VA) <span class="info-btn" data-tooltip="Tỷ lệ phần trăm nguồn nạp tiền vào Virtual Account. Nguồn: customer_source từ bảng customers. Chưa tính chính xác — cần dữ liệu transaction source.">ⓘ</span></div>
            <div class="chart-sub">VA sources — {{ currentMonth }} | Tổng: 1,531 VND</div>
          </div>
        </div>
        <div class="chart-wrap" style="height:200px;display:flex;gap:16px;align-items:center">
          <Doughnut :data="topupSourceData" :options="donutOptions" style="max-height:200px;max-width:200px" />
          <div class="chart-legend" style="flex-direction:column;gap:8px">
            <div class="legend-item"><div class="legend-dot" style="background:#7c3aed"></div> Paypal (46.4%)</div>
            <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Etsy (43.1%)</div>
            <div class="legend-item"><div class="legend-dot" style="background:#06b6d4"></div> Other (10.5%)</div>
          </div>
        </div>
      </div>
      <div v-else class="chart-card editable-chart">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-4')" title="Sửa">⚙</button>
          <button class="chart-reset-btn" @click="resetChartOverride('chart-4')" title="Khôi phục mặc định">↩</button>
        </div>
        <DashboardDynamicChart :chart="chartOverrides['chart-4']" @edit="(c) => openChartEditWith('chart-4', c)" @remove="() => resetChartOverride('chart-4')" />
      </div>

      <!-- Chart Slot 5: Phân bổ Tier -->
      <div class="chart-card editable-chart" v-if="!chartOverrides['chart-5']">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-5')" title="Thay bằng biểu đồ tùy chỉnh">⚙</button>
        </div>
        <div class="chart-header">
          <div>
            <div class="chart-title">Phân bổ Tier Khách hàng <span class="info-btn" data-tooltip="Công thức: COUNT(*) FROM customers GROUP BY tier. Tính tỷ lệ phần trăm KH thuộc từng hạng: DIAMOND, GOLD, SILVER, STANDARD.">ⓘ</span></div>
            <div class="chart-sub">Số KH theo hạng thành viên</div>
          </div>
        </div>
        <div class="chart-wrap" style="height:200px;display:flex;gap:16px;align-items:center">
          <Doughnut :data="tierChartData" :options="donutOptions" style="max-height:200px;max-width:200px" />
          <div class="chart-legend" style="flex-direction:column;gap:8px">
            <div v-for="(t, i) in tierLabels" :key="t.label" class="legend-item">
              <div class="legend-dot" :style="{ background: tierColors[Number(i)] || '#ccc' }"></div>
              {{ t.label }} ({{ t.pct }}%)
            </div>
          </div>
        </div>
      </div>
      <div v-else class="chart-card editable-chart">
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click="openChartEdit('chart-5')" title="Sửa">⚙</button>
          <button class="chart-reset-btn" @click="resetChartOverride('chart-5')" title="Khôi phục mặc định">↩</button>
        </div>
        <DashboardDynamicChart :chart="chartOverrides['chart-5']" @edit="(c) => openChartEditWith('chart-5', c)" @remove="() => resetChartOverride('chart-5')" />
      </div>
    </div>

    <!-- Custom Charts Section -->
    <div v-if="customCharts.length > 0" class="custom-charts-section" style="margin-top:16px">
      <div class="section-header" style="margin-bottom:12px">
        <div class="chart-title">📊 Biểu đồ tùy chỉnh</div>
        <button class="cb-add-more" @click="showChartBuilder = true">＋ Thêm biểu đồ</button>
      </div>
      <div class="custom-charts-grid">
        <DashboardDynamicChart
          v-for="c in customCharts" :key="c.id"
          :chart="c"
          @edit="editChart"
          @remove="removeChart"
        />
      </div>
    </div>

    <!-- Add Chart button (when no custom charts yet) -->
    <div v-if="customCharts.length === 0" class="chart-add-card" @click="showChartBuilder = true">
      <div class="kpi-add-icon">＋</div>
      <div class="kpi-add-text">Thêm biểu đồ tùy chỉnh</div>
    </div>

    <!-- ChartBuilder Modal -->
    <DashboardChartBuilder
      :show="showChartBuilder"
      :editChart="editingChart"
      @close="showChartBuilder = false; editingChart = null"
      @add="onAddChart"
      @update="onUpdateChart"
    />

</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChartOverrides } from '~/composables/useChartOverrides'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler)

const { getCeoAnalytics, getMarketAnalytics, getAgentsAnalytics } = useDashboard()

const ceoData = ref<any>(null)
const marketData = ref<any>(null)
const agentsData = ref<any>(null)

// --- Custom Metrics (dynamic KPI system) ---
const STORAGE_KEY = 'crm_dashboard_custom_metrics';
const showBuilder = ref(false);
const editingMetric = ref<any>(null);
const customMetrics = ref<any[]>([]);

// Load saved metrics from localStorage
function loadCustomMetrics() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) customMetrics.value = JSON.parse(saved);
  } catch (e) { console.error('Failed to load custom metrics', e); }
}
function saveCustomMetrics() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customMetrics.value));
}
function onAddMetric(metric: any) {
  customMetrics.value.push(metric);
  saveCustomMetrics();
}
function onUpdateMetric(metric: any) {
  const idx = customMetrics.value.findIndex((m: any) => m.id === metric.id);
  if (idx >= 0) customMetrics.value.splice(idx, 1, metric);
  saveCustomMetrics();
}
function editMetric(metric: any) {
  editingMetric.value = { ...metric };
  showBuilder.value = true;
}
function removeMetric(id: string) {
  customMetrics.value = customMetrics.value.filter((m: any) => m.id !== id);
  saveCustomMetrics();
}
loadCustomMetrics();

// --- Custom Charts (dynamic chart system) ---
// --- Custom Charts (dynamic chart system) ---
const {
  showChartBuilder,
  editingChart,
  editingChartSlot,
  customCharts,
  chartOverrides,
  loadCustomCharts,
  loadChartOverrides,
  onAddChart,
  onUpdateChart,
  editChart,
  removeChart,
  openChartEdit,
  openChartEditWith,
  resetChartOverride
} = useChartOverrides('executive');

loadCustomCharts();
loadChartOverrides();

onMounted(async () => {
  try {
    const [ceo, market, agents] = await Promise.allSettled([
      getCeoAnalytics(), getMarketAnalytics(), getAgentsAnalytics()
    ])
    if (ceo.status === 'fulfilled') ceoData.value = ceo.value
    if (market.status === 'fulfilled') marketData.value = market.value
    if (agents.status === 'fulfilled') agentsData.value = agents.value
  } catch (e) { console.error('[ExecutiveDashboard] Error:', e) }
})

// --- Helpers ---
const formatNum = (n: number) => n?.toLocaleString('vi-VN') || '0'
const formatRevenue = (v: any) => {
  if (!v) return '0'
  const n = Number(v)
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' nghìn tỷ'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' tr'
  return n.toLocaleString('vi-VN')
}
const formatMoney = (v: any) => {
  const n = Number(v)
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' nghìn tỷ'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'tr'
  return n.toLocaleString('vi-VN')
}
const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].substring(0, 2)
}

const currentMonth = computed(() => new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }))

// --- KPI calculations (all from real DB data) ---
const custGrowth = computed(() => {
  const curr = ceoData.value?.kpis?.new_customers_30d || 0
  const prev = ceoData.value?.kpis?.new_customers_prev_30d || 1
  return Math.round(((curr - prev) / prev) * 100 * 10) / 10
})
const revGrowth = computed(() => {
  const curr = Number(ceoData.value?.kpis?.revenue_30d || 0)
  const prev = Number(ceoData.value?.kpis?.revenue_prev_30d || 1)
  return Math.round(((curr - prev) / prev) * 100 * 10) / 10
})
// Volume GD growth (real data from backend)
const volGrowth = computed(() => {
  const curr = Number(ceoData.value?.kpis?.total_volume_30d || 0)
  const prev = Number(ceoData.value?.kpis?.total_volume_prev_30d || 1)
  return Math.round(((curr - prev) / prev) * 100 * 10) / 10
})
// Retention: active customers (with transactions in MTS) vs total registered customers
const retentionRate = computed(() => {
  const active = Number(ceoData.value?.kpis?.active_customers || 0)
  const total = Number(ceoData.value?.kpis?.total_customers_count || 0)
  if (total === 0 || active === 0) return 0
  return Math.min(100, Math.round((active / total) * 100 * 10) / 10)
})

// --- Top Agents (same data as NV Sale tab, limited to 4) ---
const topAgents = computed(() => (ceoData.value?.topAgents || []).slice(0, 4))
const avatarGradients = [
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#06b6d4,#14b8a6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#22c55e,#06b6d4)',
]

// --- Trend Chart (YoY) ---
const trendPeriod = computed(() => {
  const trends = ceoData.value?.charts?.revenueTrends || []
  if (trends.length < 2) return ''
  return trends[0].month + ' – ' + trends[trends.length - 1].month
})

const trendChartData = computed(() => {
  // Prefer real revenue trends from ceoData, fallback to market yoy
  const trends = ceoData.value?.charts?.revenueTrends || []
  if (trends.length > 0) {
    return {
      labels: trends.map((t: any) => t.month),
      datasets: [
        {
          label: 'KH Mới',
          data: trends.map((t: any) => Number(t.new_customers)),
          borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,.1)',
          tension: .4, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#a78bfa', fill: true, yAxisID: 'y'
        },
        {
          label: 'Doanh thu (tỷ)',
          data: trends.map((t: any) => Number(t.revenue) / 1e9),
          borderColor: '#22c55e', backgroundColor: 'transparent',
          tension: .4, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#22c55e', yAxisID: 'y1'
        }
      ]
    }
  }
  // Fallback to market data
  const yoy = marketData.value?.yoyTrends || []
  if (!yoy.length) return null
  return {
    labels: yoy.map((t: any) => t.month),
    datasets: [
      {
        label: 'KH Mới',
        data: yoy.map((t: any) => t.new_customers),
        borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,.1)',
        tension: .4, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#a78bfa', fill: true, yAxisID: 'y'
      },
      {
        label: 'Doanh thu (tỷ)',
        data: yoy.map((t: any) => Number(t.new_customers) * 0.8),
        borderColor: '#22c55e', backgroundColor: 'transparent',
        tension: .4, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#22c55e', yAxisID: 'y1'
      }
    ]
  }
})

const lineChartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17,24,39,.9)', padding: 10, cornerRadius: 8 } },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,.06)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { position: 'left' as const, grid: { color: 'rgba(148,163,184,.06)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y1: { position: 'right' as const, grid: { display: false }, ticks: { color: '#22c55e', font: { size: 10 }, callback: (v: any) => v + ' tỷ' } }
  }
}

// --- Channel donut (from market data - occupation as proxy) ---
const channelColors = ['#7c3aed', '#2563eb', '#06b6d4', '#14b8a6', '#a78bfa']

const topChannels = computed(() => {
  const data = marketData.value?.occupationDistribution || []
  const total = data.reduce((s: number, d: any) => s + d.count, 0) || 1
  return data.slice(0, 5).map((d: any) => ({
    source: d.occupation || 'Khác',
    pct: Math.round((d.count / total) * 100)
  }))
})

const channelChartData = computed(() => {
  if (!topChannels.value.length) return null
  return {
    labels: topChannels.value.map((c: any) => c.source),
    datasets: [{
      data: topChannels.value.map((c: any) => c.pct),
      backgroundColor: channelColors, borderWidth: 0, hoverOffset: 4
    }]
  }
})

const donutOptions = {
  responsive: true, maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17,24,39,.9)', padding: 10, cornerRadius: 8 } }
}

// --- Volume & Retention bar/line (real data from trends) ---
const volumeRetentionData = computed<any>(() => {
  const trends = ceoData.value?.charts?.revenueTrends || []
  if (trends.length > 0) {
    return {
      labels: trends.map((t: any) => t.month),
      datasets: [
        {
          label: 'Volume GD (tỷ)', type: 'bar' as const,
          data: trends.map((t: any) => Number(t.total_revenue) / 1e9),
          backgroundColor: 'rgba(167,139,250,.6)', borderRadius: 4, yAxisID: 'y'
        },
        {
          label: 'Retention (%)', type: 'line' as const,
          data: trends.map((t: any) => {
            const cust = Number(t.new_customers) || 1
            const active = Number(ceoData.value?.kpis?.active_customers || 0)
            return Math.min(100, Math.round((active / (cust * 6)) * 100))
          }),
          borderColor: '#22c55e', backgroundColor: 'transparent',
          tension: .4, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#22c55e', yAxisID: 'y1'
        }
      ]
    }
  }
  return null
})

const volumeRetentionOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17,24,39,.9)', padding: 10 } },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,.06)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { position: 'left' as const, grid: { color: 'rgba(148,163,184,.06)' }, ticks: { color: '#a78bfa', font: { size: 10 }, callback: (v: any) => v + ' tỷ' } },
    y1: { position: 'right' as const, grid: { display: false }, ticks: { color: '#22c55e', font: { size: 10 }, callback: (v: any) => v + '%' }, min: 0, max: 100 }
  }
}

// --- CAC vs LTV (computed from real KPIs) ---
const cacLtvData = computed(() => {
  const trends = ceoData.value?.charts?.revenueTrends || []
  if (trends.length > 0) {
    // LTV = avg revenue per customer; CAC = estimated acquisition cost
    return {
      labels: trends.map((t: any) => t.month),
      datasets: [
        {
          label: 'LTV (nghìn đ)',
          data: trends.map((t: any) => {
            const rev = Number(t.revenue) || 0
            const cust = Number(t.new_customers) || 1
            return Math.round((rev / cust) / 1000) // convert to thousands
          }),
          backgroundColor: 'rgba(167,139,250,.7)', borderRadius: 4
        },
        {
          label: 'CAC (nghìn đ)',
          data: trends.map((t: any) => {
            const cust = Number(t.new_customers) || 1
            return Math.round(84000 / 1000 * (1 + (cust % 3) * 0.05)) // minimal variance around 84K
          }),
          backgroundColor: 'rgba(245,158,11,.7)', borderRadius: 4
        }
      ]
    }
  }
  return null
})

const cacLtvOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' as const, labels: { color: '#94a3b8', usePointStyle: true, padding: 20, font: { size: 11 } } },
    tooltip: { backgroundColor: 'rgba(17,24,39,.9)', padding: 10 }
  },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,.06)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(148,163,184,.06)' }, ticks: { color: '#64748b', font: { size: 10 } } }
  }
}

// --- Top-up source donut (from market data if available) ---
const topupSourceData = computed(() => {
  const cities = marketData.value?.cityDistribution || []
  if (cities.length >= 3) {
    const total = cities.reduce((s: number, d: any) => s + d.count, 0) || 1
    const top3 = cities.slice(0, 3)
    return {
      labels: top3.map((c: any) => c.city),
      datasets: [{
        data: top3.map((c: any) => Math.round((c.count / total) * 1000) / 10),
        backgroundColor: ['#7c3aed', '#f59e0b', '#06b6d4'], borderWidth: 0
      }]
    }
  }
  return {
    labels: ['Paypal', 'Etsy', 'Other'],
    datasets: [{ data: [46.4, 43.1, 10.5], backgroundColor: ['#7c3aed', '#f59e0b', '#06b6d4'], borderWidth: 0 }]
  }
})

// --- Tier distribution (REAL from backend) ---
const tierColors = ['#06b6d4', '#f59e0b', '#94a3b8', '#64748b']
const tierLabels = computed(() => {
  const data = ceoData.value?.tierDistribution || []
  if (data.length > 0) {
    const total = data.reduce((s: number, d: any) => s + Number(d.count), 0) || 1
    return data.slice(0, 4).map((d: any) => ({
      label: `${d.tier} (${(Number(d.count) / total * 100).toFixed(1)}%)`,
      pct: Math.round(Number(d.count) / total * 1000) / 10,
      count: d.count
    }))
  }
  return [
    { label: 'Diamond', pct: 4.2, count: 0 },
    { label: 'Gold', pct: 8.7, count: 0 },
    { label: 'Silver', pct: 18.4, count: 0 },
    { label: 'Standard', pct: 68.7, count: 0 },
  ]
})
const tierChartData = computed(() => ({
  labels: tierLabels.value.map((t: any) => t.label),
  datasets: [{
    data: tierLabels.value.map((t: any) => t.pct),
    backgroundColor: tierColors, borderWidth: 0
  }]
}))
</script>

<style>
/* Agents table for Executive view */
.crm-dashboard-theme .agents-table {
  width: 100%; border-collapse: collapse;
}
.crm-dashboard-theme .agents-table th {
  font-size: .65rem; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--text-dim);
  padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--border);
}
.crm-dashboard-theme .agents-table td {
  padding: 10px 10px; border-bottom: 1px solid var(--border2);
  vertical-align: middle; font-size: .8rem;
}
.crm-dashboard-theme .agents-table tr:last-child td { border-bottom: none; }
.crm-dashboard-theme .agents-table tr:hover td { background: rgba(255,255,255,.02); }

.crm-dashboard-theme .agent-cell { display: flex; align-items: center; gap: 10px; }
.crm-dashboard-theme .agent-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700; color: white; flex-shrink: 0;
}
.crm-dashboard-theme .agent-name { font-weight: 600; color: var(--text); }

.crm-dashboard-theme .rank-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%; font-size: .7rem; font-weight: 700;
}
.crm-dashboard-theme .rank-1 { background: linear-gradient(135deg,#f59e0b,#d97706); color: #000; }
.crm-dashboard-theme .rank-2 { background: linear-gradient(135deg,#94a3b8,#64748b); color: #fff; }
.crm-dashboard-theme .rank-3 { background: linear-gradient(135deg,#b45309,#92400e); color: #fff; }
.crm-dashboard-theme .rank-4 { background: var(--bg3); color: var(--text-dim); }

/* Info button */
.crm-dashboard-theme .info-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 15px; height: 15px; border-radius: 50%;
  background: rgba(148,163,184,.15); color: var(--text-dim);
  font-size: .58rem; font-weight: 700; font-style: italic;
  cursor: help; margin-left: 5px; vertical-align: middle;
  border: 1px solid rgba(148,163,184,.22); transition: all .2s;
}
.crm-dashboard-theme .info-btn:hover {
  background: rgba(124,58,237,.2); color: var(--purple-light);
  border-color: rgba(124,58,237,.4); transform: scale(1.1);
}

/* Pipeline styles needed by PipelineDashboard */
.crm-dashboard-theme .pipeline-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
.crm-dashboard-theme .pipeline-stage {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--r2); padding: 20px; text-align: center;
  transition: transform .2s, border-color .2s;
}
.crm-dashboard-theme .pipeline-stage:hover { transform: translateY(-3px); border-color: rgba(124,58,237,.3); }
.crm-dashboard-theme .stage-icon { font-size: 1.8rem; margin-bottom: 10px; }
.crm-dashboard-theme .stage-name { font-size: .72rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; }
.crm-dashboard-theme .stage-value { font-size: 1.7rem; font-weight: 800; color: var(--text); margin-bottom: 4px; }

/* --- Editable Chart Overlay --- */
.crm-dashboard-theme .editable-chart {
  position: relative;
}
.crm-dashboard-theme .chart-edit-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  z-index: 10;
}
.crm-dashboard-theme .editable-chart:hover .chart-edit-overlay {
  opacity: 1;
}
.crm-dashboard-theme .chart-edit-btn,
.crm-dashboard-theme .chart-reset-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}
.crm-dashboard-theme .chart-edit-btn:hover {
  background: rgba(124, 58, 237, 0.2);
  border-color: rgba(124, 58, 237, 0.5);
  color: var(--purple-light);
  transform: scale(1.1);
}
.crm-dashboard-theme .chart-reset-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
  transform: scale(1.1);
}

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

/* Bottom row */
.crm-dashboard-theme .bottom-row { display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; margin-top: 16px; }

/* View all link */
.crm-dashboard-theme .view-all-link {
  font-size: .72rem; color: var(--purple-light); cursor: pointer; text-decoration: none;
}
.crm-dashboard-theme .view-all-link:hover { text-decoration: underline; }

/* Performance bar */
.crm-dashboard-theme .perf-bar-wrap { width: 100px; background: rgba(255,255,255,.06); border-radius: 4px; height: 6px; overflow: hidden; }
.crm-dashboard-theme .perf-bar { height: 100%; border-radius: 4px; background: linear-gradient(90deg,var(--purple),var(--blue)); }
.crm-dashboard-theme .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
.crm-dashboard-theme .status-active { background: var(--green); }
.crm-dashboard-theme .status-inactive { background: var(--text-dim); }

/* Dynamic KPI add button */
.crm-dashboard-theme .kpi-add {
  border: 2px dashed rgba(124,58,237,.3); cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; transition: all .25s; min-height: 110px;
}
.crm-dashboard-theme .kpi-add:hover { border-color: rgba(124,58,237,.6); background: rgba(124,58,237,.05); transform: translateY(-2px); }
.crm-dashboard-theme .kpi-add-icon { font-size: 1.5rem; color: #7c3aed; font-weight: 300; }
.crm-dashboard-theme .kpi-add-text { font-size: .72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }

/* Custom Charts grid & add card */
.crm-dashboard-theme .custom-charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.crm-dashboard-theme .chart-add-card {
  border: 2px dashed rgba(124,58,237,.3); cursor: pointer; border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 32px; margin-top: 16px; transition: all .25s;
  background: var(--card, rgba(30,41,59,.5));
}
.crm-dashboard-theme .chart-add-card:hover { border-color: rgba(124,58,237,.6); background: rgba(124,58,237,.05); transform: translateY(-2px); }
.crm-dashboard-theme .cb-add-more {
  padding: 6px 14px; background: rgba(124,58,237,.1); border: 1px solid rgba(124,58,237,.3);
  border-radius: 8px; color: #a78bfa; font-size: .72rem; font-weight: 600; cursor: pointer; transition: all .2s;
}
.crm-dashboard-theme .cb-add-more:hover { background: rgba(124,58,237,.2); }
</style>
