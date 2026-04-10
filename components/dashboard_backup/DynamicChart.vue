<template>
  <div class="dchart-card">
    <div class="dchart-actions">
      <button class="dchart-act-btn" @click="$emit('edit', chart)" title="Sửa">⚙</button>
      <button class="dchart-act-btn del" @click="$emit('remove', chart.id)" title="Xóa">✕</button>
    </div>
    <div class="dchart-title">{{ chart.title }}</div>
    <div class="dchart-sub">
      <code>{{ chart.yOperation }}({{ chart.yColumn }}) GROUP BY {{ chart.xColumn }}</code>
    </div>
    <div class="dchart-wrap" :class="{ loading }">
      <div v-if="loading" class="dchart-loading">⏳ Đang tải...</div>
      <component v-else-if="chartData" :is="chartComponent" :data="chartData" :options="chartOptions" />
      <div v-if="error" class="dchart-error">❌ {{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const props = defineProps<{ chart: any }>();
defineEmits(['edit', 'remove']);

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:4000';
const tokenCookie = useCookie('crm_auth_token');

const loading = ref(true);
const error = ref('');
const rawData = ref<{ labels: string[]; values: number[] } | null>(null);

const COLORS = ['#7c3aed', '#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

const chartComponent = computed(() => {
  if (props.chart.chartType === 'line') return Line;
  if (props.chart.chartType === 'doughnut') return Doughnut;
  return Bar;
});

const chartData = computed(() => {
  if (!rawData.value) return null;
  const { labels, values } = rawData.value;
  if (props.chart.chartType === 'doughnut') {
    return {
      labels,
      datasets: [{ data: values, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 0 }],
    };
  }
  return {
    labels,
    datasets: [{
      label: props.chart.title,
      data: values,
      backgroundColor: props.chart.chartType === 'bar' ? 'rgba(124,58,237,.6)' : 'rgba(124,58,237,.1)',
      borderColor: '#7c3aed',
      borderWidth: 2,
      borderRadius: props.chart.chartType === 'bar' ? 6 : 0,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#7c3aed',
      fill: props.chart.chartType === 'line',
    }],
  };
});

const chartOptions = computed(() => {
  const base: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: props.chart.chartType === 'doughnut', position: 'right' as const, labels: { color: '#94a3b8', font: { size: 11 } } },
    },
  };
  if (props.chart.chartType !== 'doughnut') {
    base.scales = {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.06)' }, beginAtZero: true },
    };
  }
  return base;
});

onMounted(() => fetchChart());

async function fetchChart() {
  loading.value = true;
  error.value = '';
  try {
    const body: any = {
      table: props.chart.table,
      xColumn: props.chart.xColumn,
      yColumn: props.chart.yColumn,
      yOperation: props.chart.yOperation,
    };
    if (props.chart.filterColumn && props.chart.filterValue) {
      body.filter = { column: props.chart.filterColumn, operator: props.chart.filterOperator || '=', value: props.chart.filterValue };
    }
    const res = await fetch(`${API}/dashboard/custom-chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenCookie.value}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      rawData.value = data.data;
    } else {
      error.value = data.message || 'Failed';
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.dchart-card {
  position: relative; background: var(--card, rgba(30,41,59,.5)); border: 1px solid var(--border, rgba(148,163,184,.12));
  border-radius: 14px; padding: 20px; transition: border-color .2s, transform .2s;
}
.dchart-card:hover { border-color: rgba(124,58,237,.3); transform: translateY(-2px); }
.dchart-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 4px; opacity: 0; transition: opacity .2s; }
.dchart-card:hover .dchart-actions { opacity: 1; }
.dchart-act-btn { background: rgba(30,41,59,.9); border: 1px solid rgba(148,163,184,.15); border-radius: 6px; color: #94a3b8; font-size: .7rem; padding: 3px 7px; cursor: pointer; transition: all .15s; }
.dchart-act-btn:hover { background: rgba(124,58,237,.15); color: #a78bfa; border-color: rgba(124,58,237,.3); }
.dchart-act-btn.del:hover { background: rgba(239,68,68,.15); color: #ef4444; border-color: rgba(239,68,68,.3); }
.dchart-title { font-size: .88rem; font-weight: 700; color: var(--text, #e2e8f0); margin-bottom: 4px; }
.dchart-sub { margin-bottom: 12px; }
.dchart-sub code { font-size: .62rem; color: #64748b; background: rgba(30,41,59,.6); padding: 2px 6px; border-radius: 4px; }
.dchart-wrap { height: 220px; }
.dchart-wrap.loading { display: flex; align-items: center; justify-content: center; }
.dchart-loading { color: #64748b; font-size: .85rem; animation: pulse 1s infinite; }
.dchart-error { color: #ef4444; font-size: .8rem; text-align: center; padding-top: 40px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
</style>
