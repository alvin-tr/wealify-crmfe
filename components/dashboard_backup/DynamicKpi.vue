<template>
  <div class="dkpi-card">
    <div class="dkpi-actions">
      <button class="dkpi-act-btn" @click="$emit('edit', metric)" title="Sửa">⚙</button>
      <button class="dkpi-act-btn del" @click="$emit('remove', metric.id)" title="Xóa">✕</button>
    </div>
    <div class="dkpi-label">{{ metric.label }}</div>
    <div class="dkpi-value" :class="{ loading }">
      {{ loading ? '...' : formattedValue }}
    </div>
    <div class="dkpi-formula">
      <code>{{ metric.operation }}({{ metric.column }}){{ metric.multiplier ? ' ×' + metric.multiplier : '' }}</code>
    </div>
    <div class="dkpi-icon">{{ metric.icon || '📊' }}</div>
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
    if (props.metric.multiplier) {
      body.multiplier = props.metric.multiplier;
    }
    if (props.metric.divisor) {
      body.divisor = props.metric.divisor;
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
    }
  } catch (e) {
    console.error('Metric fetch failed', e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.dkpi-card { position: relative; background: var(--card, rgba(30,41,59,.5)); border: 1px solid var(--border, rgba(148,163,184,.12)); border-radius: 14px; padding: 20px 18px 16px; min-width: 0; transition: border-color .2s, transform .2s; }
.dkpi-card:hover { border-color: rgba(124,58,237,.3); transform: translateY(-2px); }
.dkpi-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity .2s; }
.dkpi-card:hover .dkpi-actions { opacity: 1; }
.dkpi-act-btn { background: rgba(30,41,59,.9); border: 1px solid rgba(148,163,184,.15); border-radius: 6px; color: #94a3b8; font-size: .7rem; padding: 3px 7px; cursor: pointer; transition: all .15s; }
.dkpi-act-btn:hover { background: rgba(124,58,237,.15); color: #a78bfa; border-color: rgba(124,58,237,.3); }
.dkpi-act-btn.del:hover { background: rgba(239,68,68,.15); color: #ef4444; border-color: rgba(239,68,68,.3); }
.dkpi-label { font-size: .72rem; font-weight: 600; color: var(--text-dim, #94a3b8); text-transform: uppercase; letter-spacing: .03em; margin-bottom: 8px; }
.dkpi-value { font-size: 1.6rem; font-weight: 800; color: var(--text, #e2e8f0); line-height: 1.2; }
.dkpi-value.loading { color: #64748b; animation: pulse 1s infinite; }
.dkpi-formula { margin-top: 6px; }
.dkpi-formula code { font-size: .62rem; color: #64748b; background: rgba(30,41,59,.6); padding: 2px 6px; border-radius: 4px; }
.dkpi-icon { position: absolute; bottom: 16px; right: 16px; font-size: 1.4rem; opacity: .4; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
</style>
