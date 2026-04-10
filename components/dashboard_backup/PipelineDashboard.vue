<template>
  <div class="space-y-6 crm-dashboard-theme">
    
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
    </div>

    <div v-else>
      <!-- Stage KPIs: Phễu chuyển đổi Wealify -->
      <div class="pipeline-grid">
          <div class="pipeline-stage">
              <div class="stage-icon">📥</div>
              <div class="stage-name" data-tooltip="Công thức: COUNT(*) FROM leads WHERE lead_status IN ('Open', 'New', 'Re-engage'). Gom nhóm các Lead mới, mở, hoặc cần tiếp cận lại.">Tiếp cận (NEW)</div>
              <div class="stage-value">{{ getCount('Open') }}</div>
              <div class="stage-count">100% phễu</div>
          </div>
          <div class="pipeline-stage">
              <div class="stage-icon">📞</div>
              <div class="stage-name" data-tooltip="Công thức: COUNT(*) FROM leads WHERE lead_status IN ('Contacted', 'No Response', 'In Progress', 'Follow-up Scheduled'). Gom nhóm các Lead đã liên hệ, đang xử lý, hoặc đang chờ follow-up.">Đã Kết Nối</div>
              <div class="stage-value">{{ getCount('Contacted') }}</div>
              <div class="stage-count">{{ getPercentage('Contacted') }}% chuyển đổi</div>
          </div>
          <div class="pipeline-stage">
              <div class="stage-icon">📝</div>
              <div class="stage-name" data-tooltip="Công thức: COUNT(*) FROM leads WHERE lead_status IN ('Proposal Sent', 'Negotiation'). Gom nhóm Lead đã gửi đề xuất hoặc đang đàm phán.">Gửi Đề Xuất</div>
              <div class="stage-value">{{ getCount('Proposal Sent') }}</div>
              <div class="stage-count">{{ getPercentage('Proposal Sent') }}% tiếp tục</div>
          </div>
          <div class="pipeline-stage">
              <div class="stage-icon">🤝</div>
              <div class="stage-name" data-tooltip="Công thức: COUNT(*) FROM leads WHERE lead_status = 'Won'. Chỉ tính Lead đã chuyển đổi thành công thành khách hàng.">Thành Công (WON)</div>
              <div class="stage-value">{{ getCount('Won') }}</div>
              <div class="stage-count">{{ getPercentage('Won') }}% Win Rate</div>
          </div>
      </div>

      <!-- Funnel bars -->
      <div class="editable-chart">
        <template v-if="chartOverrides['pipeline-funnel']">
          <DashboardDynamicChart
            :chart="chartOverrides['pipeline-funnel']"
            @edit="openChartEditWith('pipeline-funnel', chartOverrides['pipeline-funnel'])"
            @remove="resetChartOverride('pipeline-funnel')"
            :isOverride="true"
          />
        </template>
        <template v-else>
          <div class="funnel-bar-wrap">
              <div class="chart-title" style="margin-bottom:18px" data-tooltip="Biểu đồ thanh ngang: mỗi thanh = (COUNT theo nhóm status) ÷ (Tổng leads) × 100%. 12 trạng thái DB gom vào 6 phễu: Tiếp cận, Xử lý & Kết Nối, Đánh Giá, Đề Xuất & Đàm Phán, Thành Công, Thất Bại.">Phễu chuyển đổi Sales</div>
              
              <div class="funnel-row" v-for="(stage, idx) in funnelStages" :key="stage.key">
                  <div class="funnel-label">{{ stage.label }}</div>
                  <div class="funnel-track">
                      <div class="funnel-fill"
                          :style="{ width: getPercentage(stage.key) + '%', background: stage.color }">
                          {{ getCount(stage.key).toLocaleString() }}
                      </div>
                  </div>
                  <div class="funnel-count" :style="{ color: stage.textColor }">{{ getPercentage(stage.key) }}%</div>
              </div>
          </div>
          <!-- Edit Overlay -->
          <div class="chart-edit-overlay">
            <button class="chart-edit-btn" @click.stop="openChartEdit('pipeline-funnel')" title="Chỉnh sửa / Cài đặt biểu đồ">⚙</button>
            <button class="chart-reset-btn" v-if="chartOverrides['pipeline-funnel']" @click.stop="resetChartOverride('pipeline-funnel')" title="Khôi phục mặc định gốc">↩</button>
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
import { useChartOverrides } from '~/composables/useChartOverrides';

const { getPipelineAnalytics } = useDashboard();

const data = ref<any>(null);
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
} = useChartOverrides('pipeline');

loadCustomCharts();
loadChartOverrides();

onMounted(async () => {
    try {
        data.value = await getPipelineAnalytics();
    } catch (e) {
        console.error('Failed to load pipeline analytics', e);
    } finally {
        loading.value = false;
    }
});

const funnel = computed(() => data.value?.funnel || []);

const getCount = (status: string) => {
    const searchKey = status.toUpperCase();
    let total = 0;
    funnel.value.forEach((i: any) => {
        if (!i.lead_status) return;
        const dbStatus = String(i.lead_status).toUpperCase();
        
        if (searchKey === 'OPEN' && ['NEW', 'OPEN', 'RE-ENGAGE'].includes(dbStatus)) total += Number(i.count);
        else if (searchKey === 'CONTACTED' && ['CONTACTED', 'NO RESPONSE', 'IN PROGRESS', 'FOLLOW-UP SCHEDULED'].includes(dbStatus)) total += Number(i.count);
        else if (searchKey === 'QUALIFIED' && ['QUALIFIED', 'NOT QUALIFIED'].includes(dbStatus)) total += Number(i.count);
        else if (searchKey === 'PROPOSAL SENT' && ['PROPOSAL SENT', 'NEGOTIATION'].includes(dbStatus)) total += Number(i.count);
        else if (searchKey === 'WON' && ['WON'].includes(dbStatus)) total += Number(i.count);
        else if (searchKey === 'LOST' && ['LOST'].includes(dbStatus)) total += Number(i.count);
    });
    return total;
};

const totalLeads = computed(() => {
    return funnel.value.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;
});

const getPercentage = (status: string) => {
    const count = getCount(status);
    return Math.round((count / totalLeads.value) * 100);
};

const funnelStages = [
    { key: 'Open', label: '1. Tiếp cận', color: 'linear-gradient(90deg,#7c3aed,#5b21b6)', textColor: 'var(--purple-light)' },
    { key: 'Contacted', label: '2. Xử lý & Kết Nối', color: 'linear-gradient(90deg,#2563eb,#1e40af)', textColor: 'var(--blue-light)' },
    { key: 'Qualified', label: '3. Đánh Giá', color: 'linear-gradient(90deg,#f59e0b,#b45309)', textColor: 'var(--gold)' },
    { key: 'Proposal Sent', label: '4. Đề Xuất & Đàm Phán', color: 'linear-gradient(90deg,#06b6d4,#0284c7)', textColor: 'var(--cyan)' },
    { key: 'Won', label: '5. Thành Công', color: 'linear-gradient(90deg,#22c55e,#15803d)', textColor: 'var(--green)' },
    { key: 'Lost', label: '6. Thất Bại', color: 'linear-gradient(90deg,#ef4444,#dc2626)', textColor: 'var(--red)' }
];
</script>

<style scoped>
/* Scoped styles will be inherited from the parent index.vue's .crm-dashboard-theme wrapper */
</style>
