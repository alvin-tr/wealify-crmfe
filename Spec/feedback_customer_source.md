# Feedback Spec: Hiển thị nguồn khách hàng (Customer Acquisition Source)

**Ngày review:** 2026-03-27  
**Reviewer:** Tech Team  
**Spec gốc:** `spec_crm_customer_source.md`  
**Verdict:** ✅ Khả thi — cần clarify DB schema trước khi code

---

## 1. Đánh giá tổng quan

Spec viết rõ ràng, luồng nghiệp vụ hợp lý. Tính năng thuần **read-only** (chỉ hiển thị, không ghi), nên rủi ro triển khai thấp. Giá trị mang lại cụ thể cho Sales/Marketing/CS.

| Hạng mục | Đánh giá |
|----------|----------|
| **Nghiệp vụ** | ✅ Rõ ràng, acceptance criteria đầy đủ |
| **UI/UX** | ✅ Vị trí hợp lý (dưới Referral Code, trên Sales Owner) |
| **Backend** | ⚠️ Cần clarify bảng UTM — xem Mục 2 |
| **Frontend** | ✅ Sẵn sàng, chỉ cần thêm section vào `customers.vue` |
| **Performance** | ✅ Rủi ro thấp — LEFT JOIN thêm 1-2 bảng |

---

## 2. Trạng thái codebase hiện tại (Gap Analysis)

### Backend (`crm-server`)

**Hiện tại:** `CustomersService.findById()` chỉ query 8 fields từ bảng `customers`:
```
customer_id, full_name, email, phone_number, tier, registered_at, referral_code, tenant_id
```

**Cần làm:**
1. Xác định chính xác **tên bảng UTM** trong DB (chưa thấy trong codebase CRM hiện tại)
2. Mở rộng `findById()` thêm LEFT JOIN bảng UTM + bảng form answers
3. Cập nhật interface `Customer` thêm fields: `utm_source`, `utm_medium`, `utm_campaign`, `self_declared_source`

> [!IMPORTANT]
> **Blocker #1:** Bảng UTM tracking nằm trong DB chính (`wealify_db`) nhưng CRM chỉ có read-only access qua SSH tunnel (`DatabaseService`). Cần verify bảng UTM có trong cùng DB không, hay nằm ở DB khác.

### Frontend (`crm-web`)

**Hiện tại:** `customers.vue` (~3500 dòng) có sẵn Customer Info modal (`openCustomerInfoModal`). Interface `Customer` trong `useCustomers.ts` không có UTM fields.

**Cần làm:**
1. Cập nhật interface `Customer` trong `composables/useCustomers.ts`
2. Thêm section "Acquisition Source" vào Customer Info modal/panel
3. Handle fallback khi không có data (hiển thị "—")

---

## 3. Trả lời các câu hỏi mở (Mục 6 trong Spec)

| # | Câu hỏi | Trả lời từ Tech |
|---|---------|-----------------|
| 1 | Bảng UTM tên gì? | ❓ **Chưa xác định** — Không tìm thấy reference trong codebase CRM hiện tại. Cần DBA/Backend team confirm tên bảng + schema. Có thể là `customer_utm_tracking` hoặc `registration_utm_params`. |
| 2 | Bảng form đăng ký ở đâu? | ❓ **Chưa xác định** — Tương tự, cần confirm. Có thể là `registration_answers` hoặc field trong bảng `customers` mà CRM chưa query. |
| 3 | API Customer Detail là endpoint nào? | ✅ `GET /customers/:id` — endpoint đã có sẵn, dễ mở rộng. Service dùng raw SQL nên chỉ cần thêm LEFT JOIN. |
| 4 | Phân quyền xem thông tin nguồn? | 💡 **Đề xuất:** Không cần phân quyền riêng cho Phase 1. Tất cả users có quyền xem Customer Detail đều thấy Acquisition Source. Nếu cần restrictive hơn, có thể dùng hệ thống permissions đã có (`usePermissions.ts`). |

---

## 4. Ước lượng effort

| Task | Effort | Ghi chú |
|------|--------|---------|
| Clarify DB schema (bảng UTM + form) | 1-2h | Cần DBA support |
| Backend: mở rộng `findById()` + interface | 2h | Thêm LEFT JOIN |
| Frontend: UI section + fallback | 3h | Trong Customer Info modal |
| Testing + QA | 2h | Verify data khớp DB |
| **Tổng Phase 1** | **~1 ngày** | |

---

## 5. Đề xuất action items

1. **[BLOCK]** DBA/PO confirm tên bảng UTM + schema (fields, foreign key)
2. **[BLOCK]** Confirm bảng form đăng ký có tồn tại không, nếu có thì schema
3. Sau khi có (1) + (2) → Backend mở rộng API
4. Frontend hiện thị section mới
5. Phase 2 (filter/search theo nguồn) có thể plan sau khi Phase 1 stable
