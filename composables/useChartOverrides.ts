import { ref, watch } from 'vue';
import { useState } from '#app';

export function useChartOverrides(dashboardId: string) {
  const customMetrics = ref<any[]>([]);
  const customCharts = ref<any[]>([]);
  const chartOverrides = ref<Record<string, any>>({});
  
  const showChartBuilder = ref(false);
  const editingChart = ref<any>(null);
  const editingChartSlot = ref<string | null>(null);

  const config = useRuntimeConfig();
  const API = config.public.apiBase || 'http://localhost:4000';
  const tokenCookie = useCookie('crm_auth_token');
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenCookie.value}`,
  });

  const adminTargetUserId = useCookie<string | null>('adminTargetUserId', { default: () => null });

  async function loadDashboardSettings() {
    try {
      const url = adminTargetUserId.value
        ? `${API}/dashboard/settings/${dashboardId}?target_user_id=${adminTargetUserId.value}`
        : `${API}/dashboard/settings/${dashboardId}`;

      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        customMetrics.value = data.data.customMetrics || [];
        customCharts.value = data.data.customCharts || [];
        chartOverrides.value = data.data.chartOverrides || {};
      }
    } catch (e) { console.error(`Failed to load config for ${dashboardId}`, e); }
  }

  watch(adminTargetUserId, () => {
    loadDashboardSettings();
  });

  async function saveDashboardSettings() {
    try {
      await fetch(`${API}/dashboard/settings/${dashboardId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          customMetrics: customMetrics.value,
          customCharts: customCharts.value,
          chartOverrides: chartOverrides.value,
        })
      });
    } catch (e) { console.error(`Failed to save config for ${dashboardId}`, e); }
  }

  // --- Metric handlers ---
  function onAddMetric(metric: any) {
    customMetrics.value.push(metric);
    saveDashboardSettings();
  }
  function onUpdateMetric(metric: any) {
    const idx = customMetrics.value.findIndex((m: any) => m.id === metric.id);
    if (idx >= 0) customMetrics.value.splice(idx, 1, metric);
    saveDashboardSettings();
  }
  function removeMetric(id: string) {
    customMetrics.value = customMetrics.value.filter((m: any) => m.id !== id);
    saveDashboardSettings();
  }

  // --- Chart handlers ---
  function onAddChart(chart: any) {
    if (editingChartSlot.value) {
      chartOverrides.value[editingChartSlot.value] = { ...chart, id: Date.now() + '' };
      saveDashboardSettings();
      editingChartSlot.value = null;
    } else {
      customCharts.value.push(chart);
      saveDashboardSettings();
    }
  }

  function onUpdateChart(chart: any) {
    if (editingChartSlot.value) {
      chartOverrides.value[editingChartSlot.value] = chart;
      saveDashboardSettings();
      editingChartSlot.value = null;
    } else {
      const idx = customCharts.value.findIndex((c: any) => c.id === chart.id);
      if (idx >= 0) customCharts.value.splice(idx, 1, chart);
      saveDashboardSettings();
    }
  }

  function editChart(chart: any) {
    editingChart.value = { ...chart };
    editingChartSlot.value = null;
    showChartBuilder.value = true;
  }

  function removeChart(id: string) {
    customCharts.value = customCharts.value.filter((c: any) => c.id !== id);
    saveDashboardSettings();
  }

  function openChartEdit(slotId: string) {
    editingChart.value = null;
    editingChartSlot.value = slotId;
    showChartBuilder.value = true;
  }

  function openChartEditWith(slotId: string, chartData: any) {
    editingChart.value = { ...chartData };
    editingChartSlot.value = slotId;
    showChartBuilder.value = true;
  }

  function resetChartOverride(slotId: string) {
    delete chartOverrides.value[slotId];
    saveDashboardSettings();
  }

  return {
    customMetrics,
    customCharts,
    chartOverrides,
    showChartBuilder,
    editingChart,
    editingChartSlot,
    loadDashboardSettings,
    onAddMetric,
    onUpdateMetric,
    removeMetric,
    onAddChart,
    onUpdateChart,
    editChart,
    removeChart,
    openChartEdit,
    openChartEditWith,
    resetChartOverride
  };
}
