# CRM Web – System Documentation

> **Stack:** Nuxt 3 · Vue 3 · Nuxt UI v3 · Tailwind CSS v4 · Pusher.js  
> **Default Port:** `3000` (Nuxt dev server)  
> **API Backend:** `crm-server` tại `http://localhost:4000` (cấu hình qua `NUXT_PUBLIC_API_BASE`)

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Cài đặt & Chạy](#2-cài-đặt--chạy)
3. [Biến môi trường](#3-biến-môi-trường)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Pages & Routes](#5-pages--routes)
6. [Composables](#6-composables)
7. [Components](#7-components)
8. [Permissions System](#8-permissions-system)
9. [Authentication Flow](#9-authentication-flow)
10. [Real-time Notifications](#10-real-time-notifications)
11. [E2E Testing (Playwright)](#11-e2e-testing-playwright)
12. [Gỡ lỗi & Bảo trì](#12-gỡ-lỗi--bảo-trì-troubleshooting--maintenance)
13. [Lưu ý về Backend Architecture](#13-lưu-ý-về-backend-architecture-cho-frontend-developer)
14. [Settings Page - Server Logs](#14-settings-page---server-logs-admin-only)
15. [Settings Page - Auto-Assign Toggle](#15-settings-page---auto-assign-toggle)

---

## 1. Tổng quan

CRM Web là giao diện quản lý khách hàng, leads, tasks, và monitoring. Được xây dựng trên:

- **Nuxt 3** – SSR/SSG framework cho Vue 3
- **Nuxt UI v3** – Component library (buttons, modals, tables, tooltips...)
- **Tailwind CSS v4** – Utility-first CSS
- **Pusher.js** – Real-time notifications
- **viewerjs** – Image viewer
- **vue-draggable-plus** – Drag & drop
- **xlsx** – Excel export/import

---

## 2. Cài đặt & Chạy

```bash
# Cài đặt
npm install

# Development server (http://localhost:3000)
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## 3. Biến môi trường

Tạo file `.env` hoặc cấu hình qua `nuxt.config.ts`:

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `NUXT_PUBLIC_API_BASE` | URL backend API | `http://localhost:4000` |
| `NUXT_PUBLIC_PUSHER_KEY` | Pusher app key | – |
| `NUXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster | `ap1` |

---

## 4. Cấu trúc thư mục

```
crm-web/
├── app.vue                     # Root component (UApp + NuxtLayout + icon preload)
├── nuxt.config.ts              # Nuxt configuration
├── package.json
│
├── assets/
│   └── css/
│       ├── main.css            # Global styles
│       ├── slds-icons.css      # Salesforce-style icons
│       └── social-icons.css    # Social platform icons
│
├── components/
│   ├── HeaderBar.vue           # Top navigation bar (notifications, user menu)
│   ├── SidebarMenu.vue         # Side navigation menu
│   ├── customer-care/          # Customer care components
│   ├── groups/                 # Group management components
│   ├── leads/                  # Lead management components (9 files)
│   └── tasks/                  # Task components
│
├── composables/                # Vue composables (business logic hooks)
│   ├── useAuth.ts              # Authentication state & methods
│   ├── useCustomers.ts         # Customer data fetching
│   ├── useCustomerAssignments.ts  # Assignment operations
│   ├── useCustomerGroups.ts    # Group CRUD operations
│   ├── useCustomerInteractions.ts # Interaction tracking
│   ├── useEmbedUrl.ts          # Embed URL management
│   ├── useImageViewer.ts       # Image viewer logic
│   ├── useLeads.ts             # Lead pipeline operations
│   ├── useNotifications.ts     # Notification system + Pusher
│   ├── usePermissions.ts       # Role-based permission checker
│   ├── useSalesRequests.ts     # Approval request operations
│   ├── useSalesUsers.ts        # Sales user data
│   ├── useTasks.ts             # Task management
│   └── useUsers.ts             # User management
│
├── layouts/
│   └── default.vue             # Main layout (sidebar + header + content)
│
├── middleware/
│   ├── auth.global.ts          # Global auth check (redirect to /login)
│   └── auth.ts                 # Route-specific auth guard
│
├── pages/
│   ├── index.vue               # Dashboard / Home page
│   ├── login.vue               # Login page
│   ├── customers.vue           # Customer management (main page ~124K)
│   ├── settings.vue            # User settings, monitoring, user mgmt, server logs (admin)
│   ├── customer-care/          # Customer care section
│   ├── groups/                 # Group management
│   ├── leads/                  # Lead pipeline
│   ├── sales-requests/         # Approval requests
│   ├── sales-users/            # Sales team management
│   └── tasks/                  # Task management
│
├── permissions/                # Role-permission definitions
│   ├── customers.ts            # Customer page permissions
│   ├── customer-care.ts        # Customer care permissions
│   ├── groups.ts               # Group permissions
│   ├── leads.ts                # Lead permissions
│   ├── monitoring.ts           # Monitoring permissions
│   └── README.md               # Permissions system docs
│
├── public/                     # Static assets
├── server/                     # Nuxt server middleware
└── types/                      # TypeScript type definitions
```

---

## 5. Pages & Routes

| Route | File | Mô tả |
|-------|------|--------|
| `/` | `pages/index.vue` | Dashboard tổng quan |
| `/login` | `pages/login.vue` | Trang đăng nhập |
| `/customers` | `pages/customers.vue` | Quản lý khách hàng (bảng chính, assign, groups) |
| `/customer-care/*` | `pages/customer-care/` | CSKH workflows |
| `/groups/*` | `pages/groups/` | Quản lý nhóm khách |
| `/leads/*` | `pages/leads/` | Lead pipeline management |
| `/tasks/*` | `pages/tasks/` | Task management (Kanban/list view) |
| `/sales-users/*` | `pages/sales-users/` | Quản lý nhân viên sales |
| `/sales-requests/*` | `pages/sales-requests/` | Yêu cầu assign khách |
| `/settings` | `pages/settings.vue` | Cài đặt hệ thống, monitoring, user mgmt, **server logs (admin)** |

---

## 6. Composables

### `useAuth()`
Quản lý trạng thái đăng nhập:
- `login(username, password)` → gọi API, lưu token + user vào localStorage
- `logout()` → xóa session, redirect `/login`
- `user` → reactive user object
- `token` → current auth token
- `isLoggedIn` → computed boolean

### `useCustomers()`
- `fetchCustomers()` → danh sách khách hàng (bao gồm `volume_last_1d`, `volume_last_7d`, `volume_last_30d`)
- `fetchCustomerById(id)` → chi tiết 1 khách

### `useCustomerAssignments()`
- `fetchSalesWithCustomers(salesUserId?)` → sales users kèm khách
- `assignCustomers(salesUserId, customerIds, note?)` → assign khách
- `transferCustomers(from, to, customerIds, note?)` → chuyển khách
- `assignOrTransfer(targetSalesUserId, customerIds, note?)` → smart assign
- `getSalesInfoByCustomerId(customerId)` → tra cứu sales theo khách

### `useCustomerGroups()`
- CRUD groups: `fetchGroups()`, `createGroup()`, `updateGroup()`, `deleteGroup()`
- Members: `addMembers()`, `removeMember()`

### `useCustomerInteractions()`
- `createInteraction(payload, files?)` → tạo interaction có file
- `fetchByCustomer(id)` → lịch sử theo khách
- `fetchMetrics(filters?)` → metrics tổng hợp
- `fetchOverview(filters?)` → overview today/week/month

### `useLeads()`
- Full lead lifecycle: `fetchLeads()`, `createLead()`, `updateLead()`, `deleteLead()`
- Contacts: `fetchLeadContacts()`, `createContact()`, `updateContact()`, `deleteContact()`
- Assignments: `bulkAssign()`, `fetchAssignments()`
- Interactions: `fetchInteractions()`, `createInteraction()`
- Lookup: `fetchStatuses()`, `fetchStages()`, `fetchSources()`
- Statistics: `fetchStatistics()`
- Import: `importFromExcel(file)`

### `useTasks()`
- CRUD: `fetchTasks(filters?)`, `createTask(dto, files?)`, `updateTask()`, `archiveTask()`
- Assignees: `addAssignees()`, `removeAssignees()`
- Customers: `addCustomers()`, `removeCustomers()`
- Comments: `getComments()`, `addComment(content, files?)`, `deleteComment()`
- Files: `getFiles()`, `uploadFiles()`, `deleteFile()`

### `useNotifications()`
- `fetchNotifications(options?)` → danh sách notifications
- `fetchUnreadCount()` → đếm unread
- `markAsSeen(id)` → mark seen
- `markAllAsSeen()` → mark all
- `deleteNotification(id)` → xóa
- Pusher integration: auto-subscribe khi login, real-time updates

### `usePermissions()`
- `hasPermission(module, action)` → kiểm tra quyền theo role
- `hasAllPermissions(module, actions[])` → tất cả phải có
- `hasAnyPermission(module, actions[])` → chỉ cần 1

### `useSalesRequests()`
- `createRequest(params)` → tạo yêu cầu assign
- `listRequests(filter?)` → danh sách (admin)
- `listMyRequests()` → requests của mình
- `approveRequest(id)` → duyệt
- `rejectRequest(id, reason?)` → từ chối

---

## 7. Components

### Core Layout
| Component | Mô tả |
|-----------|--------|
| `HeaderBar.vue` | Top bar: search, notifications bell (real-time badge), user dropdown |
| `SidebarMenu.vue` | Left sidebar: navigation menu, role-based visibility |

### Feature Components
| Thư mục | Components | Mô tả |
|---------|-----------|--------|
| `leads/` | 9 components | Lead form, contact editor, pipeline board, interaction log, task manager |
| `groups/` | 2 components | Group creation form, member management |
| `customer-care/` | 3 components | Customer care workflows |
| `tasks/` | 1 component | Task card / detail view |

---

## 8. Permissions System

### Cách hoạt động
1. **Định nghĩa** quyền theo module trong `permissions/*.ts`:
   ```typescript
   // permissions/customers.ts
   export default {
     addToGroup: ["admin", "sale_manager"],
     assignSale: ["admin", "sale_manager"],
     saleFilter: ["admin", "sale_manager", "mkt"],
   }
   ```

2. **Sử dụng** trong components:
   ```vue
   <script setup>
   const { hasPermission } = usePermissions()
   const canAssign = computed(() => hasPermission('customers', 'assignSale'))
   </script>
   
   <template>
     <UButton v-if="canAssign" @click="assign">Assign</UButton>
   </template>
   ```

### Permissions hiện tại

| Module | Action | Roles |
|--------|--------|-------|
| `customers` | `addToGroup` | admin, sale_manager |
| `customers` | `assignSale` | admin, sale_manager |
| `customers` | `saleFilter` | admin, sale_manager, mkt |
| `groups` | `createGroup` | admin, sale_manager |
| `groups` | `editGroup` | admin, sale_manager |
| `groups` | `deleteGroup` | admin |
| `leads` | `assignLead` | admin, sale_manager |
| `leads` | `deleteLead` | admin |

---

## 9. Authentication Flow

```
┌──────────┐     POST /auth/login     ┌──────────────┐
│  Login   │ ─────────────────────▶  │  crm-server  │
│  Page    │ ◀─────────────────────  │              │
│          │   { token, user }        │              │
└────┬─────┘                          └──────────────┘
     │
     │ localStorage.setItem('auth_token', token)
     │ localStorage.setItem('auth_user', JSON.stringify(user))
     │
     ▼
┌──────────┐   Authorization: Bearer <token>
│  App     │ ────────────────────────────────── All API requests
│  Pages   │
└──────────┘
```

### Middleware
- **`auth.global.ts`** – Chạy trên **mọi route**: kiểm tra token trong localStorage, redirect về `/login` nếu không có
- **`auth.ts`** – Route-specific guard cho pages cần auth level cao hơn

### Token Storage
- Token lưu trong `localStorage` key: `auth_token`
- User info lưu trong `localStorage` key: `auth_user`
- Khi load app, composable `useAuth()` tự khôi phục state từ localStorage

---

## 10. Real-time Notifications

### Kiến trúc

```
crm-server                         crm-web
┌────────────────────┐             ┌────────────────────┐
│ NotificationHelper │             │ useNotifications() │
│   .create()        │             │                    │
│      │             │             │   Pusher.subscribe │
│      ▼             │   Pusher    │   'private-user-X' │
│ Pusher.trigger()  ─┼────────────▶│      │              │
│                    │             │      ▼              │
│                    │             │   Update badge      │
│                    │             │   Show toast        │
└────────────────────┘             └────────────────────┘
```

### Setup
1. `useNotifications()` khởi tạo Pusher client với key từ `runtimeConfig`
2. Subscribe vào `private-user-{userId}` channel
3. Listen event `new-notification`:
   - Update unread count badge trên HeaderBar
   - Hiển thị toast notification
   - Refresh notification list nếu đang mở

### Channel Authentication
Pusher private channels yêu cầu auth:
- Client gửi `POST /notifications/pusher/auth` với `{ socket_id, channel_name }`
- Server verify user ownership, trả về auth signature

---

## 11. E2E Testing (Playwright)

> **⚠️ QUAN TRỌNG: Mỗi lần code xong tính năng mới hoặc fix bug, PHẢI chạy test trước khi deploy.**

### Setup

```bash
npm install -D @playwright/test    # Đã cài sẵn
npx playwright install chromium     # Đã cài sẵn
```

### Cấu trúc test (15 files, 101 tests)

```
crm-web/
├── playwright.config.ts               # Config: Chromium, headless, 3 workers, 60s timeout, 1 retry
└── e2e/
    ├── helpers.ts                     # Login utility, error capture
    │
    │── [Smoke Tests — Page loads & core rendering]
    ├── login.spec.ts                  # Login flow (5 tests)
    ├── customers.spec.ts              # Customers page (8 tests)
    ├── leads.spec.ts                  # Leads + Navigation (7 tests)
    ├── dashboard.spec.ts              # Dashboard (2 tests)
    ├── tasks.spec.ts                  # Tasks Kanban (6 tests)
    ├── groups.spec.ts                 # Groups table (5 tests)
    ├── sales-requests.spec.ts         # Sales Requests (4 tests)
    ├── settings.spec.ts               # Settings tabs (7 tests)
    │
    │── [Feature Tests — Buttons, modals, filters, CRUD]
    ├── customers-features.spec.ts     # Filters, select-all, sort, export (12 tests)
    ├── tasks-features.spec.ts         # Create modal, validation, upload, deadline (10 tests)
    ├── groups-features.spec.ts        # CRUD, expand, volume stats, care history (10 tests)
    ├── leads-features.spec.ts         # Stats, More Details, header buttons (8 tests)
    ├── settings-features.spec.ts      # User form, role/status, monitoring tab (8 tests)
    ├── sales-requests-features.spec.ts# Tabs, columns, badges, view details (7 tests)
    │
    │── [Edge Cases]
    └── auth-guard.spec.ts             # Auth redirect for unauthenticated users (3 tests)
```

### Chạy test

```bash
# Chạy tất cả 101 tests (~6 phút)
npx playwright test

# Chạy chỉ smoke tests
npx playwright test e2e/login.spec.ts e2e/customers.spec.ts e2e/leads.spec.ts

# Chạy chỉ feature tests
npx playwright test e2e/*-features.spec.ts

# Chạy với UI mode để debug
npx playwright test --ui

# Chạy với output chi tiết
npx playwright test --reporter=list
```

### Quy trình an toàn

```
Code xong → npx playwright test → ✅ All green → Deploy
                                → ❌ Có đỏ → Fix trước khi push
```

### Yêu cầu khi chạy test
- `crm-server` phải đang chạy ở `localhost:4000` (`npm run start:dev`)
- `crm-web` phải đang chạy ở `localhost:3000` (`npm run dev`)
- Database local phải có data (chạy `node scripts/sync-prod-db.js` nếu cần)

---

## 12. Gỡ lỗi & Bảo trì (Troubleshooting & Maintenance)

### Mẹo khắc phục UI/UX Bug
| Hiện tượng lỗi | Nơi sửa (File) | Giải pháp đã áp dụng / Gợi ý |
|----------------|----------------|-------------------------------|
| **Bảng Table bị trôi ngang, mất cột bên phải** | `pages/customers.vue` | Bảng dùng `table-fixed w-full`. Cần đảm bảo tổng `%` của các thẻ `<th>` không vượt quá `100%`. (Ví dụ: ID 4%, Sale 8%, Email 12%...). Đã fix: scale vừa khít khung màn hình. |
| **Dropdown chọn Số lượng / User bị lag giật mạnh** | `pages/customers.vue`, `pages/sales-users/index.vue` | Không render toàn bộ dropdown nếu Item quá lớn (>1000). Đã giới hạn pagination dropdown tối đa `100` page size. |
| **Menu Dropdown (Select) báo "No data" mặc dù có Data** | Component `USelectMenu` | Nuxt UI `USelectMenu` bắt buộc phải map thuộc tính `value-attribute="id"` và kiểu dữ liệu `v-model` phải đồng nhất (Number vs String) với danh sách options. Đã fix trong Bulk Transfer modal. |
| **Giao diện Sidebar Menu / Layout bị lệch khi resize** | `components/SidebarMenu.vue` | Quản lý trạng thái `isCollapsed`. Icon và Label cần bọc trong thẻ wrapper cố định chiều rộng hoặc xoá hẳn text `v-if="!isCollapsed"`. |
| **Lỗi F5 (Refresh) sập trang 500 do SSR Bundle (XLSX)** | `pages/customers.vue` & `history.vue` | Nuxt Nitro không thể bundle file phụ thuộc `cpexcel.js` tĩnh của thư viện `xlsx`. Bắt buộc đổi sang import động `await import('xlsx')` ngay bên trong hàm sự kiện Excel để bypass SSR. |
| **Bấm chuyển sang xem Dashboard người khác nhưng không nhảy** | `composables/useChartOverrides.ts` & `index.vue` | Fix lỗi bất đồng bộ trạng thái (Reactivity Bug). Biến `adminTargetUserId` bắt buộc phải bọc bằng `useCookie` ở mọi file hook. Không được dùng `useState` local vì Cookie không cross-update tự động làm kẹt target. |
| **Dashboard tạo xong bị mất sau F5** | Backend: `dashboard.service.ts` | Lỗi ở backend — save/load settings dùng nhầm AWS read-only DB (ghi thất bại âm thầm). Xem `crm-server/docs/CROSS_CLOUD_DATABASE.md` Bug #4. |
| **Dashboard dropdown bảng chỉ hiện `(undefined)`** | Backend: `dashboard.service.ts` | Lỗi ở backend — schema discovery query AWS thay vì DigitalOcean. Xem Bug #2. |
| **Bảng Customers trống / lỗi 500** | Backend: `customers.service.ts` | Lỗi ở backend — SQL SELECT cột `source_id` không tồn tại trên AWS. Xem Bug #1. |
| **Biểu đồ tròn Doughnut không hiện con số cụ thể** | `DynamicChart.vue` / `ChartBuilder.vue` | Vốn dĩ `vue-chartjs` chỉ hiển thị khối màu. Đã cài đặt `chartjs-plugin-datalabels` và pass plugin object qua `:plugins` prop kết hợp `display: isDoughnut` in `options` để hiển thị nhãn nổi. |
| **Tooltip hiển thị RAW SQL rác (vd `COUNT(Tất cả...)`)** | `DynamicChart.vue` / `ChartBuilder.vue` | Quá trình generate nhãn bị ghép nguyên thủy từ Backend Whitelist. Đã cấu hình logic bóc tách `yColumn === '*'` chuyển thành `"Đếm tổng số"` gọn gàng, tăng độ chuyên nghiệp UI. |
| **Server Logs tab trống — "Disconnected"** | `pages/settings.vue` → `connectSSE()` | `EventSource` (SSE) không gửi được custom headers. Fix: gửi token qua `?token=xxx` query param trong URL, backend `TokenAuthGuard` hỗ trợ cả header và query param. |
| **System Info hiển thị dấu gạch (—)** | `pages/settings.vue` → `loadSystemInfo()` | `$fetch` gọi `/server-logs/system-info` không gửi auth header. Fix: thêm `headers: auth?.getAuthHeaders?.()` vào `$fetch` options. |
| **History logs không load** | `pages/settings.vue` → `loadHistory()` | Tương tự system-info — thiếu auth headers. Fix: thêm `headers: auth?.getAuthHeaders?.()`. |
| **Notification click không chuyển trang** | `components/HeaderBar.vue` | Notification data chứa `customer_id` nhưng click handler không navigate. Fix: parse `data.customer_id` và `navigateTo('/customers?customer_id=X')`. |

### Kiến trúc mở rộng Frontend Component
- **Thêm Cột mới vào Bảng Khách Hàng:**
  1. Thêm `key` và `label` vào mảng `availableColumns` (khoảng dòng 1520 trong `customers.vue`).
  2. Bổ sung `<th>` với `v-if="isShowColumn('new_col')"` vào dòng 530+. Tính lại `%` width cho phù hợp 100%.
  3. Bổ sung `<td>` vào dòng 640+.
  4. Nếu cần sort: thêm `@click="toggleSort('new_col')"` vào `<th>` và thêm sort handler trong `filteredCustomers`.
  5. Nếu data từ monitoring API: thêm field vào `CustomerVolume` interface và enrichment trong `paginatedCustomers`.
  6. Cập nhật export Excel nếu cần.

- **Cột Volume hiện tại:**
  | Tên cột | key | Data field | Nguồn |
  |---------|-----|-----------|-------|
  | Volume(30d) | `volume_30d` | `volume_last_30d` | `GET /monitoring/customer-volumes` |
  | Volume(7d) | `volume_7d` | `volume_last_7d` | `GET /monitoring/customer-volumes` |
  | Volume(Today) | `volume_today` | `volume_last_1d` | `GET /monitoring/customer-volumes` |
  | Total Vol | `total_volume` | `total_volume` | `GET /monitoring/customer-volumes` |

- **Tích hợp tính năng gọi API mới:**
  1. Tạo hoặc sử dụng Composable tương ứng trong `composables/` (vd: `useCustomers.ts`).
  2. Dùng `$fetch` kèm Bearer token (thường lấy từ `useAuth()`).
  3. Quản lý trạng thái loading `pending` và catch error để hiển thị Toast (dùng `const toast = useToast()`).

---

## 13. Lưu ý về Backend Architecture (Cho Frontend Developer)

> **⚠️ QUAN TRỌNG:** Backend CRM chạy trên kiến trúc "split-brain" — 2 MySQL database tách biệt hoàn toàn. Điều này ảnh hưởng trực tiếp đến frontend.

### Tại sao Frontend cần biết?

| Vấn đề | Dev | Prod | Hậu quả Frontend |
|--------|-----|------|-------------------|
| Cột `source_id` trên customers | Tồn tại | **Không tồn tại** | API trả 500 → bảng trống |
| `monitoring_transactions_summary` | Cùng DB | **Khác DB** | Dashboard metric builder lỗi |
| Dashboard settings save | Thành công | **Thất bại âm thầm** | Dữ liệu mất sau F5 |

### Quy tắc cho Frontend Dev

1. **Nếu một field hiển thị trên Dev nhưng không hiển thị trên Prod** → Kiểm tra xem backend có đang SELECT cột không tồn tại trên AWS hay không
2. **Nếu data lưu được trên Dev nhưng mất trên Prod** → Backend đang INSERT vào AWS read-only (cần đổi sang `writeDatabaseService`)
3. **Nếu Dashboard/Chart lỗi trên Prod nhưng Dev OK** → Bảng đó không tồn tại trên AWS, cần route sang DigitalOcean

### Tài liệu Backend chi tiết
Xem: [`../crm-server/docs/CROSS_CLOUD_DATABASE.md`](../crm-server/docs/CROSS_CLOUD_DATABASE.md)

---

## 14. Settings Page — Server Logs (Admin-only)

Tab **"Server Logs"** trong `pages/settings.vue` cho phép admin xem logs server **real-time** mà không cần SSH.

### Giao diện

| Thành phần | Mô tả |
|------------|--------|
| **System Info Panel** | 4 cards: Uptime, Memory (Heap), Database (latency + status), Auto-Assign (ON/OFF + count) |
| **Level Filter Pills** | Toggle: LOG (xanh), WARN (vàng), ERROR (đỏ), DEBUG (xanh dương), VERBOSE (tím) |
| **Search** | Filter theo message hoặc context |
| **Terminal Viewer** | Dark theme (#0d1117), monospace font, auto-scroll, 520px height |
| **Live Indicator** | Dot xanh + "Live" khi SSE connected, đỏ "Disconnected" khi mất kết nối |

### SSE Authentication Workaround

`EventSource` browser API **KHÔNG** hỗ trợ custom headers. Token phải gửi qua **query param**:

```typescript
// settings.vue — SSE connection
const connectSSE = () => {
  const token = auth?.token?.value || '';
  // Token qua query param vì EventSource không gửi headers
  const url = `${apiBaseUrl}/server-logs/stream${token ? '?token=' + encodeURIComponent(token) : ''}`;
  eventSource = new EventSource(url);
  
  eventSource.addEventListener('log', (event: any) => {
    const entry: LogEntry = JSON.parse(event.data);
    logEntries.value.push(entry);
    // Giữ tối đa 1000 entries trên client
    if (logEntries.value.length > 1000) {
      logEntries.value = logEntries.value.slice(-1000);
    }
    scrollToBottom();
  });
};

// REST calls — auth qua headers (bình thường)
const loadHistory = async () => {
  const data = await $fetch(`${apiBaseUrl}/server-logs/history`, {
    headers: auth?.getAuthHeaders?.() ?? {},
  });
};
```

### Tab Lifecycle

```
Vào tab "Server Logs"
  ├── loadHistory()    → Lấy logs từ DB (bao gồm cả phiên trước)
  ├── loadSystemInfo() → Lấy uptime, memory, DB status
  └── connectSSE()     → Bắt đầu stream real-time

Rời tab / Unmount
  └── disconnectSSE()  → Đóng EventSource
  
SSE Error (mất kết nối)
  └── Auto-reconnect sau 3 giây
```

> **Lưu ý khi mở rộng**: Nếu thêm endpoint mới cần SSE, phải:
> 1. Backend: Đảm bảo `TokenAuthGuard` hỗ trợ `?token=` query param (đã implement)
> 2. Frontend: Append token vào URL, KHÔNG dùng headers cho EventSource

---

## 15. Settings Page — Auto-Assign Toggle

Tab **"User management"** trong `pages/settings.vue` cho phép admin bật/tắt tự động chia khách cho từng sales.

### Cơ chế bật/tắt

| Trạng thái | Điều kiện | Hành vi |
|------------|-----------|---------|
| **Tính năng BẬT** | ≥ 1 sales user có `is_accepting_customers = 1` | Cron chạy mỗi 2 phút, set watermark nếu chưa có |
| **Tính năng TẮT** | 0 sales user đang accepting | Xóa watermark — khách cũ khi bật lại sẽ KHÔNG bị assign |

### Toggle API

```typescript
// Toggle is_accepting_customers cho 1 sales user
PATCH /sales-users/:id/toggle-accepting

// Backend response
{
  "success": true,
  "is_accepting_customers": 1,  // hoặc 0
  "message": "Auto-accepting enabled for user X"
}
```

### Watermark Rule (QUAN TRỌNG)

> ⚠️ Khi tất cả sales tắt accepting → **watermark bị xóa**. Khi bật lại:
> - Watermark được set = NOW() 
> - Khách tạo TRƯỚC thời điểm bật lại → **KHÔNG BỊ ASSIGN**
> - Chỉ khách tạo SAU watermark mới được tự động chia

### Hiển thị trên System Info

```json
// GET /server-logs/system-info → autoAssign section
{
  "autoAssign": {
    "featureEnabled": true,
    "acceptingUsersCount": 2,
    "watermark": "2026-04-01 08:50:00",
    "lastProcessedId": "1234"
  }
}
```

### Backend Reference
Xem: [`../crm-server/docs/AUTO_ASSIGN.md`](../crm-server/docs/AUTO_ASSIGN.md) — Chi tiết cron logic, cross-cloud JOIN, auto-revoke
