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

        <!-- Step 4: Chart type -->
        <div class="cb-field" v-if="form.yOperation">
          <label>4. Loại biểu đồ</label>
          <div class="cb-chart-types">
            <button v-for="ct in chartTypes" :key="ct.value"
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
            <code>{{ form.yOperation }}({{ form.yColumn }}) GROUP BY {{ form.xColumn }}</code>
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
const previewData = ref<{ labels: string[]; values: number[] } | null>(null);
const previewError = ref('');

const chartTypes = [
  { value: 'bar', label: 'Cột', icon: '📊' },
  { value: 'line', label: 'Đường', icon: '📈' },
  { value: 'doughnut', label: 'Tròn', icon: '🍩' },
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
});

const currentTable = computed(() => tables.value.find(t => t.table === form.value.table));
const xColumns = computed(() => currentTable.value?.columns.filter((c: any) => c.column !== '*') || []);
const yColumns = computed(() => currentTable.value?.columns || []);
const filterColumns = computed(() => currentTable.value?.columns.filter((c: any) => c.column !== '*') || []);
const canSubmit = computed(() => form.value.table && form.value.xColumn && form.value.yOperation && form.value.chartType && form.value.title);

const chartComponent = computed(() => {
  if (form.value.chartType === 'line') return Line as any;
  if (form.value.chartType === 'doughnut') return Doughnut as any;
  return Bar as any;
});

const COLORS = ['#7c3aed', '#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

const previewChartData = computed(() => {
  if (!previewData.value) return null;
  const { labels, values } = previewData.value;
  if (form.value.chartType === 'doughnut') {
    return {
      labels,
      datasets: [{ data: values, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 0 }],
    };
  }
  return {
    labels,
    datasets: [{
      label: form.value.title || form.value.yOperation,
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
  const base: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: form.value.chartType === 'doughnut', position: 'right' as const, labels: { color: '#94a3b8', font: { size: 11 } } },
    },
  };
  if (form.value.chartType !== 'doughnut') {
    base.scales = {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' }, beginAtZero: true },
    };
  }
  return base;
});

onMounted(async () => {
  try {
    const res = await fetch(`${API}/dashboard/available-fields`, { headers: authHeaders() });
    const data = await res.json();
    if (data.success) {
      tables.value = data.data.tables;
      operators.value = data.data.operators;
    }
  } catch (e) { console.error('Failed to load fields', e); }
});

watch(() => props.editChart, (c) => {
  if (c) {
    form.value = { ...c };
    previewData.value = null;
    previewError.value = '';
  }
}, { immediate: true });

function onTableChange() {
  form.value.xColumn = '';
  form.value.yColumn = '*';
  form.value.filterColumn = '';
  form.value.filterValue = '';
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
  const chart = {
    id: props.editChart?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    table: form.value.table,
    xColumn: form.value.xColumn,
    yColumn: form.value.yColumn,
    yOperation: form.value.yOperation,
    chartType: form.value.chartType,
    filterColumn: form.value.filterColumn || undefined,
    filterOperator: form.value.filterOperator || undefined,
    filterValue: form.value.filterValue || undefined,
    title: form.value.title,
  };
  if (props.editChart) {
    emit('update', chart);
  } else {
    emit('add', chart);
  }
  form.value = { table: '', xColumn: '', yColumn: '*', yOperation: 'COUNT', chartType: 'bar', filterColumn: '', filterOperator: '=', filterValue: '', title: '' };
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
.cb-input { padding: 10px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #e2e8f0; font-size: .85rem; outline: none; flex: 1; transition: border-color .2s; }
.cb-input:focus { border-color: rgba(124,58,237,.5); }
.cb-input.full { width: 100%; }
.cb-y-row { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.cb-ops { display: flex; gap: 6px; flex-wrap: wrap; }
.cb-op-btn { padding: 7px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 8px; color: #94a3b8; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.cb-op-btn:hover { border-color: rgba(124,58,237,.3); color: #a78bfa; }
.cb-op-btn.active { background: rgba(124,58,237,.15); border-color: rgba(124,58,237,.5); color: #a78bfa; }
.cb-chart-types { display: flex; gap: 10px; }
.cb-type-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 20px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 12px; cursor: pointer; transition: all .2s; }
.cb-type-btn:hover { border-color: rgba(124,58,237,.3); }
.cb-type-btn.active { background: rgba(124,58,237,.12); border-color: rgba(124,58,237,.5); }
.cb-type-icon { font-size: 1.4rem; }
.cb-type-label { font-size: .72rem; font-weight: 600; color: #94a3b8; }
.cb-type-btn.active .cb-type-label { color: #a78bfa; }
.cb-filter-row { display: flex; gap: 8px; align-items: center; }
.cb-preview { background: rgba(124,58,237,.05); border: 1px solid rgba(124,58,237,.15); border-radius: 12px; padding: 14px 18px; }
.cb-preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cb-preview-label { font-size: .7rem; font-weight: 600; color: #7c3aed; text-transform: uppercase; }
.cb-preview-formula { margin-bottom: 10px; }
.cb-preview-formula code { background: rgba(30,41,59,.8); color: #67e8f9; padding: 4px 10px; border-radius: 6px; font-size: .78rem; }
.cb-preview-chart { border-radius: 8px; padding: 8px; background: rgba(15,23,42,.6); }
.cb-test-btn { padding: 7px 16px; background: rgba(124,58,237,.15); border: 1px solid rgba(124,58,237,.3); border-radius: 8px; color: #a78bfa; font-size: .78rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.cb-test-btn:hover:not(:disabled) { background: rgba(124,58,237,.25); }
.cb-test-btn:disabled { opacity: .5; cursor: wait; }
.cb-preview-error { margin-top: 8px; color: #ef4444; font-size: .8rem; }
.cb-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid rgba(148,163,184,.1); }
.cb-cancel { padding: 10px 20px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #94a3b8; font-size: .85rem; cursor: pointer; }
.cb-cancel:hover { border-color: rgba(239,68,68,.3); color: #ef4444; }
.cb-submit { padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #2563eb); border: none; border-radius: 10px; color: #fff; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.cb-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,.4); }
.cb-submit:disabled { opacity: .4; cursor: not-allowed; }
</style>
