<template>
  <div class="space-y-6 crm-dashboard-theme p-4 min-h-[500px]">
    <!-- Custom Metrics Wrapper -->
    <div class="flex flex-wrap gap-4 items-start">
      <DashboardDynamicKpi
        v-for="m in customMetrics" :key="m.id"
        :metric="m"
        @edit="editMetric"
        @remove="removeMetric"
      />
      <!-- Nút tạo chỉ số tùy chỉnh -->
      <div 
        class="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
        style="min-width: 280px; min-height: 120px; border-color: rgba(255,255,255,0.1); background: var(--bg2)"
        @click="editMetric(null)"
      >
        <span class="text-2xl mb-2" style="color: var(--text-dim)">+</span>
        <span class="font-medium" style="color: var(--text-main)">Tạo chỉ số tùy chỉnh</span>
      </div>
    </div>

    <!-- Blank Canvas: No default layout -->
    <div v-if="customCharts.length === 0" class="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border)] rounded-xl" style="background: var(--bg3)">
      <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">📊</div>
      <h3 class="text-xl font-bold" style="color: var(--text-main); margin-bottom: 8px;">Workspace Trống</h3>
      <p style="color: var(--text-dim); margin-bottom: 24px; max-w: 400px; margin-left: auto; margin-right: auto;">
        Khu vực này đã được dọn sạch hoàn toàn. Bạn có thể tự do thêm các biểu đồ tùy chỉnh để xây dựng luồng phân tích riêng.
      </p>
      <button class="px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg"
              style="background: var(--primary); color: white; margin: 0 auto; transition: 0.2s"
              @click="openChartEdit('')">
        ＋ Thêm biểu đồ đầu tiên
      </button>
    </div>

    <!-- Custom Charts Area -->
    <div class="mt-8 space-y-6" v-if="customCharts.length > 0">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-[var(--text-main)]">Biểu đồ đang hiển thị</h3>
        <button class="px-4 py-2 rounded-lg text-sm font-medium" style="background: var(--primary); color: white;" @click="openChartEdit('')">
          ＋ Thêm biểu đồ
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardDynamicChart
          v-for="chart in customCharts" :key="chart.id"
          :chart="chart"
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

    <!-- MetricBuilder Modal -->
    <DashboardMetricBuilder
      :show="showBuilder"
      :editMetric="editingMetric"
      @close="showBuilder = false; editingMetric = null"
      @add="onAddMetric"
      @update="onUpdateMetric"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChartOverrides } from '~/composables/useChartOverrides';

const {
  showChartBuilder, editingChart, editingChartSlot, customCharts, chartOverrides, customMetrics,
  loadDashboardSettings, onAddChart, onUpdateChart, onAddMetric, onUpdateMetric, removeMetric,
  editChart, removeChart, openChartEdit, openChartEditWith, resetChartOverride
} = useChartOverrides('leads');

const showBuilder = ref(false);
const editingMetric = ref<any>(null);

function editMetric(metric: any) {
  editingMetric.value = { ...metric };
  showBuilder.value = true;
}

if (import.meta.client) { loadDashboardSettings(); }
</script>

<style scoped>
</style>
