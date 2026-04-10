<template>
  <div class="space-y-5 crm-dashboard-theme p-4 min-h-[500px]">

    <!-- KPI Row -->
    <div class="kpi-grid" v-if="customMetrics.length > 0">
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
    
    <div class="kpi-grid single" v-else>
      <div class="kpi kpi-add" @click="showBuilder = true">
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

    <!-- Charts Section -->
    <div v-if="customCharts.length === 0" class="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[var(--border)] rounded-xl" style="background: var(--bg3); margin-top: 24px">
      <div style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;">📊</div>
      <h3 class="text-lg font-bold" style="color: var(--text-main); margin-bottom: 6px;">Chưa có biểu đồ</h3>
      <p style="color: var(--text-dim); margin-bottom: 20px; max-width: 360px; margin-left: auto; margin-right: auto; font-size: .85rem;">
        Thêm biểu đồ tuỳ chỉnh hoặc dùng preset sẵn theo template
      </p>
      <div class="exec-btns">
        <button class="exec-btn primary" @click="openChartEdit('')">
          ＋ Thêm biểu đồ
        </button>
        <button class="exec-btn preset" @click="seedDefaults" :disabled="seeding">
          {{ seeding ? '⏳ Đang tạo...' : '🎯 Dùng Template mẫu' }}
        </button>
      </div>
    </div>

    <!-- Custom Charts Grid (2 columns) -->
    <div class="mt-6" v-if="customCharts.length > 0">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-[var(--text-main)]">Biểu đồ đang hiển thị</h3>
        <button class="exec-btn primary sm" @click="openChartEdit('')">
          ＋ Thêm biểu đồ
        </button>
      </div>
      <div class="chart-grid-2col">
        <DashboardDynamicChart
          v-for="customC in customCharts" :key="customC.id"
          :chart="customC"
          @edit="editChart"
          @remove="removeChart"
        />
      </div>
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
import { ref } from 'vue'
import { useChartOverrides } from '~/composables/useChartOverrides'

const {
  customMetrics,
  customCharts,
  chartOverrides,
  showChartBuilder,
  editingChart,
  loadDashboardSettings,
  onAddMetric,
  onUpdateMetric,
  removeMetric,
  onAddChart,
  onUpdateChart,
  editChart,
  removeChart,
  openChartEdit
} = useChartOverrides('executive');

const showBuilder = ref(false);
const editingMetric = ref<any>(null);
const seeding = ref(false);

function editMetric(metric: any) {
  editingMetric.value = { ...metric };
  showBuilder.value = true;
}

// ── Auto-Seed Template Defaults ──
async function seedDefaults() {
  seeding.value = true;
  try {
    // Default KPI Metrics (matching template via virtual table)
    const defaultMetrics = [
      {
        id: 'preset-kh-moi',
        table: 'kpi_computed',
        column: 'kh_moi_thang',
        operation: 'COUNT',
        label: 'KHÁCH HÀNG MỚI (THÁNG)',
        format: 'number',
        icon: '👥',
      },
      {
        id: 'preset-doanh-thu',
        table: 'kpi_computed',
        column: 'doanh_thu_thang',
        operation: 'COUNT',
        label: 'DOANH THU (THÁNG)',
        format: 'currency',
        icon: '💰',
      },
      {
        id: 'preset-volume',
        table: 'kpi_computed',
        column: 'volume_thang',
        operation: 'COUNT',
        label: 'VOLUME GD (THÁNG)',
        format: 'currency',
        icon: '📊',
      },
      {
        id: 'preset-retention',
        table: 'kpi_computed',
        column: 'retention_rate',
        operation: 'COUNT',
        label: 'RETENTION RATE',
        format: 'percent',
        icon: '🔄',
      },
    ];

    // Default Charts (matching template with advanced features)
    const defaultCharts = [
      {
        id: 'preset-volume-trend',
        table: 'monitoring_transactions_summary',
        xColumn: 'last_tx_at',
        yColumn: 'total_volume',
        yOperation: 'SUM',
        chartType: 'combo',
        title: 'Volume GD & Giao dịch mới (theo tháng)',
        timeGrouping: 'month',
        y2Column: '*',
        y2Operation: 'COUNT',
      },
      {
        id: 'preset-leads-trend',
        table: 'leads',
        xColumn: 'created_at',
        yColumn: '*',
        yOperation: 'COUNT',
        chartType: 'line',
        title: 'Leads mới (theo tuần)',
        timeGrouping: 'week',
      },
      {
        id: 'preset-tier',
        table: 'customers',
        xColumn: 'tier',
        yColumn: '*',
        yOperation: 'COUNT',
        chartType: 'doughnut',
        title: 'KH theo Tier',
      },
      {
        id: 'preset-leads-source',
        table: 'leads',
        xColumn: 'source_id',
        yColumn: '*',
        yOperation: 'COUNT',
        chartType: 'doughnut',
        title: 'Tỉ lệ Leads theo nguồn',
      },
    ];

    // Add metrics
    for (const m of defaultMetrics) {
      onAddMetric(m);
    }
    // Add charts
    for (const c of defaultCharts) {
      onAddChart(c);
    }
  } finally {
    seeding.value = false;
  }
}

if (import.meta.client) { loadDashboardSettings(); }
</script>

<style scoped>
/* ── KPI Grid ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.kpi-grid.single {
  grid-template-columns: 1fr;
  max-width: 260px;
}
.kpi-add {
  background: rgba(255,255,255,.02);
  border: 2px dashed rgba(148,163,184,.15);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all .2s;
  min-height: 100px;
}
.kpi-add:hover { border-color: rgba(124,58,237,.4); background: rgba(124,58,237,.05); }
.kpi-add-icon { font-size: 1.4rem; color: #7c3aed; }
.kpi-add-text { font-size: .72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }

/* ── Chart Grid ── */
.chart-grid-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 900px) {
  .chart-grid-2col { grid-template-columns: 1fr; }
}

/* ── Buttons ── */
.exec-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.exec-btn {
  padding: 10px 22px;
  border-radius: 10px;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  border: none;
}
.exec-btn.primary {
  background: var(--primary, #7c3aed);
  color: #fff;
}
.exec-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,.4); }
.exec-btn.primary.sm { padding: 7px 16px; font-size: .8rem; }
.exec-btn.preset {
  background: rgba(6,182,212,.12);
  color: #06b6d4;
  border: 1px solid rgba(6,182,212,.3);
}
.exec-btn.preset:hover { background: rgba(6,182,212,.2); }
.exec-btn:disabled { opacity: .5; cursor: wait; }
</style>
