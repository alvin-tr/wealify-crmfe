<template>
  <div class="space-y-6 crm-dashboard-theme">
    
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
    </div>

    <div v-else>
      <div class="kpi-row-3">
          <div class="kpi">
              <div class="kpi-label" data-tooltip="Công thức: COUNT(*) FROM leads. Tổng số leads từ tất cả nguồn (quảng cáo, sự kiện, giới thiệu...) đã được nhập vào hệ thống.">Tổng Leads</div>
              <div class="kpi-value">{{ stats?.total_leads?.toLocaleString() || 0 }}</div>
              <div class="kpi-mom up">Tất cả thời gian</div>
              <div class="kpi-spark">🎯</div>
          </div>
          <div class="kpi">
              <div class="kpi-label" data-tooltip="Công thức: COUNT(*) FROM leads WHERE email IN (SELECT email FROM customers). Lead có email trùng với bảng customers = đã chuyển đổi thành khách hàng.">Leads đã chuyển đổi</div>
              <div class="kpi-value">{{ stats?.converted_leads?.toLocaleString() || 0 }}</div>
              <div class="kpi-mom up">Thành khách hàng</div>
              <div class="kpi-spark">✅</div>
          </div>
          <div class="kpi">
              <div class="kpi-label" data-tooltip="Công thức: (Leads đã chuyển đổi ÷ Tổng Leads) × 100. Tỷ lệ phần trăm lead thành công trở thành khách hàng.">Tỷ lệ chuyển đổi</div>
              <div class="kpi-value">{{ stats?.conversion_rate || 0 }}%</div>
              <div class="kpi-mom up">Tính trên tổng</div>
              <div class="kpi-spark">📈</div>
          </div>
      </div>

      <div class="editable-chart">
        <template v-if="chartOverrides['leads-table']">
          <DashboardDynamicChart
            :chart="chartOverrides['leads-table']"
            @edit="openChartEditWith('leads-table', chartOverrides['leads-table'])"
            @remove="resetChartOverride('leads-table')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="data-table-card">
              <div class="table-toolbar">
                  <div class="chart-title" style="flex-shrink:0">🎯 Danh sách Leads Mới Nhất</div>
              </div>
              <table class="crm-table">
                  <thead>
                      <tr>
                          <th>Tên</th>
                          <th>Email</th>
                          <th>Số điện thoại</th>
                          <th>Nguồn</th>
                          <th>Ngày đăng ký</th>
                          <th>Nhân viên</th>
                          <th>Trạng thái</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="lead in recentLeads" :key="lead.id">
                          <td class="font-medium text-[var(--text-main)]">{{ lead.full_name }}</td>
                          <td class="text-[var(--text-muted)]">{{ lead.email || '-' }}</td>
                          <td class="text-[var(--text-muted)]">{{ lead.phone || '-' }}</td>
                          <td>
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style="background:var(--bg-card);color:var(--text-main);border:1px solid var(--border-color)">
                                  {{ lead.source_name || '-' }}
                              </span>
                          </td>
                          <td class="text-[var(--text-muted)]">{{ new Date(lead.created_at).toLocaleDateString('vi-VN') }}</td>
                          <td>
                              <div class="flex items-center gap-2">
                                  <UIcon v-if="lead.owner_name" name="i-heroicons-user-circle" class="w-4 h-4 text-[var(--text-muted)]" />
                                  <span class="text-sm text-[var(--text-main)]">{{ lead.owner_name || 'Chưa chia' }}</span>
                              </div>
                          </td>
                          <td>
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" 
                                :class="{
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': lead.status_name === 'Won',
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': lead.status_name === 'Lost',
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': !['Won', 'Lost'].includes(lead.status_name)
                                }">
                                  {{ lead.status_name || '-' }}
                              </span>
                          </td>
                      </tr>
                      <tr v-if="recentLeads.length === 0">
                          <td colspan="7" class="text-center py-4 text-[var(--text-muted)]">Chưa có leads nào</td>
                      </tr>
                  </tbody>
              </table>
          </div>
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('leads-table')" title="Chỉnh sửa / Cài đặt biểu đồ">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['leads-table']" @click.stop="resetChartOverride('leads-table')" title="Khôi phục mặc định gốc">↩</button>
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
import { ref, onMounted, computed } from 'vue';
import { useLeads } from '@/composables/useLeads';
import { useChartOverrides } from '~/composables/useChartOverrides';

const { fetchLeads, fetchLeadStatistics } = useLeads();

const leads = ref<any[]>([]);
const stats = ref<any>(null);
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
} = useChartOverrides('leads');

loadCustomCharts();
loadChartOverrides();

onMounted(async () => {
    try {
        const [leadsData, statsResponse] = await Promise.all([
            fetchLeads(),
            fetchLeadStatistics()
        ]);
        leads.value = leadsData || [];
        stats.value = statsResponse?.data || null;
    } catch (e) {
        console.error('Failed to load leads analytics', e);
    } finally {
        loading.value = false;
    }
});

const recentLeads = computed(() => {
    return leads.value.slice(0, 5);
});
</script>

<style scoped>
/* Scoped styles will be inherited from the parent index.vue's .crm-dashboard-theme wrapper */
</style>
