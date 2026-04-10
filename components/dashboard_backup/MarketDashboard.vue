<template>
  <div class="space-y-6 crm-dashboard-theme">
    
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
    </div>

    <div v-else>
      <div class="market-stats" style="margin-bottom: 24px;">
          <div class="kpi">
              <div class="kpi-label" data-tooltip="Công thức: Nhóm tuổi có COUNT(*) cao nhất trong GROUP BY age_group FROM customers. Dữ liệu từ bảng customers.">Độ tuổi KH phổ biến nhất</div>
              <div class="kpi-value" style="font-size:1.2rem">{{ mostCommonAge }}</div>
              <div class="kpi-mom up">▲ Chiếm đa số</div>
          </div>
          <div class="kpi">
              <div class="kpi-label" data-tooltip="Công thức: Nghề nghiệp có COUNT(*) cao nhất trong GROUP BY occupation FROM customers. Dữ liệu từ bảng customers.">Nghề nghiệp phổ biến nhất</div>
              <div class="kpi-value" style="font-size:1.2rem">{{ mostCommonOcc }}</div>
              <div class="kpi-mom up">▲ Target chính</div>
          </div>
          <div class="kpi">
              <div class="kpi-label" data-tooltip="Công thức: Thành phố có COUNT(*) cao nhất trong GROUP BY city FROM customers. Dữ liệu từ bảng customers.">TP Tập trung đông nhất</div>
              <div class="kpi-value" style="font-size:1.2rem">{{ mostCommonCity }}</div>
              <div class="kpi-mom up">▲ Vùng trọng điểm</div>
          </div>
      </div>

      <div class="charts-grid">
          <!-- KH mới theo nhóm tuổi -->
          <div class="editable-chart">
            <template v-if="chartOverrides['market-age-chart']">
              <DashboardDynamicChart
                :chart="chartOverrides['market-age-chart']"
                @edit="openChartEditWith('market-age-chart', chartOverrides['market-age-chart'])"
                @remove="resetChartOverride('market-age-chart')"
                :isOverride="true"
              />
            </template>
            <template v-else>
              <div class="chart-card">
                  <div class="chart-title">KH mới theo nhóm tuổi</div>
                  <div class="chart-wrap" style="height:250px; position: relative;">
                      <Bar v-if="ageChartData" :data="ageChartData" :options="barOptions" />
                  </div>
              </div>
              <div class="chart-edit-overlay">
                <button class="chart-edit-btn" @click.stop="openChartEdit('market-age-chart')" title="Chỉnh sửa">⚙</button>
                <button class="chart-reset-btn" v-if="chartOverrides['market-age-chart']" @click.stop="resetChartOverride('market-age-chart')">↩</button>
              </div>
            </template>
          </div>
          
          <!-- Phân khúc KH theo nghề nghiệp -->
          <div class="editable-chart">
            <template v-if="chartOverrides['market-occ-chart']">
              <DashboardDynamicChart
                :chart="chartOverrides['market-occ-chart']"
                @edit="openChartEditWith('market-occ-chart', chartOverrides['market-occ-chart'])"
                @remove="resetChartOverride('market-occ-chart')"
                :isOverride="true"
              />
            </template>
            <template v-else>
              <div class="chart-card">
                  <div class="chart-title">Phân khúc KH theo nghề nghiệp</div>
                  <div class="chart-wrap" style="height:250px;display:flex;gap:16px;align-items:center">
                      <div style="height: 220px; width: 220px; position: relative;">
                         <Doughnut v-if="occChartData" :data="occChartData" :options="pieOptions" />
                      </div>
                      <div class="chart-legend" style="flex-direction:column;gap:10px">
                          <div class="legend-item" v-for="(item, idx) in occDist" :key="idx">
                              <div class="legend-dot" :style="{ background: pieColors[Number(idx) % pieColors.length] || '#ccc' }"></div>
                              {{ item.occupation }} ({{ Math.round((item.count / totalOcc) * 100) }}%)
                          </div>
                      </div>
                  </div>
              </div>
              <div class="chart-edit-overlay">
                <button class="chart-edit-btn" @click.stop="openChartEdit('market-occ-chart')" title="Chỉnh sửa">⚙</button>
                <button class="chart-reset-btn" v-if="chartOverrides['market-occ-chart']" @click.stop="resetChartOverride('market-occ-chart')">↩</button>
              </div>
            </template>
          </div>
      </div>

      <!-- Xu hướng KH mới & Doanh thu YoY -->
      <div class="editable-chart" style="margin-top: 24px;">
        <template v-if="chartOverrides['market-yoy-chart']">
          <DashboardDynamicChart
            :chart="chartOverrides['market-yoy-chart']"
            @edit="openChartEditWith('market-yoy-chart', chartOverrides['market-yoy-chart'])"
            @remove="resetChartOverride('market-yoy-chart')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="chart-card full">
              <div class="chart-title">Xu hướng KH mới &amp; Doanh thu YoY</div>
              <div class="chart-wrap" style="height:250px; position: relative;">
                  <Line v-if="yoyChartData" :data="yoyChartData" :options="lineOptions" />
              </div>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('market-yoy-chart')" title="Chỉnh sửa">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['market-yoy-chart']" @click.stop="resetChartOverride('market-yoy-chart')">↩</button>
          </div>
        </template>
      </div>

      <!-- City Distribution -->
      <div class="editable-chart" style="margin-top: 24px;">
        <template v-if="chartOverrides['market-city-chart']">
          <DashboardDynamicChart
            :chart="chartOverrides['market-city-chart']"
            @edit="openChartEditWith('market-city-chart', chartOverrides['market-city-chart'])"
            @remove="resetChartOverride('market-city-chart')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="chart-card full">
              <div class="chart-header">
                  <div>
                      <div class="chart-title">📍 Phân bổ KH theo Tỉnh / Thành phố</div>
                      <div class="chart-sub">Khu vực đăng ký của khách hàng</div>
                  </div>
              </div>
              <div class="chart-wrap" style="height:280px;display:flex;gap:24px;align-items:center">
                  <div style="height: 280px; width: 280px; position: relative;">
                     <Pie v-if="cityChartData" :data="cityChartData" :options="pieOptions" />
                  </div>
                  <div class="chart-legend" style="flex-direction:column;gap:10px; flex-wrap: wrap; max-height: 250px;">
                      <div class="legend-item" v-for="(item, idx) in cityDist" :key="idx">
                          <div class="legend-dot" :style="{ background: pieColors[Number(idx) % pieColors.length] || '#ccc' }"></div>
                          {{ item.city }} ({{ Math.round((item.count / totalCity) * 100) }}%)
                      </div>
                  </div>
              </div>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('market-city-chart')" title="Chỉnh sửa">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['market-city-chart']" @click.stop="resetChartOverride('market-city-chart')">↩</button>
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
</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'vue-chartjs';
import { useChartOverrides } from '~/composables/useChartOverrides';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement
);

const { getMarketAnalytics } = useDashboard();

const data = ref<any>(null);
const loading = ref(true);

const pieColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e', '#ec4899', '#14b8a6', '#94a3b8'];

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
} = useChartOverrides('market');

loadCustomCharts();
loadChartOverrides();

onMounted(async () => {
    try {
        data.value = await getMarketAnalytics();
    } catch (e) {
        console.error('Failed to load market analytics', e);
    } finally {
        loading.value = false;
    }
});

// KPIs
const mostCommonAge = computed(() => data.value?.ageDistribution?.[0]?.age_group || 'N/A');
const mostCommonOcc = computed(() => data.value?.occupationDistribution?.[0]?.occupation || 'N/A');
const mostCommonCity = computed(() => data.value?.cityDistribution?.[0]?.city || 'N/A');

// Age Bar Chart
const ageChartData = computed(() => {
    if (!data.value?.ageDistribution) return null;
    return {
        labels: data.value.ageDistribution.map((d: any) => d.age_group),
        datasets: [{
            label: 'Khách hàng',
            data: data.value.ageDistribution.map((d: any) => d.count),
            backgroundColor: '#8b5cf6',
            borderRadius: 4
        }]
    };
});

// Occupation Doughnut
const occDist = computed(() => data.value?.occupationDistribution || []);
const totalOcc = computed(() => occDist.value.reduce((acc: number, curr: any) => acc + curr.count, 0));
const occChartData = computed(() => {
    if (!data.value?.occupationDistribution) return null;
    return {
        labels: data.value.occupationDistribution.map((d: any) => d.occupation),
        datasets: [{
            data: data.value.occupationDistribution.map((d: any) => d.count),
            backgroundColor: pieColors,
            borderWidth: 0
        }]
    };
});

// City Pie
const cityDist = computed(() => data.value?.cityDistribution || []);
const totalCity = computed(() => cityDist.value.reduce((acc: number, curr: any) => acc + curr.count, 0));
const cityChartData = computed(() => {
    if (!data.value?.cityDistribution) return null;
    return {
        labels: data.value.cityDistribution.map((d: any) => d.city),
        datasets: [{
            data: data.value.cityDistribution.map((d: any) => d.count),
            backgroundColor: pieColors,
            borderWidth: 0
        }]
    };
});

// YoY Line
const yoyChartData = computed(() => {
    if (!data.value?.yoyTrends) return null;
    return {
        labels: data.value.yoyTrends.map((d: any) => d.month),
        datasets: [{
            label: 'Tăng trưởng KH mới',
            data: data.value.yoyTrends.map((d: any) => d.new_customers),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };
});

// Shared Chart Options
const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        x: { grid: { display: false } }
    }
};

const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
};

const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        x: { grid: { display: false } }
    }
};
</script>

<style scoped>
/* Scoped styles inherited from index.vue */
</style>
