# Đặc Tả Tính Năng (Spec): Tự Động Phân Bổ Khách Hàng (Round-Robin)

## 1. Dữ liệu từ Giao diện (Context CRM)
Dựa vào kiến trúc giao diện hiện tại của mục `Customers` (VD: Danh sách có Tiers, Sale Assignee, Total Volume...):
- **Đối tượng áp dụng:** Khách hàng mới xuất hiện trong danh sách (được tạo mới hoặc chuyển sang từ danh mục `Leads`).
- **Mục tiêu:** Tự động gán khách hàng mới cho 3 nhân sự Sales theo thứ tự xoay vòng (Round-Robin), tránh trình trạng khách hàng bị bỏ trống không có người chăm sóc (VD: User NGUYEN TIEN đang có cột `SALE` = Trống).

## 2. Luồng nghiệp vụ chính (Happy Path)
1. **Trigger (Kích hoạt - Real-time):** Ngay tại khoảnh khắc có một **Khách hàng MỚI TINH (Brand New Customer)** vừa nhảy vào hệ thống CRM (VD: đăng ký mới trên Web, đổ qua API). Các khách hàng cũ đang bị trống cột SALE trên hệ thống sẽ **không bị đụng tới** và không tham gia vào luồng chia.
2. **Execution (Phân bổ Round-Robin Đều Tức Thì):** 
   - Khi luồng tạo Khách hàng mới (Create Customer Event) chạy qua hệ thống, CRM sẽ lấy danh sách các bạn Sales đang bật nút `ON` (nhận khách) từ module **Sales Users**.
   - Áp dụng thuật toán **Round-Robin (Xoay vòng đều)** để gán khách cho từng Sale theo trật tự tuần hoàn (VD: Khách 1 -> Sale A, Khách 2 -> Sale B, Khách 3 -> Sale C, Khách 4 -> Lặp lại tịnh tiến về Sale A).
   - *Logic kỹ thuật:* Hệ thống lưu lại một biến đánh dấu trên DB/Redis (ví dụ: `last_assigned_sale_id`). Khách hàng cập bến tiếp theo sẽ tự động được gán cho nhân sự liền kề trong mảng danh sách Sales. Cuốn chiếu chia đều luân phiên 100%.
3. **System Update (Cập nhật Màn hình & Thông báo):**
   - Bản ghi Customer vừa xuất hiện trên hệ thống đã có sẵn tên người phụ trách ở cột `SALE`.
   - Bắn thông báo System Notification (hoặc Email) nhắc nhở Sale đó nhận khách mới.

5. **Auto-Revoke Tính Năng (Thu hồi khách chưa khai thác về Pool):**
   - **Trigger (Cronjob Lịch trình):** Hệ thống rà quét tự động mỗi đêm.
   - **Condition (Điều kiện Thu hồi / Giữ Khách):** 
     - **Bị thu hồi (Unassign):** Khách mới gán, nhưng qua 30 ngày hoàn toàn không có tương tác nào.
     - **Giữ vĩnh viễn (Retain):** Đã tương tác thành công tối thiểu 1 lần (có gọi điện, có note). Sau tương tác này, khách thuộc về Sale đó và không bị đếm ngược 30 ngày nữa.
     - **Ngoại lệ trả khách:** Nếu Sale tương tác nhưng điền log là *"Số sai"* hoặc *"Không liên hệ được"*, hệ thống lập tức Thu hồi (Unassign) đẩy trả khách này về Pool chung chứ không giữ.
   - **Action (Gỡ Sales):** Tự động xóa thông tin nhân viên khỏi cột `SALE` (trả về trạng thái `null` / `Unassigned`). Khách hàng sẽ quay lại kho chung (Pool).

## 3. Giao diện Cần Thay Đổi/Bổ Sung (UI/UX Impacts)
- **Module `Sales Users`:**
  - Kỹ thuật viên cần code thêm một UI / Công tắc Gạt **[Bật/Tắt Chia Khách]** hoàn toàn độc lập dành riêng cho việc chia số. Status này đứng độc lập với tình trạng đi làm (`active/inactive`) của bạn Sale. Nút này sẽ giúp Admin chủ động đóng "van xả" không cho hệ thống nôn khách thêm vào những bạn Sales đang bị quá tải công việc, dù lúc đó bạn ấy đang online làm việc bình thường.

---

## 4. Xử lý các trường hợp ngoại lệ (Edge Cases) & Phân quyền:

1. **Khách hàng bị trùng lặp (Duplicate / Returning Customer):** 
   - **Rule:** Hệ thống quét trùng khớp trường `Email` hoặc `SĐT`. Nếu phát hiện khách mới giống y hệt khách cũ và khách cũ đó đang được phụ trách bởi một Sale (vd: Phạm Ngọc Tố Tâm), hệ thống sẽ gán thẳng hồ sơ mới này về cho Phạm Ngọc Tố Tâm (Route to Owner). Không đẩy vào Random Pool.

2. **Công tắc chia số (Manual UI Toggle):**
   - **Rule:** Vòng lặp Round-Robin ở [Mục 2.2] chỉ chạy trượt vòng quanh những Sale còn đang bật nút chia khách "ON". Thấy bạn Sale nào "OFF", nó vòng qua (skip) thẳng sang bạn Sale liền kề kế tiếp.
   
3. **Luật thu hồi khách (SLA / Revocation):** 
   - **Rule:** Đã tích hợp ở Mục 2.5 (Cronjob tự động lệnh thu hồi nếu 30 ngày không có tương tác, hoặc Sale tự lưu Note là số sai).
   
3. **Tạo tay khách hàng (Manual Input Override):**
   - **Rule:** Bất cứ khi nào Admin thao tác "Manual Input" tạo trực tiếp 1 Customer, form khởi tạo vẫn cho phép Admin được chủ động trỏ/gán (Assign) nhân sự mục tiêu ở cột `SALE`. Khách hàng này sẽ được gán thủ công và không chờ chia qua luồng Random.

---

## 5. Feedback từ Tech Team (2026-03-27)

**Reviewer:** Tech Team · **Verdict:** ✅ Khả thi — đã có nền tảng, effort ~2 ngày

### 5.1. Đánh giá tổng quan

| Hạng mục | Đánh giá |
|----------|----------|
| **Round-Robin logic** | ✅ Backend xử lý 100%, không ảnh hưởng FE |
| **Toggle Bật/Tắt chia khách** | ⚠️ Cần thêm field DB + UI toggle |
| **Notification** | ✅ Đã có sẵn Pusher + `NotificationHelperService` |
| **Auto-Revoke (30 ngày)** | ⚠️ Cần cronjob mới |
| **Duplicate Routing** | ⚠️ Cần implement check trùng Email/SĐT |

### 5.2. Những gì ĐÃ CÓ sẵn trong codebase

- ✅ `CustomerAssignmentsService` — đã có `assignCustomersToSalesUser()`, `transferCustomers()`, `assignOrTransfer()`
- ✅ `SalesUsersService` — đã có `findAll()` lọc active
- ✅ Notification system — `NotificationHelperService` tạo + push Pusher real-time
- ✅ `ScheduleModule` — đã import, sẵn sàng dùng `@Cron()`
- ✅ Pattern cronjob — `MonitoringSchedulerService` đã có sẵn mẫu tham khảo

### 5.3. Những gì CẦN LÀM

**1. Toggle "Bật/Tắt Chia Khách":**
```sql
ALTER TABLE sales_users ADD COLUMN is_accepting_customers TINYINT(1) NOT NULL DEFAULT 1;
```
- Backend: endpoint `PATCH /sales-users/:id/toggle-accepting`
- Frontend: toggle switch trên trang Sales Users (thay đổi UI duy nhất)

**2. `AutoAssignService` (Round-Robin):**
- `getNextSalesUser()` — query sales có `is_accepting_customers = 1 AND status = 'active'`, sort `last_assigned_at ASC`
- `autoAssign(customerId)` → lấy next → assign → push notification
- Hook vào event tạo customer mới

**3. Duplicate Routing:**
- Check trùng Email/SĐT trước khi Round-Robin → route về owner cũ nếu có

**4. Auto-Revoke Cronjob:**
- `@Cron('0 2 * * *')` — chạy 2h sáng hàng ngày
- Khách assign > 30 ngày + 0 interaction → unassign
- Note "Số sai" / "Không liên hệ được" → unassign ngay
- Có interaction hợp lệ → retain vĩnh viễn

### 5.4. Xác nhận câu hỏi từ feedback trước (`bd-feedback-auto-assign.md`)

| Câu hỏi | Kết luận |
|---------|----------|
| Nút "ON" = active hay toggle riêng? | ✅ **Toggle độc lập** — Spec mục 3 đã nêu rõ "đứng độc lập với tình trạng đi làm" |
| Notification khi chia khách | ✅ Dùng Pusher có sẵn, Toast notification |
| Manual Assign (Admin Override) | ✅ Form assign có sẵn, nếu Admin chọn Sale → skip Round-Robin |

### 5.5. Kiến trúc đề xuất

```
Customer mới tạo (API / Web / Lead convert)
        │
        ▼
  ┌─────────────────┐
  │ Duplicate Check  │── Trùng email/phone ──▶ Route to existing Owner
  └────────┬────────┘
           │ Không trùng
           ▼
  ┌─────────────────┐
  │ Round-Robin      │── Lấy next Sales (is_accepting = 1)
  │ AutoAssignService│── Assign + Push notification
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Auto-Revoke      │── Cronjob 2h sáng
  │ (30-day SLA)     │── Unassign nếu 0 interaction
  └─────────────────┘
```

### 5.6. Ước lượng effort

| Task | Effort |
|------|--------|
| DB migration `is_accepting_customers` | 0.5h |
| Toggle endpoint + UI | 3h |
| `AutoAssignService` (Round-Robin) | 4h |
| Duplicate Routing check | 2h |
| Auto-Revoke cronjob | 3h |
| Testing toàn luồng | 3h |
| **Tổng** | **~2 ngày** |
