<template>
  <div class="dkpi-card">
    <div class="dkpi-actions">
      <button class="dkpi-act-btn" @click="$emit('edit', metric)" title="Sửa">⚙</button>
      <button class="dkpi-act-btn del" @click="$emit('remove', metric.id)" title="Xóa">✕</button>
    </div>
    <div class="dkpi-top">
      <span class="dkpi-label">{{ metric.label }}</span>
      <span class="dkpi-icon-sm">{{ metric.icon || '📊' }}</span>
    </div>
    <div class="dkpi-value" :class="{ loading }">
      {{ loading ? '...' : formattedValue }}
    </div>
    <!-- MoM Trend Badge -->
    <div class="dkpi-bottom">
      <span v-if="trendData" class="dkpi-trend" :class="trendData.dir">
        {{ trendData.dir === 'up' ? '▲' : trendData.dir === 'down' ? '▼' : '●' }}
        {{ trendData.label }}
      </span>
      <span v-else class="dkpi-formula-sm">
        <code>{{ metric.operation }}({{ metric.column }})</code>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{ metric: any }>();
defineEmits(['edit', 'remove']);

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:4000';
const tokenCookie = useCookie('crm_auth_token');
const loading = ref(true);
const value = ref(0);
const trendData = ref<{ dir: string; label: string; percent: number } | null>(null);

const formattedValue = computed(() => {
  const v = value.value;
  if (props.metric.format === 'currency') {
    if (v >= 1e12) return (v / 1e12).toFixed(1) + ' nghìn tỷ';
    if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + ' triệu';
    return v.toLocaleString('vi-VN') + ' ₫';
  }
  if (props.metric.format === 'percent') {
    return v.toFixed(1) + '%';
  }
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'tr';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toLocaleString('vi-VN');
});

onMounted(() => fetchMetric());

async function fetchMetric() {
  loading.value = true;
  try {
    const body: any = {
      table: props.metric.table,
      column: props.metric.column,
      operation: props.metric.operation,
      label: props.metric.label,
      format: props.metric.format,
    };
    if (props.metric.filterColumn && props.metric.filterValue) {
      body.filter = {
        column: props.metric.filterColumn,
        operator: props.metric.filterOperator || '=',
        value: props.metric.filterValue,
      };
    }
    if (props.metric.multiplier) body.multiplier = props.metric.multiplier;
    if (props.metric.divisor) body.divisor = props.metric.divisor;
    // MoM comparison
    if (props.metric.dateColumn && props.metric.comparePeriod) {
      body.dateColumn = props.metric.dateColumn;
      body.comparePeriod = props.metric.comparePeriod;
    }
    const res = await fetch(`${API}/dashboard/custom-metric`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCookie.value}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      value.value = data.data.result;
      // Parse MoM trend if available
      if (data.data.changeDirection) {
        trendData.value = {
          dir: data.data.changeDirection,
          percent: Math.abs(data.data.changePercent || 0),
          label: `${Math.abs(data.data.changePercent || 0)}% MoM`,
        };
      }
    }
  } catch (e) {
    console.error('Metric fetch failed', e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.dkpi-card {
  position: relative;
  background: rgba(255,255,255,.035);
  border: 1px solid rgba(148,163,184,.1);
  border-radius: 14px;
  padding: 18px 20px 16px;
  min-width: 0;
  transition: border-color .2s, transform .2s;
}
.dkpi-card:hover { border-color: rgba(124,58,237,.3); transform: translateY(-2px); }
.dkpi-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity .2s; }
.dkpi-card:hover .dkpi-actions { opacity: 1; }
.dkpi-act-btn { background: rgba(30,41,59,.9); border: 1px solid rgba(148,163,184,.15); border-radius: 6px; color: #94a3b8; font-size: .7rem; padding: 3px 7px; cursor: pointer; transition: all .15s; }
.dkpi-act-btn:hover { background: rgba(124,58,237,.15); color: #a78bfa; border-color: rgba(124,58,237,.3); }
.dkpi-act-btn.del:hover { background: rgba(239,68,68,.15); color: #ef4444; border-color: rgba(239,68,68,.3); }

.dkpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dkpi-label { font-size: .68rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
.dkpi-icon-sm { font-size: 1.1rem; opacity: .5; }

.dkpi-value { font-size: 1.7rem; font-weight: 800; color: #f1f5f9; line-height: 1.1; margin-bottom: 10px; }
.dkpi-value.loading { color: #64748b; animation: pulse 1s infinite; }

.dkpi-bottom { display: flex; align-items: center; }
.dkpi-trend { font-size: .72rem; font-weight: 600; padding: 3px 10px; border-radius: 6px; letter-spacing: .02em; }
.dkpi-trend.up { color: #22c55e; background: rgba(34,197,94,.1); }
.dkpi-trend.down { color: #ef4444; background: rgba(239,68,68,.1); }
.dkpi-trend.flat { color: #94a3b8; background: rgba(148,163,184,.1); }

.dkpi-formula-sm code { font-size: .6rem; color: #475569; background: rgba(30,41,59,.6); padding: 2px 6px; border-radius: 4px; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
</style>
