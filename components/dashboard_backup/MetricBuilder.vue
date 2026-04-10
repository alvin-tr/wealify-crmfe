<template>
  <div v-if="show" class="metric-builder-overlay" @click.self="$emit('close')">
    <div class="metric-builder-modal">
      <div class="mb-header">
        <h3>📐 Tạo chỉ số mới</h3>
        <button class="mb-close" @click="$emit('close')">✕</button>
      </div>

      <div class="mb-body">
        <!-- Step 1: Table -->
        <div class="mb-field">
          <label>1. Chọn bảng dữ liệu</label>
          <select v-model="form.table" @change="onTableChange" class="mb-select">
            <option value="">— Chọn bảng —</option>
            <option v-for="t in tables" :key="t.table" :value="t.table">{{ t.alias }} ({{ t.table }})</option>
          </select>
        </div>

        <!-- Step 2: Column -->
        <div class="mb-field" v-if="form.table">
          <label>2. Chọn cột</label>
          <select v-model="form.column" class="mb-select">
            <option value="">— Chọn cột —</option>
            <option v-for="c in currentColumns" :key="c.column" :value="c.column">{{ c.label }} ({{ c.column }})</option>
          </select>
        </div>

        <!-- Step 3: Operation -->
        <div class="mb-field" v-if="form.column">
          <label>3. Phép tính</label>
          <div class="mb-ops">
            <button v-for="op in operations" :key="op.value"
              :class="['mb-op-btn', { active: form.operation === op.value }]"
              @click="form.operation = op.value">
              {{ op.label }}
            </button>
          </div>
        </div>

        <!-- Step 4: Optional Filter -->
        <div class="mb-field" v-if="form.operation">
          <label>4. Lọc dữ liệu (tùy chọn)</label>
          <div class="mb-filter-row">
            <select v-model="form.filterColumn" class="mb-select sm">
              <option value="">Không lọc</option>
              <option v-for="c in currentColumns.filter((x: any) => x.column !== '*')" :key="c.column" :value="c.column">{{ c.label }}</option>
            </select>
            <select v-if="form.filterColumn" v-model="form.filterOperator" class="mb-select xs">
              <option v-for="op in operators" :key="op" :value="op">{{ op }}</option>
            </select>
            <input v-if="form.filterColumn" v-model="form.filterValue" class="mb-input" placeholder="Giá trị..." />
          </div>
        </div>

        <!-- Step 5: Multiplier -->
        <div class="mb-field" v-if="form.operation && (form.operation === 'SUM' || form.operation === 'AVG')">
          <label>5. Nhân hệ số (tùy chọn, VD: 0.035 cho margin)</label>
          <input v-model.number="form.multiplier" type="number" step="0.001" class="mb-input" placeholder="VD: 0.05" />
        </div>

        <!-- Step 6: Display -->
        <div class="mb-field" v-if="form.operation">
          <label>{{ form.multiplier ? '6' : '5' }}. Hiển thị</label>
          <div class="mb-display-row">
            <input v-model="form.label" class="mb-input" placeholder="Tên chỉ số (VD: Tổng KH)" />
            <select v-model="form.format" class="mb-select sm">
              <option value="number">Số</option>
              <option value="currency">Tiền (tỷ VNĐ)</option>
              <option value="percent">Phần trăm (%)</option>
            </select>
            <input v-model="form.icon" class="mb-input xs" placeholder="Icon" maxlength="4" />
          </div>
        </div>

        <!-- Preview -->
        <div class="mb-preview" v-if="form.table && form.column && form.operation">
          <div class="mb-preview-label">Preview</div>
          <div class="mb-preview-formula">
            <code>{{ form.operation }}({{ form.table }}.{{ form.column }}){{ form.multiplier ? ' × ' + form.multiplier : '' }}{{ form.filterColumn ? ' WHERE ' + form.filterColumn + ' ' + form.filterOperator + ' ' + form.filterValue : '' }}</code>
          </div>
          <button class="mb-test-btn" @click="testMetric" :disabled="testing">
            {{ testing ? '⏳ Đang tính...' : '🧪 Test thử' }}
          </button>
          <div v-if="previewResult !== null" class="mb-preview-result">
            <span class="mb-result-value">{{ formatResult(previewResult) }}</span>
          </div>
          <div v-if="previewError" class="mb-preview-error">❌ {{ previewError }}</div>
        </div>
      </div>

      <div class="mb-footer">
        <button class="mb-cancel" @click="$emit('close')">Hủy</button>
        <button class="mb-submit" @click="addMetric" :disabled="!canSubmit">
          ➕ Thêm vào Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps<{ show: boolean; editMetric?: any }>();
const emit = defineEmits(['close', 'add', 'update']);

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:4000';
const tokenCookie = useCookie('crm_auth_token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${tokenCookie.value}`,
});

interface TableInfo { table: string; alias: string; columns: { column: string; label: string }[] }
interface OpInfo { value: string; label: string }

const tables = ref<TableInfo[]>([]);
const operations = ref<OpInfo[]>([]);
const operators = ref<string[]>([]);
const testing = ref(false);
const previewResult = ref<number | null>(null);
const previewError = ref('');

const form = ref({
  table: '',
  column: '',
  operation: '',
  filterColumn: '',
  filterOperator: '=',
  filterValue: '',
  multiplier: null as number | null,
  label: '',
  format: 'number',
  icon: '📊',
});

const currentColumns = computed(() => {
  const t = tables.value.find(x => x.table === form.value.table);
  return t ? t.columns : [];
});

const canSubmit = computed(() => form.value.table && form.value.column && form.value.operation && form.value.label);

onMounted(async () => {
  try {
    const res = await fetch(`${API}/dashboard/available-fields`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      tables.value = data.data.tables;
      operations.value = data.data.operations;
      operators.value = data.data.operators;
    }
  } catch (e) {
    console.error('Failed to load fields', e);
  }
});

watch(() => props.editMetric, (m) => {
  if (m) {
    form.value = { ...m };
    previewResult.value = null;
    previewError.value = '';
  }
}, { immediate: true });

function onTableChange() {
  form.value.column = '';
  form.value.filterColumn = '';
  form.value.filterValue = '';
  previewResult.value = null;
}

async function testMetric() {
  testing.value = true;
  previewResult.value = null;
  previewError.value = '';
  try {
    const body: any = {
      table: form.value.table,
      column: form.value.column,
      operation: form.value.operation,
      label: form.value.label || 'Test',
      format: form.value.format,
    };
    if (form.value.filterColumn && form.value.filterValue) {
      body.filter = {
        column: form.value.filterColumn,
        operator: form.value.filterOperator,
        value: form.value.filterValue,
      };
    }
    if (form.value.multiplier) {
      body.multiplier = form.value.multiplier;
    }
    const res = await fetch(`${API}/dashboard/custom-metric`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      previewResult.value = data.data.result;
    } else {
      previewError.value = data.message || 'Query failed';
    }
  } catch (e: any) {
    previewError.value = e.message;
  } finally {
    testing.value = false;
  }
}

function formatResult(val: number) {
  if (form.value.format === 'currency') {
    return (val / 1e9).toFixed(2) + ' tỷ';
  }
  if (form.value.format === 'percent') {
    return val.toFixed(1) + '%';
  }
  return val.toLocaleString('vi-VN');
}

function addMetric() {
  if (!canSubmit.value) return;
  const metric = {
    id: props.editMetric?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    table: form.value.table,
    column: form.value.column,
    operation: form.value.operation,
    filterColumn: form.value.filterColumn || undefined,
    filterOperator: form.value.filterOperator || undefined,
    filterValue: form.value.filterValue || undefined,
    multiplier: form.value.multiplier || undefined,
    label: form.value.label,
    format: form.value.format,
    icon: form.value.icon || '📊',
  };
  if (props.editMetric) {
    emit('update', metric);
  } else {
    emit('add', metric);
  }
  // Reset form
  form.value = { table: '', column: '', operation: '', filterColumn: '', filterOperator: '=', filterValue: '', multiplier: null, label: '', format: 'number', icon: '📊' };
  previewResult.value = null;
  previewError.value = '';
  emit('close');
}
</script>

<style scoped>
.metric-builder-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.metric-builder-modal { background: #0f172a; border: 1px solid rgba(124,58,237,.3); border-radius: 16px; width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
.mb-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid rgba(148,163,184,.1); }
.mb-header h3 { margin: 0; font-size: 1rem; color: #e2e8f0; }
.mb-close { background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.mb-close:hover { background: rgba(239,68,68,.15); color: #ef4444; }
.mb-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
.mb-field label { display: block; font-size: .75rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .03em; }
.mb-select { width: 100%; padding: 10px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #e2e8f0; font-size: .85rem; outline: none; transition: border-color .2s; }
.mb-select:focus { border-color: rgba(124,58,237,.5); }
.mb-select.sm { width: 45%; }
.mb-select.xs { width: 80px; }
.mb-input { padding: 10px 14px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #e2e8f0; font-size: .85rem; outline: none; flex: 1; transition: border-color .2s; }
.mb-input:focus { border-color: rgba(124,58,237,.5); }
.mb-input.xs { width: 60px; flex: none; text-align: center; }
.mb-ops { display: flex; gap: 8px; flex-wrap: wrap; }
.mb-op-btn { padding: 8px 16px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 8px; color: #94a3b8; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.mb-op-btn:hover { border-color: rgba(124,58,237,.3); color: #a78bfa; }
.mb-op-btn.active { background: rgba(124,58,237,.15); border-color: rgba(124,58,237,.5); color: #a78bfa; }
.mb-filter-row { display: flex; gap: 8px; align-items: center; }
.mb-display-row { display: flex; gap: 8px; align-items: center; }
.mb-preview { background: rgba(124,58,237,.05); border: 1px solid rgba(124,58,237,.15); border-radius: 12px; padding: 14px 18px; }
.mb-preview-label { font-size: .7rem; font-weight: 600; color: #7c3aed; text-transform: uppercase; margin-bottom: 6px; }
.mb-preview-formula { margin-bottom: 10px; }
.mb-preview-formula code { background: rgba(30,41,59,.8); color: #67e8f9; padding: 4px 10px; border-radius: 6px; font-size: .78rem; }
.mb-test-btn { padding: 8px 18px; background: rgba(124,58,237,.15); border: 1px solid rgba(124,58,237,.3); border-radius: 8px; color: #a78bfa; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.mb-test-btn:hover:not(:disabled) { background: rgba(124,58,237,.25); }
.mb-test-btn:disabled { opacity: .5; cursor: wait; }
.mb-preview-result { margin-top: 10px; }
.mb-result-value { font-size: 1.4rem; font-weight: 700; color: #22c55e; }
.mb-preview-error { margin-top: 8px; color: #ef4444; font-size: .8rem; }
.mb-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid rgba(148,163,184,.1); }
.mb-cancel { padding: 10px 20px; background: rgba(30,41,59,.8); border: 1px solid rgba(148,163,184,.15); border-radius: 10px; color: #94a3b8; font-size: .85rem; cursor: pointer; }
.mb-cancel:hover { border-color: rgba(239,68,68,.3); color: #ef4444; }
.mb-submit { padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #2563eb); border: none; border-radius: 10px; color: #fff; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.mb-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,.4); }
.mb-submit:disabled { opacity: .4; cursor: not-allowed; }
</style>
