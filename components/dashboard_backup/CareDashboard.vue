<template>
  <div class="space-y-6 crm-dashboard-theme">
    
                <div class="kpi-row-3">
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh. Chưa tính chính xác — cần bảng support_tickets và COUNT(*) WHERE status = 'open'.">Tickets mở</div>
                        <div class="kpi-value" style="color:var(--gold)">47</div>
                        <div class="kpi-mom down">▲ 7 tin khẩn cấp</div>
                        <div class="kpi-spark">🎫</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh. Chưa tính chính xác — cần bảng support_tickets và AVG(resolved_at - created_at).">Thời gian xử lý TB</div>
                        <div class="kpi-value">4.2h</div>
                        <div class="kpi-mom up">▼ 18% so với tuần trước</div>
                        <div class="kpi-spark">⏱️</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label" data-tooltip="Giá trị mock tĩnh. Chưa tính chính xác — cần bảng customer_feedback và AVG(rating) × 20.">Tỷ lệ hài lòng</div>
                        <div class="kpi-value">91.3%</div>
                        <div class="kpi-mom up">▲ 2.4% MoM</div>
                        <div class="kpi-spark">⭐</div>
                    </div>
                </div>

                <div class="care-grid">
                    <div class="editable-chart">
                      <template v-if="chartOverrides['care-tickets-table']">
                        <DashboardDynamicChart
                          :chart="chartOverrides['care-tickets-table']"
                          @edit="openChartEditWith('care-tickets-table', chartOverrides['care-tickets-table'])"
                          @remove="resetChartOverride('care-tickets-table')"
                          :isOverride="true"
                        />
                      </template>
                      <template v-else>
                        <div class="data-table-card h-full">
                            <div class="table-toolbar">
                                <div class="chart-title" style="flex-shrink:0">🎫 Tickets gần đây</div>
                                <button class="filter-btn active">Tất cả</button>
                                <button class="filter-btn" style="border-color:rgba(239,68,68,.4);color:#ef4444">🔴
                                    Khẩn</button>
                            </div>
                            <table class="crm-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Khách hàng</th>
                                        <th>Vấn đề</th>
                                        <th>Ưu tiên</th>
                                        <th>Trạng thái</th>
                                        <th>Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="color:var(--text-dim);font-size:.75rem">#T-2841</td>
                                        <td>
                                            <div class="cell-name">
                                                <div class="avatar-sm"
                                                    style="background:linear-gradient(135deg,#ef4444,#f59e0b)">NH</div>
                                                <div>
                                                    <div class="cell-name-text">Nguyễn Hoàng</div>
                                                    <div class="cell-name-sub">093 421 xxxx</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="color:var(--text-muted)">Không nạp được tiền</td>
                                        <td><span class="status-badge badge-urgent">🔴 Khẩn</span></td>
                                        <td><span class="status-badge badge-open">Đang xử lý</span></td>
                                        <td style="color:var(--text-dim);font-size:.75rem">5 phút trước</td>
                                    </tr>
                                    <tr>
                                        <td style="color:var(--text-dim);font-size:.75rem">#T-2840</td>
                                        <td>
                                            <div class="cell-name">
                                                <div class="avatar-sm"
                                                    style="background:linear-gradient(135deg,#7c3aed,#2563eb)">TL</div>
                                                <div>
                                                    <div class="cell-name-text">Trần Lan</div>
                                                    <div class="cell-name-sub">098 332 xxxx</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="color:var(--text-muted)">Lỗi xác thực OTP</td>
                                        <td><span class="status-badge badge-urgent">🔴 Khẩn</span></td>
                                        <td><span class="status-badge badge-open">Đang xử lý</span></td>
                                        <td style="color:var(--text-dim);font-size:.75rem">12 phút trước</td>
                                    </tr>
                                    <tr>
                                        <td style="color:var(--text-dim);font-size:.75rem">#T-2839</td>
                                        <td>
                                            <div class="cell-name">
                                                <div class="avatar-sm"
                                                    style="background:linear-gradient(135deg,#06b6d4,#14b8a6)">PV</div>
                                                <div>
                                                    <div class="cell-name-text">Phạm Văn An</div>
                                                    <div class="cell-name-sub">091 875 xxxx</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="color:var(--text-muted)">Hỏi về lãi suất VA</td>
                                        <td><span class="status-badge badge-pending">🟡 Bình thường</span></td>
                                        <td><span class="status-badge badge-open">Chờ phản hồi</span></td>
                                        <td style="color:var(--text-dim);font-size:.75rem">28 phút trước</td>
                                    </tr>
                                    <tr>
                                        <td style="color:var(--text-dim);font-size:.75rem">#T-2838</td>
                                        <td>
                                            <div class="cell-name">
                                                <div class="avatar-sm"
                                                    style="background:linear-gradient(135deg,#22c55e,#14b8a6)">LT</div>
                                                <div>
                                                    <div class="cell-name-text">Lê Thị Mai</div>
                                                    <div class="cell-name-sub">097 654 xxxx</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="color:var(--text-muted)">Yêu cầu rút tiền sớm</td>
                                        <td><span class="status-badge badge-pending">🟡 Bình thường</span></td>
                                        <td><span class="status-badge badge-resolved">Đã giải quyết</span></td>
                                        <td style="color:var(--text-dim);font-size:.75rem">1 giờ trước</td>
                                    </tr>
                                    <tr>
                                        <td style="color:var(--text-dim);font-size:.75rem">#T-2837</td>
                                        <td>
                                            <div class="cell-name">
                                                <div class="avatar-sm"
                                                    style="background:linear-gradient(135deg,#f59e0b,#ef4444)">BM</div>
                                                <div>
                                                    <div class="cell-name-text">Bùi Minh Đức</div>
                                                    <div class="cell-name-sub">096 211 xxxx</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="color:var(--text-muted)">Không đăng nhập được</td>
                                        <td><span class="status-badge badge-urgent">🔴 Khẩn</span></td>
                                        <td><span class="status-badge badge-resolved">Đã giải quyết</span></td>
                                        <td style="color:var(--text-dim);font-size:.75rem">2 giờ trước</td>
                                    </tr>
                                    <tr>
                                        <td style="color:var(--text-dim);font-size:.75rem">#T-2836</td>
                                        <td>
                                            <div class="cell-name">
                                                <div class="avatar-sm"
                                                    style="background:linear-gradient(135deg,#a78bfa,#7c3aed)">VH</div>
                                                <div>
                                                    <div class="cell-name-text">Vũ Hoàng Linh</div>
                                                    <div class="cell-name-sub">089 443 xxxx</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="color:var(--text-muted)">Cập nhật thông tin KYC</td>
                                        <td><span class="status-badge badge-active">🟢 Thấp</span></td>
                                        <td><span class="status-badge badge-resolved">Đã giải quyết</span></td>
                                        <td style="color:var(--text-dim);font-size:.75rem">3 giờ trước</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="chart-edit-overlay">
                          <button class="chart-edit-btn" @click.stop="openChartEdit('care-tickets-table')" title="Chỉnh sửa / Cài đặt biểu đồ">⚙</button>
                          <button class="chart-reset-btn" v-if="chartOverrides['care-tickets-table']" @click.stop="resetChartOverride('care-tickets-table')">↩</button>
                        </div>
                      </template>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:16px">
                        <div class="editable-chart">
                          <template v-if="chartOverrides['care-type-chart']">
                            <DashboardDynamicChart
                              :chart="chartOverrides['care-type-chart']"
                              @edit="openChartEditWith('care-type-chart', chartOverrides['care-type-chart'])"
                              @remove="resetChartOverride('care-type-chart')"
                              :isOverride="true"
                            />
                          </template>
                          <template v-else>
                            <div class="chart-card">
                                <div class="chart-title">Tickets theo loại vấn đề</div>
                                <div class="chart-wrap" style="height:180px;display:flex;gap:14px;align-items:center">
                                    <canvas id="careTypeChart" style="max-height:180px;max-width:180px"></canvas>
                                    <div class="chart-legend" style="flex-direction:column;gap:8px">
                                        <div class="legend-item">
                                            <div class="legend-dot" style="background:#ef4444"></div> Nạp/Rút tiền (34%)
                                        </div>
                                        <div class="legend-item">
                                            <div class="legend-dot" style="background:#f59e0b"></div> Lỗi kỹ thuật (28%)
                                        </div>
                                        <div class="legend-item">
                                            <div class="legend-dot" style="background:#7c3aed"></div> Hỏi sản phẩm (22%)
                                        </div>
                                        <div class="legend-item">
                                            <div class="legend-dot" style="background:#06b6d4"></div> KYC/Xác minh (16%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="chart-edit-overlay">
                              <button class="chart-edit-btn" @click.stop="openChartEdit('care-type-chart')" title="Chỉnh sửa">⚙</button>
                              <button class="chart-reset-btn" v-if="chartOverrides['care-type-chart']" @click.stop="resetChartOverride('care-type-chart')">↩</button>
                            </div>
                          </template>
                        </div>

                        <div class="editable-chart">
                          <template v-if="chartOverrides['care-week-chart']">
                            <DashboardDynamicChart
                              :chart="chartOverrides['care-week-chart']"
                              @edit="openChartEditWith('care-week-chart', chartOverrides['care-week-chart'])"
                              @remove="resetChartOverride('care-week-chart')"
                              :isOverride="true"
                            />
                          </template>
                          <template v-else>
                            <div class="chart-card">
                                <div class="chart-title">Tickets 7 ngày gần nhất</div>
                                <div class="chart-wrap" style="height:150px">
                                    <canvas id="careWeekChart"></canvas>
                                </div>
                            </div>
                            <div class="chart-edit-overlay">
                              <button class="chart-edit-btn" @click.stop="openChartEdit('care-week-chart')" title="Chỉnh sửa">⚙</button>
                              <button class="chart-reset-btn" v-if="chartOverrides['care-week-chart']" @click.stop="resetChartOverride('care-week-chart')">↩</button>
                            </div>
                          </template>
                        </div>
                    </div>
                </div>

                <div class="editable-chart">
                  <template v-if="chartOverrides['care-heatmap-chart']">
                    <DashboardDynamicChart
                      :chart="chartOverrides['care-heatmap-chart']"
                      @edit="openChartEditWith('care-heatmap-chart', chartOverrides['care-heatmap-chart'])"
                      @remove="resetChartOverride('care-heatmap-chart')"
                      :isOverride="true"
                    />
                  </template>
                  <template v-else>
                    <div class="chart-card full">
                        <div class="chart-header">
                            <div>
                                <div class="chart-title">🕐 Heatmap GD theo Giờ &amp; Ngày</div>
                                <div class="chart-sub">Cường độ giao dịch — màu càng đậm KH GD càng nhiều</div>
                            </div>
                        </div>
                        <div class="heatmap-wrap" style="padding:8px 0">
                            <div id="hour-heatmap"></div>
                            <div style="display:flex;justify-content:space-between;margin-top:8px;margin-left:36px">
                                <span style="font-size:.65rem;color:var(--text-dim)">Ít GD</span>
                                <div style="display:flex;gap:3px;align-items:center">
                                    <div
                                        style="width:60px;height:8px;border-radius:4px;background:linear-gradient(90deg,rgba(124,58,237,.08),rgba(124,58,237,.9))">
                                    </div>
                                </div>
                                <span style="font-size:.65rem;color:var(--text-dim)">Nhiều GD</span>
                            </div>
                        </div>
                    </div>
                    <div class="chart-edit-overlay">
                      <button class="chart-edit-btn" @click.stop="openChartEdit('care-heatmap-chart')" title="Chỉnh sửa">⚙</button>
                      <button class="chart-reset-btn" v-if="chartOverrides['care-heatmap-chart']" @click.stop="resetChartOverride('care-heatmap-chart')">↩</button>
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
} = useChartOverrides('care');

loadCustomCharts();
loadChartOverrides();
</script>

<style scoped>
/* Scoped styles will be inherited from the parent index.vue's .crm-dashboard-theme wrapper */
</style>
