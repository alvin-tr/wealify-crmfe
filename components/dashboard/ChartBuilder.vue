<template>
  <div v-if="show" class="chart-builder-overlay" @click.self="$emit('close')">
    <div class="chart-builder-modal">
      <div class="cb-header">
        <h3>📊 Tạo biểu đồ mới</h3>
        <button class="cb-close" @click="$emit('close')">✕</button>
      </div>

      <div class="cb-body">
        <!-- Step 1: Table -->
        <div class="cb-field">
          <label>1. Chọn bảng dữ liệu</label>
          <select v-model="form.table" @change="onTableChange" class="cb-select">
            <option value="">— Chọn bảng —</option>
            <option v-for="t in tables" :key="t.table" :value="t.table">{{ t.alias }} ({{ t.table }})</option>
          </select>
        </div>

        <!-- Step 2: X-axis -->
        <div class="cb-field" v-if="form.table">
          <label>2. Trục X (phân nhóm theo)</label>
          <select v-model="form.xColumn" class="cb-select">
            <option value="">— Chọn cột —</option>
            <option v-for="c in xColumns" :key="c.column" :value="c.column">{{ c.label }} ({{ c.column }})</option>
          </select>
        </div>

        <!-- Step 2½: Time Grouping (when X is a date column) -->
        <div class="cb-field" v-if="isDateColumn">
          <label>Nhóm theo thời gian</label>
          <div class="cb-time-group">
            <button v-for="tg in timeGroupings" :key="tg.value"
              :class="['cb-tg-btn', { active: form.timeGrouping === tg.value }]"
              @click="form.timeGrouping = form.timeGrouping === tg.value ? '' : tg.value">{{ tg.label }}</button>
          </div>
        </div>
        
        <div class="cb-field" v-if="form.timeGrouping">
          <label>Giới hạn phân nhóm (Hiển thị N nhóm gần nhất)</label>
          <input type="number" v-model="form.limit" class="cb-input sm" placeholder="VD: 6 (6 kỳ gần nhất)" min="1" max="100" />
        </div>

        <!-- Step 3: Y-axis -->
        <div class="cb-field" v-if="form.xColumn">
          <label>3. Trục Y (giá trị)</label>
          <div class="cb-y-row">
            <select v-model="form.yColumn" class="cb-select sm">
              <option v-for="c in yColumns" :key="c.column" :value="c.column">{{ c.label }}</option>
            </select>
            <div class="cb-ops">
              <button v-for="op in ['COUNT','SUM','AVG','MIN','MAX']" :key="op"
                :class="['cb-op-btn', { active: form.yOperation === op }]"
                @click="form.yOperation = op">{{ op }}</button>
            </div>
          </div>
        </div>

        <!-- Step 3½: Second Y-axis (combo chart) -->
        <div class="cb-field" v-if="form.yOperation">
          <label class="cb-toggle-label">
            <input type="checkbox" v-model="form.enableY2" />
            <span>Thêm trục Y thứ 2 (biểu đồ kết hợp)</span>
          </label>
          <div v-if="form.enableY2" class="cb-y-row" style="margin-top: 8px">
            <select v-model="form.y2Column" class="cb-select sm">
              <option v-for="c in yColumns" :key="c.column" :value="c.column">{{ c.label }}</option>
            </select>
            <div class="cb-ops">
              <button v-for="op in ['COUNT','SUM','AVG']" :key="'y2-'+op"
                :class="['cb-op-btn', { active: form.y2Operation === op }]"
                @click="form.y2Operation = op">{{ op }}</button>
            </div>
          </div>
        </div>

        <!-- Step 4: Chart type -->
        <div class="cb-field" v-if="form.yOperation">
          <label>4. Loại biểu đồ</label>
          <div class="cb-chart-types">
            <button v-for="ct in availableChartTypes" :key="ct.value"
              :class="['cb-type-btn', { active: form.chartType === ct.value }]"
              @click="form.chartType = ct.value">
              <span class="cb-type-icon">{{ ct.icon }}</span>
              <span class="cb-type-label">{{ ct.label }}</span>
            </button>
          </div>
        </div>

        <!-- Step 5: Optional filter -->
        <div class="cb-field" v-if="form.chartType">
          <label>5. Lọc dữ liệu (tùy chọn)</label>
          <div class="cb-filter-row">
            <select v-model="form.filterColumn" class="cb-select sm">
              <option value="">Không lọc</option>
              <option v-for="c in filterColumns" :key="c.column" :value="c.column">{{ c.label }}</option>
            </select>
            <select v-if="form.filterColumn" v-model="form.filterOperator" class="cb-select xs">
              <option v-for="op in operators" :key="op" :value="op">{{ op }}</option>
            </select>
            <input v-if="form.filterColumn" v-model="form.filterValue" class="cb-input" placeholder="Giá trị..." />
          </div>
        </div>

        <!-- Step 6: Label -->
        <div class="cb-field" v-if="form.chartType">
          <label>6. Tên biểu đồ</label>
          <input v-model="form.title" class="cb-input full" placeholder="VD: Phân bổ KH theo tier" />
        </div>

        <!-- Preview -->
        <div class="cb-preview" v-if="form.xColumn && form.yOperation && form.chartType">
          <div class="cb-preview-header">
            <div class="cb-preview-label">Preview</div>
            <button class="cb-test-btn" @click="testChart" :disabled="testing">
              {{ testing ? '⏳ Đang tải...' : '🧪 Xem thử' }}
            </button>
          </div>
          <div class="cb-preview-formula">
            <code>
              {{ form.yOperation }}({{ currentTable?.columns.find((c: any) => c.column === form.yColumn)?.label || form.yColumn }}) 
              GROUP BY {{ currentTable?.columns.find((c: any) => c.column === form.xColumn)?.label || form.xColumn }}
              {{ form.timeGrouping ? ' [' + timeGroupings.find(t => t.value === form.timeGrouping)?.label + (form.limit ? ' - ' + form.limit + ' kỳ gần nhất' : '') + ']' : '' }}
              {{ form.enableY2 ? ' + ' + form.y2Operation + '(' + (currentTable?.columns.find((c: any) => c.column === form.y2Column)?.label || form.y2Column) + ')' : '' }}
            </code>
          </div>
          <div v-if="previewData" class="cb-preview-chart" style="height:220px">
            <component :is="chartComponent" :data="previewChartData" :options="previewOptions" />
          </div>
          <div v-if="previewError" class="cb-preview-error">❌ {{ previewError }}</div>
        </div>
      </div>

      <div class="cb-footer">
        <button class="cb-cancel" @click="$emit('close')">Hủy</button>
        <button class="cb-submit" @click="addChart" :disabled="!canSubmit">
          ➕ Thêm vào Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const props = defineProps<{ show: boolean; editChart?: any }>();
const emit = defineEmits(['close', 'add', 'update']);

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:4000';
const tokenCookie = useCookie('crm_auth_token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${tokenCookie.value}`,
});

interface TableInfo { table: string; alias: string; columns: { column: string; label: string }[] }

const tables = ref<TableInfo[]>([]);
const operators = ref<string[]>([]);
const testing = ref(false);
const previewData = ref<{ labels: string[]; values: number[]; values2?: number[] } | null>(null);
const previewError = ref('');

const allChartTypes = [
  { value: 'bar', label: 'Cột', icon: '📊' },
  { value: 'line', label: 'Đường', icon: '📈' },
  { value: 'doughnut', label: 'Tròn', icon: '🍩' },
  { value: 'combo', label: 'Kết hợp', icon: '📉' },
];

const timeGroupings = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
];

const form = ref({
  table: '',
  xColumn: '',
  yColumn: '*',
  yOperation: 'COUNT',
  chartType: 'bar',
  filterColumn: '',
  filterOperator: '=',
  filterValue: '',
  title: '',
  timeGrouping: '' as string,
  enableY2: false,
  y2Column: '*',
  y2Operation: 'COUNT',
  limit: '' as string | number,
});

const DATE_COLS = new Set(['created_at', 'registered_at', 'updated_at', 'last_tx_at']);
const isDateColumn = computed(() => DATE_COLS.has(form.value.xColumn));

const currentTable = computed(() => tables.value.find(t => t.table === form.value.table));
const xColumns = computed(() => currentTable.value?.columns.filter((c: any) => c.column !== '*') || []);
const yColumns = computed(() => currentTable.value?.columns || []);
const filterColumns = computed(() => currentTable.value?.columns.filter((c: any) => c.column !== '*') || []);
const canSubmit = computed(() => form.value.table && form.value.xColumn && form.value.yOperation && form.value.chartType && form.value.title);

const availableChartTypes = computed(() => {
  if (form.value.enableY2) return allChartTypes.filter(t => t.value === 'combo');
  return allChartTypes;
});

const chartComponent = computed(() => {
  if (form.value.chartType === 'line' || form.value.chartType === 'combo') return Line as any;
  if (form.value.chartType === 'doughnut') return Doughnut as any;
  return Bar as any;
});

const COLORS = ['#7c3aed', '#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

const previewChartData = computed(() => {
  if (!previewData.value) return null;
  const { labels, values, values2 } = previewData.value;
  if (form.value.chartType === 'doughnut') {
    return {
      labels: labels.map((l, i) => `${l} (${values[i].toLocaleString()})`),
      datasets: [{ data: values, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 0 }],
    };
  }
  if (form.value.chartType === 'combo' && values2) {
    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: form.value.yColumn === '*' ? 'Đếm tổng số' : form.value.yOperation + ' (' + (currentTable.value?.columns.find((c: any) => c.column === form.value.yColumn)?.label || form.value.yColumn) + ')',
          data: values,
          backgroundColor: 'rgba(124,58,237,.5)',
          borderRadius: 6,
          borderSkipped: false,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line' as const,
          label: form.value.y2Column === '*' ? 'Đếm tổng số' : form.value.y2Operation + ' (' + (currentTable.value?.columns.find((c: any) => c.column === form.value.y2Column)?.label || form.value.y2Column) + ')',
          data: values2,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,.08)',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#06b6d4',
          fill: false,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    };
  }
  return {
    labels,
    datasets: [{
      label: form.value.title || (form.value.yColumn === '*' ? 'Đếm tổng số' : form.value.yOperation),
      data: values,
      backgroundColor: form.value.chartType === 'bar' ? 'rgba(124,58,237,.6)' : undefined,
      borderColor: '#7c3aed',
      borderWidth: 2,
      borderRadius: form.value.chartType === 'bar' ? 6 : 0,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#7c3aed',
      fill: form.value.chartType === 'line',
    }],
  };
});

const previewOptions = computed(() => {
  const isDoughnut = form.value.chartType === 'doughnut';
  const base: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: isDoughnut || form.value.chartType === 'combo', position: 'top' as const, labels: { color: '#94a3b8', font: { size: 11 } } },
    },
  };
  if (!isDoughnut) {
    if (form.value.chartType === 'combo') {
      base.scales = {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' } },
        y: { position: 'left', ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' }, beginAtZero: true },
        y1: { position: 'right', ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { drawOnChartArea: false }, beginAtZero: true },
      };
    } else {
      base.scales = {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' } },
        y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' }, beginAtZero: true },
      };
    }
  }
  return base;
});

onMounted(async () => {
  try {
    const res = await fetch(`${API}/dashboard/available-fields`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      tables.value = data.data.tables.filter((t: any) => t.table !== 'kpi_computed');
      operators.value = data.data.operators;
    }
  } catch (e) { console.error('Failed to load fields', e); }
});

watch(() => props.editChart, (c) => {
  if (c) {
    form.value = { ...c, enableY2: !!(c.y2Column && c.y2Operation) };
    previewData.value = null;
    previewError.value = '';
  }
}, { immediate: true });

function onTableChange() {
  form.value.xColumn = '';
  form.value.yColumn = '*';
  form.value.filterColumn = '';
  form.value.filterValue = '';
  form.value.timeGrouping = '';
  form.value.limit = '';
  previewData.value = null;
}

async function testChart() {
  testing.value = true;
  previewData.value = null;
  previewError.value = '';
  try {
    const body: any = {
      table: form.value.table,
      xColumn: form.value.xColumn,
      yColumn: form.value.yColumn,
      yOperation: form.value.yOperation,
    };
    if (form.value.timeGrouping) body.timeGrouping = form.value.timeGrouping;
    if (form.value.limit) body.limit = Number(form.value.limit);
    if (form.value.enableY2 && form.value.y2Column && form.value.y2Operation) {
      body.y2Column = form.value.y2Column;
      body.y2Operation = form.value.y2Operation;
    }
    if (form.value.filterColumn && form.value.filterValue) {
      body.filter = { column: form.value.filterColumn, operator: form.value.filterOperator, value: form.value.filterValue };
    }
    const res = await fetch(`${API}/dashboard/custom-chart`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      previewData.value = data.data;
    } else {
      previewError.value = data.message || 'Query failed';
    }
  } catch (e: any) {
    previewError.value = e.message;
  } finally {
    testing.value = false;
  }
}

function addChart() {
  if (!canSubmit.value) return;
  const chart: any = {
    id: props.editChart?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    table: form.value.table,
    xColumn: form.value.xColumn,
    yColumn: form.value.yColumn,
    yOperation: form.value.yOperation,
    chartType: form.value.chartType,
    filterColumn: form.value.filterColumn || undefined,
    filterValue: form.value.filterValue || undefined,
    title: form.value.title,
    timeGrouping: form.value.timeGrouping || undefined,
    limit: form.value.limit ? Number(form.value.limit) : undefined,
    xColumnLabel: currentTable.value?.columns.find((c: any) => c.column === form.value.xColumn)?.label || form.value.xColumn,
    yColumnLabel: currentTable.value?.columns.find((c: any) => c.column === form.value.yColumn)?.label || form.value.yColumn,
  };
  if (form.value.enableY2 && form.value.y2Column && form.value.y2Operation) {
    chart.y2Column = form.value.y2Column;
    chart.y2Operation = form.value.y2Operation;
    chart.y2ColumnLabel = currentTable.value?.columns.find((c: any) => c.column === form.value.y2Column)?.label || form.value.y2Column;
    chart.chartType = 'combo';
  }
  if (props.editChart) {
    emit('update', chart);
  } else {
    emit('add', chart);
  }
  form.value = { table: '', xColumn: '', yColumn: '*', yOperation: 'COUNT', chartType: 'bar', filterColumn: '', filterOperator: '=', filterValue: '', title: '', timeGrouping: '', limit: '', enableY2: false, y2Column: '*', y2Operation: 'COUNT' };
  previewData.value = null;
  previewError.value = '';
  emit('close');
}
</script>

<style scoped>
.chart-builder-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.chart-builder-modal { background: #0f172a; border: 1px solid rgba(124,58,237,.3); border-radius: 16px; width: 640px; max-height: 92vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
.cb-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid rgba(148,163,184,.1); }
.cb-header h3 { margin: 0; font-size: 1rem; color: #e2e8f0; }
.cb-close { background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.cb-close:hover { background: rgba(239,68,68,.15); color: #ef4444; }
.cb-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.cb-field label { display: block; font-size: .75rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .03em; }
.cb-select { width: 100%; padding: 10px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #e2e8f0; font-size: .85rem; outline: none; transition: border-color .2s; }
.cb-select:focus { border-color: rgba(124,58,237,.5); }
.cb-select.sm { width: 45%; }
.cb-select.xs { width: 80px; }
.cb-input { padding: 10px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #e2e8f0; font-size: .85rem; outline: none; flex: 1; }
.cb-input:focus { border-color: rgba(124,58,237,.5); }
.cb-input.full { width: 100%; }
.cb-y-row { display: flex; gap: 12px; flex-direction: column; }
.cb-ops { display: flex; gap: 6px; flex-wrap: wrap; }
.cb-op-btn { padding: 6px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 8px; color: #94a3b8; font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.cb-op-btn:hover { border-color: rgba(124,58,237,.3); color: #a78bfa; }
.cb-op-btn.active { background: rgba(124,58,237,.15); border-color: rgba(124,58,237,.5); color: #a78bfa; }
.cb-chart-types { display: flex; gap: 8px; flex-wrap: wrap; }
.cb-type-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: rgba(30,41,59,.6); border: 1px solid rgba(148,163,184,.12); border-radius: 10px; color: #94a3b8; cursor: pointer; transition: all .2s; }
.cb-type-btn:hover { border-color: rgba(124,58,237,.3); }
.cb-type-btn.active { background: rgba(124,58,237,.12); border-color: rgba(124,58,237,.5); color: #a78bfa; }
.cb-type-icon { font-size: 1.2rem; }
.cb-type-label { font-size: .82rem; font-weight: 600; }
.cb-filter-row { display: flex; gap: 8px; align-items: center; }
.cb-time-group { display: flex; gap: 6px; flex-wrap: wrap; }
.cb-tg-btn { padding: 6px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 8px; color: #94a3b8; font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.cb-tg-btn:hover { border-color: rgba(6,182,212,.3); color: #06b6d4; }
.cb-tg-btn.active { background: rgba(6,182,212,.12); border-color: rgba(6,182,212,.5); color: #06b6d4; }
.cb-toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.cb-toggle-label input[type="checkbox"] { accent-color: #7c3aed; width: 16px; height: 16px; }
.cb-toggle-label span { font-size: .82rem; color: #e2e8f0; font-weight: 500; text-transform: none; letter-spacing: 0; }
.cb-preview { background: rgba(124,58,237,.04); border: 1px solid rgba(124,58,237,.12); border-radius: 12px; padding: 14px 18px; }
.cb-preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cb-preview-label { font-size: .7rem; font-weight: 600; color: #7c3aed; text-transform: uppercase; }
.cb-test-btn { background: rgba(124,58,237,.15); border: 1px solid rgba(124,58,237,.3); color: #a78bfa; padding: 6px 14px; border-radius: 8px; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.cb-test-btn:hover { background: rgba(124,58,237,.25); }
.cb-test-btn:disabled { opacity: .5; cursor: wait; }
.cb-preview-formula code { font-size: .72rem; color: #475569; background: rgba(30,41,59,.6); padding: 3px 8px; border-radius: 6px; }
.cb-preview-chart { margin-top: 10px; }
.cb-preview-error { color: #ef4444; font-size: .8rem; margin-top: 8px; }
.cb-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 14px 24px; border-top: 1px solid rgba(148,163,184,.08); }
.cb-cancel { background: none; border: 1px solid rgba(148,163,184,.15); color: #94a3b8; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: .85rem; }
.cb-cancel:hover { border-color: rgba(239,68,68,.3); color: #ef4444; }
.cb-submit { background: #7c3aed; color: #fff; border: none; padding: 10px 22px; border-radius: 10px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.cb-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,.4); }
.cb-submit:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }
</style>
