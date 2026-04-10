<template>
  <div class="space-y-6 crm-dashboard-theme">
    
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
    </div>

    <div v-else>
        <div class="kpi-row" style="grid-template-columns:repeat(4,1fr)">
            <div class="kpi">
                <div class="kpi-label" data-tooltip="Công thức: COUNT(*) FROM sales_users. Tổng số nhân viên sale đã đăng ký trong hệ thống.">Tổng nhân viên sale</div>
                <div class="kpi-value">{{ agents.length }}</div>
                <div class="kpi-mom up">▲ Active</div>
            </div>
            <div class="kpi">
                <div class="kpi-label" data-tooltip="Công thức: SUM(total_assigned của tất cả NV) ÷ COUNT(NV). Trung bình số lượng KH được phân bổ cho mỗi nhân viên sale.">TB KH được gán/NV</div>
                <div class="kpi-value">{{ avgAssigned }}</div>
                <div class="kpi-mom neutral">— Phân bổ API</div>
            </div>
            <div class="kpi">
                <div class="kpi-label" data-tooltip="Công thức: SUM(revenue_30d của tất cả NV) ÷ COUNT(NV). Revenue_30d = SUM(volume_last_30d × tier_margin) cho các KH được gán cho NV đó.">TB Doanh thu/NV (30d)</div>
                <div class="kpi-value">{{ formatCurrency(avgRevenue) }}</div>
                <div class="kpi-mom up">▲ Thực tế VNĐ</div>
            </div>
            <div class="kpi">
                <div class="kpi-label" data-tooltip="Công thức: NV có SUM(volume_last_30d × tier_margin) cao nhất. Xếp hạng theo tổng doanh thu 30 ngày qua.">Top performer</div>
                <div class="kpi-value" style="font-size:1rem">{{ topAgent?.full_name || 'N/A' }}</div>
                <div class="kpi-mom up" style="color:var(--teal)">🏆 {{ formatCurrency(topAgent?.revenue_30d || 0) }}</div>
            </div>
        </div>

        <div class="editable-chart" style="margin-top: 24px;">
          <template v-if="chartOverrides['agents-table']">
            <DashboardDynamicChart
              :chart="chartOverrides['agents-table']"
              @edit="openChartEditWith('agents-table', chartOverrides['agents-table'])"
              @remove="resetChartOverride('agents-table')"
              :isOverride="true"
            />
          </template>
          <template v-else>
            <div class="table-card h-full">
                <div class="chart-title" style="margin-bottom:12px">Bảng xếp hạng nhân viên sale (Top 10)</div>
                <div style="overflow-x:auto">
                  <table class="agents-big-table" style="width: 100%; border-collapse: collapse;">
                      <thead>
                          <tr style="text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-dim);">
                              <th style="padding: 12px 8px;">Rank</th>
                              <th style="padding: 12px 8px;">Nhân viên</th>
                              <th style="padding: 12px 8px;">Phòng ban</th>
                              <th style="padding: 12px 8px;">Assigned</th>
                              <th style="padding: 12px 8px;">Win Deals</th>
                              <th style="padding: 12px 8px;">Doanh thu (30d)</th>
                              <th style="padding: 12px 8px;">Tổng Doanh thu</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(agent, idx) in agents.slice(0, 10)" :key="agent.id" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                              <td style="padding: 12px 8px;">
                                  <span v-if="idx === 0" style="font-size:1.2rem">🥇</span>
                                  <span v-else-if="idx === 1" style="font-size:1.2rem">🥈</span>
                                  <span v-else-if="idx === 2" style="font-size:1.2rem">🥉</span>
                                  <span v-else>#{{ idx + 1 }}</span>
                              </td>
                              <td style="padding: 12px 8px; font-weight: 500;">
                                <div class="flex items-center gap-2">
                                    <UAvatar :src="agent.avatar_url" :alt="agent.full_name" size="sm" />
                                    <div>
                                        <div>{{ agent.full_name }}</div>
                                        <div style="color:var(--text-dim);font-size:0.75rem;font-weight:normal">{{ agent.email }}</div>
                                    </div>
                                </div>
                              </td>
                              <td style="padding: 12px 8px;">
                                  <span v-if="agent.department === 'VIP'" style="color:var(--purple-light); background: rgba(124, 58, 237, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem">VIP</span>
                                  <span v-else style="color:var(--blue-light); background: rgba(37, 99, 235, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem">Retail</span>
                              </td>
                              <td style="padding: 12px 8px;">{{ agent.total_assigned }} KH</td>
                              <td style="padding: 12px 8px; font-weight: bold; color: var(--cyan)">{{ agent.won_deals }} Deal</td>
                              <td style="padding: 12px 8px; font-weight: bold; color: var(--green)">{{ formatCurrency(agent.revenue_30d) }}</td>
                              <td style="padding: 12px 8px;">{{ formatCurrency(agent.total_revenue) }}</td>
                          </tr>
                      </tbody>
                  </table>
                </div>
            </div>
            <div class="chart-edit-overlay">
              <button class="chart-edit-btn" @click.stop="openChartEdit('agents-table')" title="Chỉnh sửa">⚙</button>
              <button class="chart-reset-btn" v-if="chartOverrides['agents-table']" @click.stop="resetChartOverride('agents-table')">↩</button>
            </div>
          </template>
        </div>

        <div class="charts-grid mt-6">
          <div class="editable-chart">
            <template v-if="chartOverrides['agents-revenue-bar-chart']">
              <DashboardDynamicChart
                :chart="chartOverrides['agents-revenue-bar-chart']"
                @edit="openChartEditWith('agents-revenue-bar-chart', chartOverrides['agents-revenue-bar-chart'])"
                @remove="resetChartOverride('agents-revenue-bar-chart')"
                :isOverride="true"
              />
            </template>
            <template v-else>
              <div class="chart-card">
                  <div class="chart-title">So sánh doanh thu nhân viên 30 Ngày qua (VNĐ)</div>
                  <div class="chart-wrap" style="height:250px; position:relative;">
                      <Bar v-if="barChartData" :data="barChartData" :options="barOptions" />
                  </div>
              </div>
              <div class="chart-edit-overlay">
                <button class="chart-edit-btn" @click.stop="openChartEdit('agents-revenue-bar-chart')" title="Chỉnh sửa">⚙</button>
                <button class="chart-reset-btn" v-if="chartOverrides['agents-revenue-bar-chart']" @click.stop="resetChartOverride('agents-revenue-bar-chart')">↩</button>
              </div>
            </template>
          </div>

          <div class="editable-chart">
            <template v-if="chartOverrides['agents-radar-chart']">
              <DashboardDynamicChart
                :chart="chartOverrides['agents-radar-chart']"
                @edit="openChartEditWith('agents-radar-chart', chartOverrides['agents-radar-chart'])"
                @remove="resetChartOverride('agents-radar-chart')"
                :isOverride="true"
              />
            </template>
            <template v-else>
              <div class="chart-card">
                  <div class="chart-title">📡 Hiệu suất nhân viên — Radar Profile</div>
                  <div class="chart-sub" style="font-size:.7rem;color:var(--text-dim);margin-top:2px;margin-bottom:10px">
                      So sánh Top 3 Sales: Assigned vs Won vs Revenue
                  </div>
                  <div class="chart-wrap" style="height:280px; position:relative;">
                      <Radar v-if="radarChartData" :data="radarChartData" :options="radarOptions" />
                  </div>
              </div>
              <div class="chart-edit-overlay">
                <button class="chart-edit-btn" @click.stop="openChartEdit('agents-radar-chart')" title="Chỉnh sửa">⚙</button>
                <button class="chart-reset-btn" v-if="chartOverrides['agents-radar-chart']" @click.stop="resetChartOverride('agents-radar-chart')">↩</button>
              </div>
            </template>
          </div>
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
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Radar } from 'vue-chartjs';
import { useChartOverrides } from '~/composables/useChartOverrides';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const { getAgentsAnalytics } = useDashboard();

const data = ref<any[]>([]);
const loading = ref(true);

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
} = useChartOverrides('agents');

loadCustomCharts();
loadChartOverrides();

onMounted(async () => {
    try {
        data.value = await getAgentsAnalytics();
    } catch (e) {
        console.error('Failed to load agents analytics', e);
    } finally {
        loading.value = false;
    }
});

const formatCurrency = (val: number) => {
    if (!val) return '0 ₫';
    if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' Tỷ';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Tr';
    return val.toLocaleString() + ' ₫';
};

const agents = computed(() => data.value || []);
const topAgent = computed(() => agents.value.length > 0 ? agents.value[0] : null);

const avgAssigned = computed(() => {
    if (!agents.value.length) return 0;
    const sum = agents.value.reduce((acc, curr) => acc + curr.total_assigned, 0);
    return Math.round(sum / agents.value.length);
});

const avgRevenue = computed(() => {
    if (!agents.value.length) return 0;
    const sum = agents.value.reduce((acc, curr) => acc + Number(curr.revenue_30d), 0);
    return Math.round(sum / agents.value.length);
});

// Bar Chart
const barChartData = computed(() => {
    if (!agents.value.length) return null;
    const top10 = agents.value.slice(0, 10);
    return {
        labels: top10.map(a => a.full_name),
        datasets: [{
            label: 'Doanh Thu 30 Ngày',
            data: top10.map(a => Number(a.revenue_30d)),
            backgroundColor: '#06b6d4',
            borderRadius: 4
        }]
    };
});

// Radar Chart Data formatting
const radarChartData = computed(() => {
    if (agents.value.length < 3) return null;
    const top3 = agents.value.slice(0, 3);
    
    // Normalize data (0-100 scale approach based on max values)
    const maxAssigned = Math.max(...top3.map(a => a.total_assigned)) || 1;
    const maxWon = Math.max(...top3.map(a => a.won_deals)) || 1;
    const maxRev = Math.max(...top3.map(a => Number(a.total_revenue))) || 1;
    const maxRev30 = Math.max(...top3.map(a => Number(a.revenue_30d))) || 1;

    const colors = [
        { border: '#7c3aed', bg: 'rgba(124, 58, 237, 0.2)' },
        { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.2)' },
        { border: '#14b8a6', bg: 'rgba(20, 184, 166, 0.2)' }
    ];

    return {
        labels: ['Assigned Limit', 'Won Deals', 'Revenue 30d', 'Lifetime Revenue'],
        datasets: top3.map((a, idx) => ({
            label: a.full_name,
            data: [
                Math.round((a.total_assigned / maxAssigned) * 100),
                Math.round((a.won_deals / maxWon) * 100),
                Math.round((Number(a.revenue_30d) / maxRev30) * 100),
                Math.round((Number(a.total_revenue) / maxRev) * 100)
            ],
            backgroundColor: colors[idx].bg,
            borderColor: colors[idx].border,
            pointBackgroundColor: colors[idx].border,
            borderWidth: 2
        }))
    };
});

const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } }
    }
};

const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            pointLabels: { color: 'rgba(255, 255, 255, 0.6)' },
            ticks: { display: false }
        }
    },
    plugins: {
        legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } }
    }
};
</script>

<style scoped>
/* Scoped styles inherited from index.vue */
</style>
