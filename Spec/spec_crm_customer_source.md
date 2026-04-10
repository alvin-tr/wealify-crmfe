# Feature Spec: Hiển thị nguồn khách hàng trên CRM

**Ngày tạo:** 2026-03-27  
**Người yêu cầu:** Lý Đặng Đức Huy  
**Trạng thái:** Draft  
**Ưu tiên:** High

---

## 1. Bối cảnh & Vấn đề

### Hiện trạng

Khi khách hàng đăng ký tài khoản Wealify, hệ thống đã ghi nhận **nguồn khách hàng** (Customer Acquisition Source) vào Database thông qua 2 cách:

1. **UTM Parameters** — tự động capture từ URL đăng ký:
   - `utm_source` — nguồn traffic (VD: `facebooknhanphi`)
   - `utm_medium` — kênh quảng cáo (VD: `cpcnhanphi`)  
   - `utm_campaign` — tên chiến dịch (VD: `q2_promonhanphi`)

2. **Form đăng ký** — câu trả lời khách hàng tự chọn (VD: "Bạn biết đến Wealify từ đâu?")

Dữ liệu này **đã tồn tại trong Database** nhưng chưa được hiển thị trên giao diện CRM.

### Vấn đề

Trang **Customer Detail** trên CRM hiện chỉ hiển thị:
- Full Name, Customer ID, Email, Phone
- Tier, Registered At, Referral Code
- Current Sales Owner
- Customer Revenue (Topup / Withdraw)

→ **Thiếu thông tin nguồn khách hàng**, khiến team Sales/CS không biết khách đến từ đâu khi chăm sóc.

---

## 2. Mục tiêu

Bổ sung section **"Nguồn khách hàng"** (Customer Source) trên trang Customer Detail của CRM, hiển thị thông tin UTM và/hoặc câu trả lời từ form đăng ký.

### Giá trị mang lại

| Đối tượng | Lợi ích |
|-----------|---------|
| **Sales** | Biết khách đến từ kênh nào → cá nhân hóa tiếp cận, tăng conversion |
| **Marketing** | Đánh giá hiệu quả kênh acquisition trực tiếp trên CRM, không cần query DB |
| **CS** | Hiểu context khách hàng tốt hơn khi hỗ trợ |
| **Management** | Có cái nhìn tổng quan về chất lượng lead theo nguồn |

---

## 3. Yêu cầu chi tiết

### 3.1. Dữ liệu hiển thị

Thêm section mới trên Customer Detail với các field sau:

| Field | Nguồn dữ liệu | Ghi chú |
|-------|----------------|---------|
| **UTM Source** | `utm_source` từ bảng UTM tracking | VD: `facebooknhanphi` |
| **UTM Medium** | `utm_medium` từ bảng UTM tracking | VD: `cpcnhanphi` |
| **UTM Campaign** | `utm_campaign` từ bảng UTM tracking | VD: `q2_promonhanphi` |
| **Nguồn tự khai báo** | Câu trả lời form đăng ký | VD: "Facebook", "Bạn bè giới thiệu"... |

### 3.2. Vị trí hiển thị trên UI

Đề xuất đặt section **"Nguồn khách hàng"** (Acquisition Source) ở panel trái của Customer Detail, ngay dưới block **Referral Code** và trên block **Current Sales Owner**:

```
┌─────────────────────────────┐
│ FULL NAME                   │
│ CUSTOMER ID                 │
│ EMAIL                       │
│ PHONE                       │
│ TIER                        │
│ REGISTERED AT               │
│ REFERRAL CODE               │
│ ─────────────────────────── │
│ ACQUISITION SOURCE    [NEW] │
│  • UTM Source: faceboo...   │
│  • UTM Medium: cpcnha...   │
│  • UTM Campaign: q2_p...   │
│  • Tự khai báo: Facebook   │
│ ─────────────────────────── │
│ CURRENT SALES OWNER         │
└─────────────────────────────┘
```

### 3.3. Logic xử lý

| Trường hợp | Hành vi |
|-------------|---------|
| Có UTM data | Hiển thị đầy đủ UTM Source, Medium, Campaign |
| Có câu trả lời form | Hiển thị "Nguồn tự khai báo" |
| Có cả hai | Hiển thị cả UTM lẫn câu trả lời form |
| Không có data nào | Hiển thị label "Acquisition Source" với giá trị `—` (dash) hoặc "Không xác định" |

### 3.4. Yêu cầu kỹ thuật

**Backend (API):**
- Mở rộng API `GET /customers/{id}` (hoặc API tương đương) để trả thêm thông tin UTM và nguồn tự khai báo
- Join dữ liệu từ bảng UTM tracking theo `customer_id`
- Join dữ liệu từ bảng registration form answers (nếu có)

**Frontend (CRM):**
- Thêm section "Acquisition Source" vào component Customer Detail
- Render các field UTM với label rõ ràng
- Handle trường hợp không có data (hiển thị fallback)

---

## 4. Scope & Phân kỳ

### Phase 1 — MVP (Đề xuất triển khai)
- [x] Dữ liệu UTM đã có trong DB ✅
- [ ] Mở rộng API trả thêm UTM data khi query customer detail
- [ ] Hiển thị UTM Source, Medium, Campaign trên CRM
- [ ] Hiển thị nguồn tự khai báo từ form đăng ký

### Phase 2 — Nâng cao (Tùy chọn)
- [ ] Cho phép filter/search khách hàng theo nguồn trên danh sách Customers
- [ ] Thống kê tổng quan số lượng khách theo từng nguồn (dashboard widget)
- [ ] Export danh sách khách hàng kèm thông tin nguồn

---

## 5. Acceptance Criteria

1. ✅ Mở Customer Detail → thấy section "Acquisition Source" với đầy đủ UTM data (nếu có)
2. ✅ Nếu khách có câu trả lời từ form đăng ký → hiển thị thêm "Nguồn tự khai báo"
3. ✅ Nếu không có data nguồn nào → hiển thị fallback phù hợp, không bị lỗi UI
4. ✅ Dữ liệu hiển thị khớp chính xác với data trong Database
5. ✅ Không ảnh hưởng performance load trang Customer Detail

---

## 6. Câu hỏi mở

> [!IMPORTANT]
> Cần xác nhận với PO/Dev trước khi triển khai:

1. **Bảng UTM tracking** trong DB có tên chính xác là gì? Có thêm field nào ngoài `utm_source`, `utm_medium`, `utm_campaign` không (VD: `utm_content`, `utm_term`)?
2. **Câu trả lời form đăng ký** được lưu ở bảng nào? Cấu trúc data như thế nào?
3. **API Customer Detail** hiện tại là endpoint nào? Có sẵn khả năng mở rộng không?
4. Có cần **phân quyền** xem thông tin nguồn khách hàng không? (VD: chỉ Admin/Sales Owner mới thấy)

---

## 7. Feedback từ Tech Team (2026-03-27)

**Reviewer:** Tech Team · **Verdict:** ✅ Khả thi — cần clarify DB schema trước khi code

### 7.1. Đánh giá tổng quan

| Hạng mục | Đánh giá |
|----------|----------|
| **Nghiệp vụ** | ✅ Rõ ràng, acceptance criteria đầy đủ |
| **UI/UX** | ✅ Vị trí hợp lý (dưới Referral Code, trên Sales Owner) |
| **Backend** | ⚠️ Cần clarify bảng UTM — xem bên dưới |
| **Frontend** | ✅ Sẵn sàng, chỉ cần thêm section vào modal Customer Info |
| **Performance** | ✅ Rủi ro thấp — LEFT JOIN thêm 1-2 bảng |

### 7.2. Gap Analysis — Trạng thái codebase hiện tại

**Backend (`crm-server`):**
- `GET /customers/:id` đã có sẵn, dễ mở rộng
- `CustomersService.findById()` hiện chỉ query 8 fields: `customer_id, full_name, email, phone_number, tier, registered_at, referral_code, tenant_id`
- Dùng raw SQL → chỉ cần thêm LEFT JOIN bảng UTM + form answers
- CRM truy cập DB qua SSH tunnel (read-only) → cần verify bảng UTM nằm cùng `wealify_db`

**Frontend (`crm-web`):**
- `customers.vue` (~3500 dòng) đã có Customer Info modal
- Interface `Customer` trong `useCustomers.ts` chưa có UTM fields → cần bổ sung
- Hệ thống fallback `"—"` đã được dùng ở nhiều nơi → áp dụng tương tự

### 7.3. Trả lời câu hỏi mở

| # | Câu hỏi | Trả lời Tech |
|---|---------|--------------|
| 1 | Bảng UTM tên gì? | ❓ **Chưa tìm thấy** trong codebase CRM. Cần DBA confirm tên + schema. |
| 2 | Bảng form đăng ký? | ❓ **Chưa tìm thấy**. Cần confirm — có thể là field trong bảng `customers` mà CRM chưa query. |
| 3 | API endpoint nào? | ✅ `GET /customers/:id` — đã có, dễ mở rộng. |
| 4 | Phân quyền? | 💡 Phase 1 không cần riêng. Ai xem được Customer Detail thì thấy Acquisition Source. |

### 7.4. Ước lượng effort

| Task | Effort |
|------|--------|
| Clarify DB schema (bảng UTM + form) | 1-2h (cần DBA) |
| Backend: mở rộng `findById()` + interface | 2h |
| Frontend: UI section + fallback | 3h |
| Testing + QA | 2h |
| **Tổng Phase 1** | **~1 ngày** |

> [!IMPORTANT]
> **Blocker:** Cần DBA/PO confirm tên bảng UTM + schema trước khi tech bắt tay code.
