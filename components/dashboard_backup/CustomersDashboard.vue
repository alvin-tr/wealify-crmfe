<template>
  <div class="space-y-6 crm-dashboard-theme">
    
                <div class="kpi-row" style="grid-template-columns:repeat(4,1fr)">
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh (24,381). Công thức chuẩn: COUNT(*) FROM customers. Cần kết nối API thực để hiển thị realtime.">Tổng khách hàng</div>
                        <div class="kpi-value">24,381</div>
                        <div class="kpi-mom up">▲ 14.3% MoM</div>
                        <div class="kpi-spark">👥</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh (18,742). Công thức chuẩn: COUNT(DISTINCT customer_id) FROM monitoring_transactions_summary WHERE volume_last_30d > 0. Cần kết nối API thực.">KH đang hoạt động</div>
                        <div class="kpi-value">18,742</div>
                        <div class="kpi-mom up">▲ 76.9% tổng KH</div>
                        <div class="kpi-spark">✅</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh (2,847). Công thức chuẩn: COUNT(*) FROM customers WHERE MONTH(registered_at) = MONTH(NOW()). Cần kết nối API thực.">KH mới (tháng)</div>
                        <div class="kpi-value">2,847</div>
                        <div class="kpi-mom up">▲ 14.3% MoM</div>
                        <div class="kpi-spark">🆕</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh (3.2%). Công thức chuẩn: (KH có volume_prev_30d > 0 NHƯNG volume_last_30d = 0) ÷ (KH có volume_prev_30d > 0) × 100. Tỷ lệ KH ngừng giao dịch. Cần kết nối API thực.">Churn Rate</div>
                        <div class="kpi-value">3.2%</div>
                        <div class="kpi-mom up">▼ 0.4% MoM</div>
                        <div class="kpi-spark">📉</div>
                    </div>
                </div>

                <div class="editable-chart">
                  <template v-if="chartOverrides['customers-table']">
                    <DashboardDynamicChart
                      :chart="chartOverrides['customers-table']"
                      @edit="openChartEditWith('customers-table', chartOverrides['customers-table'])"
                      @remove="resetChartOverride('customers-table')"
                      :isOverride="true"
                    />
                  </template>
                  <template v-else>
                    <div class="data-table-card">
                        <div class="table-toolbar">
                            <div class="chart-title" style="flex-shrink:0">🧑‍💼 Danh sách khách hàng</div>
                            <input class="search-input" placeholder="🔍 Tìm theo tên, SĐT, email..." id="cust-search"
                                oninput="filterCustomers(this.value)">
                            <button class="export-btn" onclick="exportCustomersCSV()">⬇️ Xuất CSV</button><button
                                class="filter-btn active" onclick="filterCustStatus('all',this)">Tất cả</button>
                            <button class="filter-btn" onclick="filterCustStatus('active',this)">Hoạt động</button>
                            <button class="filter-btn" onclick="filterCustStatus('new',this)">Mới</button>
                            <button class="filter-btn" onclick="filterCustStatus('inactive',this)">Không HĐ</button>
                            <button class="filter-btn" onclick="filterCustTier('diamond',this)"
                                style="border-color:rgba(6,182,212,.3);color:#67e8f9">💎 Diamond</button>
                            <button class="filter-btn" onclick="filterCustTier('gold',this)"
                                style="border-color:rgba(245,158,11,.3);color:#fbbf24">🥇 Gold</button>
                            <button class="filter-btn" onclick="filterCustTier('silver',this)"
                                style="border-color:rgba(148,163,184,.25);color:#cbd5e1">🥈 Silver</button>
                        </div>
                        <table class="crm-table" id="cust-table">
                            <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Tier</th>
                                    <th>Số tài khoản</th>
                                    <th>Volume (tr ₫)</th>
                                    <th>Giao dịch gần nhất</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody id="cust-tbody"></tbody>
                        </table>
                        <div class="pagination">
                            <div class="page-info" id="cust-page-info">Hiển thị 1–15 / 24.381 khách hàng</div>
                            <div class="page-btns">
                                <button class="page-btn active">1</button>
                                <button class="page-btn">2</button>
                                <button class="page-btn">3</button>
                                <button class="page-btn">›</button>
                            </div>
                        </div>
                    </div>
                    <div class="chart-edit-overlay">
                      <button class="chart-edit-btn" @click.stop="openChartEdit('customers-table')" title="Chỉnh sửa / Cài đặt biểu đồ">⚙</button>
                      <button class="chart-reset-btn" v-if="chartOverrides['customers-table']" @click.stop="resetChartOverride('customers-table')" title="Khôi phục mặc định gốc">↩</button>
                    </div>
                  </template>
                </div>

                <!-- City Distribution -->
                <div class="editable-chart">
                  <template v-if="chartOverrides['customers-city-chart']">
                    <DashboardDynamicChart
                      :chart="chartOverrides['customers-city-chart']"
                      @edit="openChartEditWith('customers-city-chart', chartOverrides['customers-city-chart'])"
                      @remove="resetChartOverride('customers-city-chart')"
                      :isOverride="true"
                    />
                  </template>
                  <template v-else>
                    <div class="chart-card">
                        <div class="chart-header">
                            <div>
                                <div class="chart-title">📍 Phân bổ theo Tỉnh / Thành phố</div>
                                <div class="chart-sub">KH đăng ký theo khu vực</div>
                            </div>
                        </div>
                        <div class="chart-wrap" style="height:220px;display:flex;gap:16px;align-items:center">
                            <canvas id="custCityChart" style="max-height:220px;max-width:220px"></canvas>
                            <div class="chart-legend" style="flex-direction:column;gap:8px">
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#3b82f6"></div> Hà Nội (21.4%)
                                </div>
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#f59e0b"></div> TP. HCM (13.6%)
                                </div>
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#8b5cf6"></div> Đà Nẵng (9.4%)
                                </div>
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#06b6d4"></div> Singapore (4.3%)
                                </div>
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#22c55e"></div> Hải Phòng (4.2%)
                                </div>
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#ec4899"></div> Bình Dương (3.8%)
                                </div>
                                <div class="legend-item">
                                    <div class="legend-dot" style="background:#94a3b8"></div> Khác (43.3%)
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-edit-overlay">
                      <button class="chart-edit-btn" @click.stop="openChartEdit('customers-city-chart')" title="Chỉnh sửa / Cài đặt biểu đồ">⚙</button>
                      <button class="chart-reset-btn" v-if="chartOverrides['customers-city-chart']" @click.stop="resetChartOverride('customers-city-chart')" title="Khôi phục mặc định gốc">↩</button>
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
</template>

<script setup lang="ts">
import { useChartOverrides } from '~/composables/useChartOverrides';

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
} = useChartOverrides('customers');

loadCustomCharts();
loadChartOverrides();
</script>

<style scoped>
/* Scoped styles will be inherited from the parent index.vue's .crm-dashboard-theme wrapper */
</style>
