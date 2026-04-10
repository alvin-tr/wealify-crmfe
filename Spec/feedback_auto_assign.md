# Feedback Spec: Auto-Assign Round-Robin

**Ngày review:** 2026-03-27  
**Reviewer:** Tech Team  
**Spec gốc:** `crm-auto-assign-spec.md` + `bd-feedback-auto-assign.md`  
**Verdict:** ✅ Khả thi — đã có nền tảng, cần bổ sung toggle UI + cronjob revoke

---

## 1. Đánh giá tổng quan

Spec từ BD rõ ràng, nghiệp vụ Round-Robin được mô tả chi tiết. Feedback trước đó (file `bd-feedback-auto-assign.md`) đã raise đúng 2 điểm cần clarify. Dưới đây là đánh giá kỹ thuật sau khi cross-check toàn bộ codebase.

| Hạng mục | Đánh giá |
|----------|----------|
| **Round-Robin logic** | ✅ Backend xử lý 100%, không ảnh hưởng FE |
| **Toggle Bật/Tắt chia khách** | ⚠️ Cần thêm field `is_accepting_customers` vào bảng `sales_users` + UI toggle |
| **Notification** | ✅ Đã có sẵn hệ thống Pusher + `NotificationHelperService` |
| **Auto-Revoke (30 ngày)** | ⚠️ Cần cronjob mới + logic check interactions |
| **Duplicate Routing** | ⚠️ Cần implement trùng Email/SĐT check |

---

## 2. Trạng thái codebase hiện tại

### Những gì ĐÃ CÓ sẵn

| Component | Sẵn sàng | Chi tiết |
|-----------|----------|----------|
| `CustomerAssignmentsService` | ✅ | Đã có `assignCustomersToSalesUser()`, `assignOrTransferCustomers()`, `transferCustomersBetweenSalesUsers()` |
| `SalesUsersService` | ✅ | Đã có `findAll()` lọc `status <> 'inactive'` |
| Notification system | ✅ | `NotificationHelperService` tạo notification + push Pusher real-time |
| `@nestjs/schedule` | ✅ | Đã import `ScheduleModule.forRoot()` trong `app.module.ts`, sẵn sàng dùng `@Cron()` |
| `MonitoringSchedulerService` | ✅ | Đã có pattern cronjob, có thể tham khảo |

### Những gì CẦN LÀM

#### 2.1. Toggle "Bật/Tắt Chia Khách" (UI + DB)

**Database:**
```sql
ALTER TABLE sales_users 
ADD COLUMN is_accepting_customers TINYINT(1) NOT NULL DEFAULT 1;
```

**Backend:** Thêm endpoint `PATCH /sales-users/:id/toggle-accepting` + cập nhật `findAll()` trả thêm field mới.

**Frontend:** Thêm toggle switch vào trang Sales Users management. Đây là thay đổi UI duy nhất cần thiết.

#### 2.2. Round-Robin Service (mới)

Tạo service `AutoAssignService` trong module `customer-assignments`:
- `getNextSalesUser()` — query sales users có `is_accepting_customers = 1 AND status = 'active'`, sort theo `last_assigned_at ASC` (hoặc dùng counter `last_assigned_sale_id`)
- `autoAssign(customerId)` — lấy next sales user → gọi `assignCustomersToSalesUser()` → gửi notification
- Hook vào event tạo customer mới (hoặc expose API cho upstream service gọi)

#### 2.3. Duplicate Routing

Trước khi Round-Robin, check:
```sql
SELECT ca.sales_user_id 
FROM customer_assignments ca
JOIN customers c ON c.customer_id = ca.customer_id
WHERE (c.email = ? OR c.phone_number = ?)
  AND ca.sales_user_id IS NOT NULL
LIMIT 1
```
Nếu có → route thẳng về owner cũ. Nếu không → Round-Robin.

#### 2.4. Auto-Revoke Cronjob

Tạo `AutoRevokeSchedulerService`:
- Chạy mỗi đêm (VD: `@Cron('0 2 * * *')` — 2h sáng)
- Query khách được assign > 30 ngày + không có interaction nào
- Hoặc có interaction nhưng note chứa "Số sai" / "Không liên hệ được" → unassign ngay
- Có interaction hợp lệ → retain vĩnh viễn, skip

---

## 3. Trả lời câu hỏi từ feedback trước

### Câu 1: Nút "ON" = active hay toggle riêng?

> **Kết luận kỹ thuật:** Nên làm **toggle độc lập** (`is_accepting_customers`) vì:
> - Spec BD mục 3 nêu rõ: *"Status này đứng độc lập với tình trạng đi làm"*
> - Use case "quá tải nhưng vẫn online" là hợp lệ
> - Không phá vỡ logic `status` hiện tại

### Câu 2: Các tác động UI

| Luồng | Xác nhận |
|-------|----------|
| Notification khi chia khách | ✅ Dùng Pusher có sẵn, Toast notification |
| Manual Assign (Admin Override) | ✅ Form assign có sẵn, nếu Admin chọn Sale → skip Round-Robin |
| Toggle UI | ⚠️ Cần thêm 1 nút gạt trên trang Sales Users |

---

## 4. Ước lượng effort

| Task | Effort | Priority |
|------|--------|----------|
| DB migration: thêm `is_accepting_customers` | 0.5h | P0 |
| Backend: Toggle endpoint | 1h | P0 |
| Frontend: Toggle UI trên Sales Users | 2h | P0 |
| Backend: `AutoAssignService` (Round-Robin) | 4h | P0 |
| Backend: Duplicate Routing check | 2h | P1 |
| Backend: Auto-Revoke cronjob | 3h | P1 |
| Testing toàn luồng | 3h | P0 |
| **Tổng** | **~2 ngày** | |

---

## 5. Kiến trúc đề xuất

```
Customer tạo mới (API / Web / Lead convert)
        │
        ▼
  ┌─────────────────┐
  │ Duplicate Check  │──── Trùng email/phone ──▶ Route to existing Owner
  │ (email / phone)  │
  └────────┬────────┘
           │ Không trùng
           ▼
  ┌─────────────────┐
  │ Round-Robin      │──── Lấy next Sales User (is_accepting = 1)
  │ AutoAssignService│──── Assign customer
  └────────┬────────┘──── Push notification via Pusher
           │
           ▼
  ┌─────────────────┐
  │ Auto-Revoke      │──── Cronjob 2h sáng hàng ngày
  │ (30-day SLA)     │──── Check interactions
  └─────────────────┘──── Unassign nếu không tương tác
```

---

## 6. Action items

1. **[DONE]** BD đã confirm toggle độc lập (Spec mục 3)
2. **[TODO]** Chạy migration thêm column `is_accepting_customers`
3. **[TODO]** Implement `AutoAssignService` + duplicate check
4. **[TODO]** Implement Auto-Revoke cronjob
5. **[TODO]** Frontend: toggle UI trên Sales Users page
6. **[TODO]** E2E test toàn luồng: tạo khách → auto-assign → notification → 30-day revoke
