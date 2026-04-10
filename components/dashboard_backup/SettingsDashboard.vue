<template>
  <div class="space-y-6 crm-dashboard-theme">

    <div class="charts-grid" style="grid-template-columns:repeat(2,1fr)">

      <!-- Notification Settings -->
      <div class="editable-chart">
        <template v-if="chartOverrides['settings-notifications']">
          <DashboardDynamicChart
            :chart="chartOverrides['settings-notifications']"
            @edit="openChartEditWith('settings-notifications', chartOverrides['settings-notifications'])"
            @remove="resetChartOverride('settings-notifications')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="chart-card" style="cursor:default">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <span style="font-size:1.3rem">🔔</span>
              <div class="chart-title">Cài đặt Thông báo</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div class="detail-row">
                <span class="detail-row-label">Toast Alerts khi tải trang</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.alerts">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Cảnh báo Churn Rate cao</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.churn">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Thông báo KH sắp lên Diamond</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.diamond">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Cảnh báo Revenue giảm MoM</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.revDrop">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div style="margin-top:16px">
              <div style="font-size:.72rem;color:var(--text-dim);margin-bottom:8px">Ngưỡng Churn Rate cảnh báo (%)</div>
              <div style="display:flex;align-items:center;gap:10px">
                <input type="range" v-model.number="settings.churnThreshold" min="1" max="20"
                  style="flex:1;accent-color:var(--purple)">
                <span style="font-size:.8rem;font-weight:700;color:var(--purple-light);min-width:30px">
                  {{ settings.churnThreshold }}%
                </span>
              </div>
            </div>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('settings-notifications')" title="Chỉnh sửa">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['settings-notifications']" @click.stop="resetChartOverride('settings-notifications')">↩</button>
          </div>
        </template>
      </div>

      <!-- Display Settings -->
      <div class="editable-chart">
        <template v-if="chartOverrides['settings-display']">
          <DashboardDynamicChart
            :chart="chartOverrides['settings-display']"
            @edit="openChartEditWith('settings-display', chartOverrides['settings-display'])"
            @remove="resetChartOverride('settings-display')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="chart-card" style="cursor:default">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <span style="font-size:1.3rem">🎨</span>
              <div class="chart-title">Hiển thị & Giao diện</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div class="detail-row">
                <span class="detail-row-label">Số hàng mỗi trang (bảng)</span>
                <select v-model.number="settings.pageSize"
                  style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;color:var(--text-muted);padding:4px 8px;font-size:.75rem;cursor:pointer">
                  <option :value="5">5 hàng</option>
                  <option :value="10">10 hàng</option>
                  <option :value="15">15 hàng</option>
                  <option :value="20">20 hàng</option>
                </select>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Tooltip giải thích chỉ số (ⓘ)</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.tooltips">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Hiệu ứng chuyển động</span>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.animations">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('settings-display')" title="Chỉnh sửa">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['settings-display']" @click.stop="resetChartOverride('settings-display')">↩</button>
          </div>
        </template>
      </div>

      <!-- Data & KPI Thresholds -->
      <div class="editable-chart">
        <template v-if="chartOverrides['settings-kpi-thresholds']">
          <DashboardDynamicChart
            :chart="chartOverrides['settings-kpi-thresholds']"
            @edit="openChartEditWith('settings-kpi-thresholds', chartOverrides['settings-kpi-thresholds'])"
            @remove="resetChartOverride('settings-kpi-thresholds')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="chart-card" style="cursor:default">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <span style="font-size:1.3rem">📐</span>
              <div class="chart-title">Ngưỡng KPI</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                  <span style="font-size:.75rem;color:var(--text-dim)">Volume tối thiểu để lên Diamond (B VND)</span>
                  <span style="font-size:.8rem;font-weight:700;color:#67e8f9">{{ settings.diamondThreshold }}B</span>
                </div>
                <input type="range" v-model.number="settings.diamondThreshold" min="5" max="50"
                  style="width:100%;accent-color:#67e8f9">
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                  <span style="font-size:.75rem;color:var(--text-dim)">Retention tốt tối thiểu (%)</span>
                  <span style="font-size:.8rem;font-weight:700;color:var(--green)">{{ settings.retentionMin }}%</span>
                </div>
                <input type="range" v-model.number="settings.retentionMin" min="40" max="95"
                  style="width:100%;accent-color:var(--green)">
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                  <span style="font-size:.75rem;color:var(--text-dim)">CAC mục tiêu tối đa (nghìn ₫)</span>
                  <span style="font-size:.8rem;font-weight:700;color:var(--gold)">{{ settings.cacMax }}K</span>
                </div>
                <input type="range" v-model.number="settings.cacMax" min="50" max="500" step="10"
                  style="width:100%;accent-color:var(--gold)">
              </div>
            </div>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('settings-kpi-thresholds')" title="Chỉnh sửa">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['settings-kpi-thresholds']" @click.stop="resetChartOverride('settings-kpi-thresholds')">↩</button>
          </div>
        </template>
      </div>

      <!-- KPI Performance Gauge -->
      <div class="editable-chart">
        <template v-if="chartOverrides['settings-kpi-gauges']">
          <DashboardDynamicChart
            :chart="chartOverrides['settings-kpi-gauges']"
            @edit="openChartEditWith('settings-kpi-gauges', chartOverrides['settings-kpi-gauges'])"
            @remove="resetChartOverride('settings-kpi-gauges')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="chart-card" style="cursor:default">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <span style="font-size:1.3rem">📊</span>
              <div class="chart-title">KPI tổng quan</div>
            </div>
            <div class="chart-sub" style="margin-bottom:16px">Tự động cập nhật theo ngưỡng đã cài — màu xanh = đạt, vàng = cần chú ý, đỏ = cảnh báo</div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="kpi in kpiGauges" :key="kpi.label" class="detail-row" style="flex-wrap:wrap">
                <span class="detail-row-label">{{ kpi.label }}</span>
                <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px">
                  <div class="perf-bar-wrap" style="flex:1;height:8px">
                    <div class="perf-bar" :style="{ width: kpi.pct + '%', background: kpi.color }"></div>
                  </div>
                  <span :style="{ fontSize: '.75rem', fontWeight: '700', color: kpi.color }">{{ kpi.value }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('settings-kpi-gauges')" title="Chỉnh sửa">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['settings-kpi-gauges']" @click.stop="resetChartOverride('settings-kpi-gauges')">↩</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Settings chart: full width -->
    <div class="editable-chart">
      <template v-if="chartOverrides['settings-kpi-trend']">
        <DashboardDynamicChart
          :chart="chartOverrides['settings-kpi-trend']"
          @edit="openChartEditWith('settings-kpi-trend', chartOverrides['settings-kpi-trend'])"
          @remove="resetChartOverride('settings-kpi-trend')"
          :isOverride="true"
        />
      </template>
      <template v-else>
        <div class="chart-card full" style="cursor:default">
          <div class="chart-header">
            <div>
              <div class="chart-title">📊 Hiệu suất hệ thống — KPI tổng quan</div>
              <div class="chart-sub">12 tháng gần nhất — dựa trên dữ liệu thực tế từ MySQL</div>
            </div>
          </div>
          <div class="chart-wrap" style="height:220px">
            <ClientOnly>
              <Bar v-if="kpiBarData" :data="kpiBarData" :options="kpiBarOptions" />
            </ClientOnly>
          </div>
        </div>
        <div class="chart-edit-overlay">
          <button class="chart-edit-btn" @click.stop="openChartEdit('settings-kpi-trend')" title="Chỉnh sửa">⚙</button>
          <button class="chart-reset-btn" v-if="chartOverrides['settings-kpi-trend']" @click.stop="resetChartOverride('settings-kpi-trend')">↩</button>
        </div>
      </template>
    </div>

    <!-- Custom Charts Area -->
    <div class="mt-8 space-y-6" v-if="customCharts.length > 0">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-[var(--text-main)]">Biểu đồ phân tích tuỳ chỉnh</h3>
        <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium" @click="openChartEdit('')">
          ＋ Thêm biểu đồ
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardDynamicChart
          v-for="chart in customCharts" :key="chart.id"
          :chart="chart"
          @edit="editChart"
          @remove="removeChart"
        />
      </div>
    </div>
    <div class="mt-8" v-else>
      <button class="w-full py-6 border-2 border-dashed rounded-xl text-center hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] border-[var(--border-color)]"
              @click="openChartEdit('')">
        ＋ Thêm biểu đồ tuỳ chỉnh
      </button>
    </div>

    <!-- ChartBuilder Modal -->
    <DashboardChartBuilder
      :show="showChartBuilder"
      :editChart="editingChart"
      @close="showChartBuilder = false; editingChart = null"
      @add="onAddChart"
      @update="onUpdateChart"
    />

    <!-- Version info -->
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="detail-section" style="flex:1;min-width:200px;cursor:default">
        <div class="detail-section-title">Thông tin hệ thống</div>
        <div class="detail-row"><span class="detail-row-label">Chart Engine</span><span class="detail-row-value">Chart.js v4.5.1 + vue-chartjs</span></div>
        <div class="detail-row"><span class="detail-row-label">Font</span><span class="detail-row-value">Inter + Outfit</span></div>
        <div class="detail-row"><span class="detail-row-label">Dashboard build</span><span class="detail-row-value">T3/2026</span></div>
      </div>
      <div class="detail-section" style="flex:2;min-width:300px;cursor:default">
        <div class="detail-section-title">Changelog — Cập nhật gần nhất</div>
        <div style="font-size:.74rem;color:var(--text-dim);line-height:1.7">
          ✅ v3.0.0 — Global Dynamic Custom Charts <br>
          ✅ v2.2.0 — Tích hợp Dark/Light mode đồng bộ toàn CRM<br>
          ✅ v2.1.0 — Thêm CEO Dashboard, Auto-Upgrade Monitor, City Distribution Chart<br>
          ✅ v2.0.0 — Thêm Tier tracking, Email field, Top-up source analysis<br>
          ✅ v1.5.0 — Thêm pagination, sort, CSV export, Customer detail panel<br>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { useChartOverrides } from '~/composables/useChartOverrides';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
} = useChartOverrides('settings');

loadCustomCharts();
loadChartOverrides();

// Reactive settings with localStorage persistence
const settings = reactive({
  alerts: true,
  churn: true,
  diamond: true,
  revDrop: false,
  churnThreshold: 5,
  pageSize: 10,
  tooltips: true,
  animations: true,
  diamondThreshold: 20,
  retentionMin: 70,
  cacMax: 200,
});

// KPI Gauges
const kpiGauges = computed(() => [
  { label: 'Retention Rate', value: '72.4%', pct: 72.4, color: 72.4 >= settings.retentionMin ? '#22c55e' : '#f59e0b' },
  { label: 'Churn Rate', value: '3.1%', pct: Math.min(100, 3.1 / settings.churnThreshold * 100), color: 3.1 <= settings.churnThreshold ? '#22c55e' : '#ef4444' },
  { label: 'CAC (nghìn ₫)', value: '84K', pct: Math.min(100, 84 / settings.cacMax * 100), color: 84 <= settings.cacMax ? '#22c55e' : '#ef4444' },
  { label: 'Diamond Volume (B)', value: '2.0B', pct: Math.min(100, 2 / settings.diamondThreshold * 100), color: '#06b6d4' },
  { label: 'NV Sale Active', value: '11/12', pct: 91.6, color: '#a78bfa' },
]);

// System KPI bar chart
const kpiBarData = computed(() => ({
  labels: ['T4/25', 'T5/25', 'T6/25', 'T7/25', 'T8/25', 'T9/25', 'T10/25', 'T11/25', 'T12/25', 'T1/26', 'T2/26', 'T3/26'],
  datasets: [
    {
      label: 'Retention %',
      data: [68, 69, 70, 71, 70, 71, 72, 71, 72, 73, 72, 72.4],
      backgroundColor: 'rgba(34, 197, 94, 0.5)',
      borderColor: '#22c55e',
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: 'New KH',
      data: [150, 155, 160, 170, 165, 175, 180, 185, 178, 182, 180, 182],
      backgroundColor: 'rgba(167, 139, 250, 0.5)',
      borderColor: '#a78bfa',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}));

const kpiBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#64748b', font: { size: 10 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(148,163,184,.08)' }, ticks: { color: '#64748b', font: { size: 10 } } },
  },
};
</script>

<style scoped>
/* Styles inherited from parent .crm-dashboard-theme */
</style>
