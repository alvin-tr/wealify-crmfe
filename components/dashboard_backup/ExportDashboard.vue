<template>
  <div class="space-y-6 crm-dashboard-theme">
    

                <div class="kpi-row" style="grid-template-columns:repeat(4,1fr)">
                    <div class="kpi">
                        <div class="kpi-label">Tổng file đã xuất</div>
                        <div class="kpi-value">24</div>
                        <div class="kpi-mom up">▲ 6 file tháng này</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Lần xuất gần nhất</div>
                        <div class="kpi-value" style="font-size:1rem">04/03/2025</div>
                        <div class="kpi-mom neutral">— leads_wealify.csv</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">KH được xuất</div>
                        <div class="kpi-value">2,847</div>
                        <div class="kpi-mom up">▲ +312 KH mới</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Lịch xuất tự động</div>
                        <div class="kpi-value" style="font-size:.9rem">Hàng tuần</div>
                        <div class="kpi-mom neutral">— Thứ 2, 07:00</div>
                    </div>
                </div>

                <!-- Quick Export Cards -->
                <div class="charts-grid" style="grid-template-columns:repeat(3,1fr)">

                    <div class="editable-chart">
                      <template v-if="chartOverrides['export-leads']">
                        <DashboardDynamicChart
                          :chart="chartOverrides['export-leads']"
                          @edit="openChartEditWith('export-leads', chartOverrides['export-leads'])"
                          @remove="resetChartOverride('export-leads')"
                          :isOverride="true"
                        />
                      </template>
                      <template v-else>
                        <div class="chart-card" style="cursor:default">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                                <div
                                    style="width:44px;height:44px;border-radius:12px;background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.3);display:flex;align-items:center;justify-content:center;font-size:1.3rem">
                                    👥</div>
                                <div>
                                    <div class="chart-title" style="margin-bottom:2px">Danh sách Leads</div>
                                    <div style="font-size:.7rem;color:var(--text-dim)">142 leads · cập nhật hôm nay</div>
                                </div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
                                <div class="detail-row"><span class="detail-row-label">Trường dữ liệu</span><span
                                        class="detail-row-value" style="font-size:.72rem">Tên, Email, SĐT, Nguồn, NV, Trạng
                                        thái, Điểm</span></div>
                                <div class="detail-row"><span class="detail-row-label">Kích thước ước tính</span><span
                                        class="detail-row-value">~28 KB</span></div>
                                <div class="detail-row"><span class="detail-row-label">Định dạng</span><span
                                        class="detail-row-value">CSV (UTF-8 BOM)</span></div>
                            </div>
                            <div style="display:flex;gap:8px">
                                <button class="export-btn" style="flex:1;justify-content:center"
                                    onclick="exportLeadsCSV()">⬇️ Xuất CSV</button>
                                <button class="export-btn"
                                    style="flex:1;justify-content:center;background:rgba(37,99,235,.12);border-color:rgba(37,99,235,.3);color:#60a5fa"
                                    onclick="exportLeadsFiltered()">🔍 Xuất theo lọc</button>
                            </div>
                        </div>
                        <div class="chart-edit-overlay">
                          <button class="chart-edit-btn" @click.stop="openChartEdit('export-leads')" title="Chỉnh sửa">⚙</button>
                          <button class="chart-reset-btn" v-if="chartOverrides['export-leads']" @click.stop="resetChartOverride('export-leads')">↩</button>
                        </div>
                      </template>
                    </div>

                    <div class="editable-chart">
                      <template v-if="chartOverrides['export-customers']">
                        <DashboardDynamicChart
                          :chart="chartOverrides['export-customers']"
                          @edit="openChartEditWith('export-customers', chartOverrides['export-customers'])"
                          @remove="resetChartOverride('export-customers')"
                          :isOverride="true"
                        />
                      </template>
                      <template v-else>
                        <div class="chart-card" style="cursor:default">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                                <div
                                    style="width:44px;height:44px;border-radius:12px;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);display:flex;align-items:center;justify-content:center;font-size:1.3rem">
                                    💎</div>
                                <div>
                                    <div class="chart-title" style="margin-bottom:2px">Danh sách Khách hàng</div>
                                    <div style="font-size:.7rem;color:var(--text-dim)">2,847 KH · tất cả tier</div>
                                </div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
                                <div class="detail-row"><span class="detail-row-label">Trường dữ liệu</span><span
                                        class="detail-row-value" style="font-size:.72rem">Tên, Email, Tier, Volume, GD gần
                                        nhất, NV</span></div>
                                <div class="detail-row"><span class="detail-row-label">Kích thước ước tính</span><span
                                        class="detail-row-value">~190 KB</span></div>
                                <div class="detail-row"><span class="detail-row-label">Định dạng</span><span
                                        class="detail-row-value">CSV (UTF-8 BOM)</span></div>
                            </div>
                            <div style="display:flex;gap:8px">
                                <button class="export-btn" style="flex:1;justify-content:center"
                                    onclick="exportCustomersCSV()">⬇️ Xuất toàn bộ</button>
                                <button class="export-btn"
                                    style="flex:1;justify-content:center;background:rgba(103,232,249,.08);border-color:rgba(103,232,249,.3);color:#67e8f9"
                                    onclick="exportDiamondCSV()">💎 Chỉ Diamond</button>
                            </div>
                        </div>
                        <div class="chart-edit-overlay">
                          <button class="chart-edit-btn" @click.stop="openChartEdit('export-customers')" title="Chỉnh sửa">⚙</button>
                          <button class="chart-reset-btn" v-if="chartOverrides['export-customers']" @click.stop="resetChartOverride('export-customers')">↩</button>
                        </div>
                      </template>
                    </div>

                    <div class="editable-chart">
                      <template v-if="chartOverrides['export-ceo']">
                        <DashboardDynamicChart
                          :chart="chartOverrides['export-ceo']"
                          @edit="openChartEditWith('export-ceo', chartOverrides['export-ceo'])"
                          @remove="resetChartOverride('export-ceo')"
                          :isOverride="true"
                        />
                      </template>
                      <template v-else>
                        <div class="chart-card" style="cursor:default">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                                <div
                                    style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;font-size:1.3rem">
                                    📊</div>
                                <div>
                                    <div class="chart-title" style="margin-bottom:2px">Báo cáo CEO Dashboard</div>
                                    <div style="font-size:.7rem;color:var(--text-dim)">Doanh thu, LN, Top KH, Upgrade Watch
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
                                <div class="detail-row"><span class="detail-row-label">Trường dữ liệu</span><span
                                        class="detail-row-value" style="font-size:.72rem">Revenue, Margin, Top 20 KH,
                                        Cohort</span></div>
                                <div class="detail-row"><span class="detail-row-label">Kích thước ước tính</span><span
                                        class="detail-row-value">~45 KB</span></div>
                                <div class="detail-row"><span class="detail-row-label">Định dạng</span><span
                                        class="detail-row-value">CSV (UTF-8 BOM)</span></div>
                            </div>
                            <div style="display:flex;gap:8px">
                                <button class="export-btn" style="flex:1;justify-content:center"
                                    onclick="exportCEOReport()">⬇️ Xuất báo cáo</button>
                                <button class="export-btn"
                                    style="flex:1;justify-content:center;background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:#fbbf24"
                                    onclick="exportTopCustCSV()">🏆 Top 20 KH</button>
                            </div>
                        </div>
                        <div class="chart-edit-overlay">
                          <button class="chart-edit-btn" @click.stop="openChartEdit('export-ceo')" title="Chỉnh sửa">⚙</button>
                          <button class="chart-reset-btn" v-if="chartOverrides['export-ceo']" @click.stop="resetChartOverride('export-ceo')">↩</button>
                        </div>
                      </template>
                    </div>

                </div>

                <!-- Export History + Scheduled -->
                <div class="bottom-row" style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px">

                    <div class="editable-chart">
                      <template v-if="chartOverrides['export-history']">
                        <DashboardDynamicChart
                          :chart="chartOverrides['export-history']"
                          @edit="openChartEditWith('export-history', chartOverrides['export-history'])"
                          @remove="resetChartOverride('export-history')"
                          :isOverride="true"
                        />
                      </template>
                      <template v-else>
                        <div class="table-card h-full">
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                                <div class="chart-title">📋 Lịch sử Xuất dữ liệu</div>
                                <div style="font-size:.7rem;color:var(--text-dim)">30 ngày gần nhất</div>
                            </div>
                            <table style="width:100%;border-collapse:collapse;font-size:.76rem">
                                <thead>
                                    <tr>
                                        <th
                                            style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.6rem;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.06em">
                                            File</th>
                                        <th
                                            style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.6rem;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.06em">
                                            Loại</th>
                                        <th
                                            style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.6rem;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.06em">
                                            Thời gian</th>
                                        <th
                                            style="text-align:left;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.6rem;color:var(--text-dim);font-weight:700;text-transform:uppercase;letter-spacing:.06em">
                                            Người xuất</th>
                                        <th style="padding:7px 10px;border-bottom:1px solid var(--border)"></th>
                                    </tr>
                                </thead>
                                <tbody id="export-history-tbody"></tbody>
                            </table>
                        </div>
                        <div class="chart-edit-overlay">
                          <button class="chart-edit-btn" @click.stop="openChartEdit('export-history')" title="Chỉnh sửa">⚙</button>
                          <button class="chart-reset-btn" v-if="chartOverrides['export-history']" @click.stop="resetChartOverride('export-history')">↩</button>
                        </div>
                      </template>
                    </div>

                    <div class="editable-chart">
                      <template v-if="chartOverrides['export-schedule']">
                        <DashboardDynamicChart
                          :chart="chartOverrides['export-schedule']"
                          @edit="openChartEditWith('export-schedule', chartOverrides['export-schedule'])"
                          @remove="resetChartOverride('export-schedule')"
                          :isOverride="true"
                        />
                      </template>
                      <template v-else>
                        <div class="chart-card h-full" style="cursor:default">
                            <div class="chart-title" style="margin-bottom:14px">⏰ Lịch Tự động Export</div>
                            <div style="display:flex;flex-direction:column;gap:10px" id="schedule-list">
                                <div class="detail-section" style="cursor:pointer;transition:border-color .2s"
                                    onmouseover="this.style.borderColor='rgba(124,58,237,.3)'"
                                    onmouseout="this.style.borderColor='var(--border)'">
                                    <div style="display:flex;justify-content:space-between;align-items:center">
                                        <div>
                                            <div style="font-size:.8rem;font-weight:600;color:var(--text)">📧 Báo cáo tuần
                                            </div>
                                            <div style="font-size:.7rem;color:var(--text-dim);margin-top:3px">Leads +
                                                Customers · Thứ 2, 07:00</div>
                                        </div>
                                        <label class="toggle-switch"><input type="checkbox" checked
                                                onchange="toggleSchedule(this,'weekly')"><span
                                                class="toggle-slider"></span></label>
                                    </div>
                                </div>
                                <div class="detail-section" style="cursor:pointer;transition:border-color .2s"
                                    onmouseover="this.style.borderColor='rgba(124,58,237,.3)'"
                                    onmouseout="this.style.borderColor='var(--border)'">
                                    <div style="display:flex;justify-content:space-between;align-items:center">
                                        <div>
                                            <div style="font-size:.8rem;font-weight:600;color:var(--text)">📊 Báo cáo tháng
                                            </div>
                                            <div style="font-size:.7rem;color:var(--text-dim);margin-top:3px">CEO Dashboard
                                                · Ngày 1, 08:00</div>
                                        </div>
                                        <label class="toggle-switch"><input type="checkbox" checked
                                                onchange="toggleSchedule(this,'monthly')"><span
                                                class="toggle-slider"></span></label>
                                    </div>
                                </div>
                                <div class="detail-section" style="cursor:pointer;transition:border-color .2s"
                                    onmouseover="this.style.borderColor='rgba(124,58,237,.3)'"
                                    onmouseout="this.style.borderColor='var(--border)'">
                                    <div style="display:flex;justify-content:space-between;align-items:center">
                                        <div>
                                            <div style="font-size:.8rem;font-weight:600;color:var(--text)">⚡ Cảnh báo ngưỡng
                                            </div>
                                            <div style="font-size:.7rem;color:var(--text-dim);margin-top:3px">Xuất khi Churn
                                                >5% hoặc KH sắp Diamond</div>
                                        </div>
                                        <label class="toggle-switch"><input type="checkbox"
                                                onchange="toggleSchedule(this,'alert')"><span
                                                class="toggle-slider"></span></label>
                                    </div>
                                </div>
                            </div>
                            <button class="export-btn" style="width:100%;margin-top:16px;justify-content:center"
                                onclick="addSchedule()">+ Thêm lịch mới</button>
                        </div>
                        <div class="chart-edit-overlay">
                          <button class="chart-edit-btn" @click.stop="openChartEdit('export-schedule')" title="Chỉnh sửa">⚙</button>
                          <button class="chart-reset-btn" v-if="chartOverrides['export-schedule']" @click.stop="resetChartOverride('export-schedule')">↩</button>
                        </div>
                      </template>
                    </div>

                </div>

                <!-- Chart: Export volume trend -->
                <div class="editable-chart">
                  <template v-if="chartOverrides['export-trend']">
                    <DashboardDynamicChart
                      :chart="chartOverrides['export-trend']"
                      @edit="openChartEditWith('export-trend', chartOverrides['export-trend'])"
                      @remove="resetChartOverride('export-trend')"
                      :isOverride="true"
                    />
                  </template>
                  <template v-else>
                    <div class="chart-card full">
                        <div class="chart-header">
                            <div>
                                <div class="chart-title">📈 Lượt Xuất dữ liệu theo tháng</div>
                                <div class="chart-sub">Số file được xuất thủ công + tự động</div>
                            </div>
                        </div>
                        <div class="chart-wrap" style="height:200px"><canvas id="exportTrendChart"></canvas></div>
                    </div>
                    <div class="chart-edit-overlay">
                      <button class="chart-edit-btn" @click.stop="openChartEdit('export-trend')" title="Chỉnh sửa">⚙</button>
                      <button class="chart-reset-btn" v-if="chartOverrides['export-trend']" @click.stop="resetChartOverride('export-trend')">↩</button>
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
} = useChartOverrides('export');

loadCustomCharts();
loadChartOverrides();
</script>

<style scoped>
/* Scoped styles will be inherited from the parent index.vue's .crm-dashboard-theme wrapper */
</style>
