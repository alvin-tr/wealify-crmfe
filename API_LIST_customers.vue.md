# Danh sách API được sử dụng trong `pages/customers.vue`

## 1. Customers API

### GET `/customers`
- **Composable**: `useCustomers().fetchCustomers()`
- **Mục đích**: Lấy danh sách tất cả customers
- **Response**: `{ success: boolean, data: Customer[] }`
- **Cache**: Có cache với timeout 10 phút
- **Sử dụng**: Hiển thị danh sách customers trong bảng

---

## 2. Sales Users API

### GET `/sales-users`
- **Composable**: `useSalesUsers().fetchSalesUsers()`
- **Mục đích**: Lấy danh sách sales users để assign customers
- **Response**: `{ success: boolean, data: SalesUser[] }`
- **Sử dụng**: 
  - Dropdown chọn sales user trong modal "Assign Sale"
  - Filter customers theo sales user

---

## 3. Customer Assignments API

### GET `/customer-assignments/sales-with-customers`
- **Composable**: `useCustomerAssignments().fetchSalesWithCustomers()`
- **Mục đích**: Lấy danh sách sales users kèm danh sách customers được assign
- **Response**: `{ success: boolean, data: SalesUserWithCustomers[] }`
- **Sử dụng**: 
  - Hiển thị sales user cho mỗi customer trong bảng
  - Tính toán số lượng customers đã được assign
  - Hiển thị thông tin assignment (date, note)

### POST `/customer-assignments/assign-or-transfer`
- **Composable**: `useCustomerAssignments().assignOrTransferCustomers()`
- **Mục đích**: Assign hoặc transfer customers cho sales user
- **Method**: POST
- **Body**: 
  ```typescript
  {
    target_sales_user_id: number
    customer_ids: number[]
    note?: string | null
  }
  ```
- **Response**: 
  ```typescript
  {
    success: boolean
    target_sales_user_id: number
    customer_ids: number[]
    newly_assigned: number
    transferred: number
    skipped: number
    details: Array<{
      customer_id: number
      action: 'assigned' | 'transferred' | 'skipped'
      previous_sales_user_id: number | null
    }>
  }
  ```
- **Sử dụng**: 
  - Assign single customer trong modal "Assign Sale"
  - Bulk assign multiple customers đã chọn

---

## 4. Customer Groups API

### GET `/customer-groups`
- **Composable**: `useCustomerGroups().fetchCustomerGroups()`
- **Mục đích**: Lấy danh sách tất cả customer groups
- **Response**: `{ success: boolean, data: CustomerGroupWithDetails[] }`
- **Sử dụng**: 
  - Dropdown chọn group trong modal "Add Customers to Group"
  - Hiển thị groups mà customer thuộc về trong bảng

### GET `/customer-groups/:groupId/members`
- **Composable**: `useCustomerGroups().fetchGroupMembers(groupId)`
- **Mục đích**: Lấy danh sách members của một group
- **Response**: `{ success: boolean, data: CustomerGroupMember[] }`
- **Sử dụng**: 
  - Pre-load members để build customer-to-group mapping
  - Hiển thị groups trong bảng customers

### POST `/customer-groups/:groupId/members/bulk`
- **Composable**: `useCustomerGroups().addGroupMembers(groupId, payload)`
- **Mục đích**: Thêm nhiều customers vào group cùng lúc
- **Method**: POST
- **Body**: 
  ```typescript
  {
    customer_ids: number[]
    note?: string | null
  }
  ```
- **Response**: 
  ```typescript
  {
    success: boolean
    data: {
      added: number
      failed: number
      customer_ids: number[]
      errors: Array<{
        customer_id: number
        error: string
      }>
    }
  }
  ```
- **Sử dụng**: 
  - Thêm multiple customers đã chọn vào group trong modal "Add Customers to Group"
  - Xử lý partial success (một số thành công, một số thất bại)

---

## 5. Monitoring API

### GET `/monitoring/customer-volumes`
- **Function**: `fetchCustomerVolumes()` (local function trong component)
- **Mục đích**: Lấy volume data (30d và total) cho customers
- **Response**: `{ success?: boolean, data?: CustomerVolume[] }`
- **Response Data Structure**:
  ```typescript
  CustomerVolume[] = Array<{
    customer_id: number
    volume_last_30d: number
    total_volume: number
    tx_count_30d: number
    last_tx_at: Date | null
    last_topup_at: Date | null
    volume_change_rate: number
    avg_volume_30d: number
    failed_tx_ratio: number
  }>
  ```
- **Sử dụng**: 
  - Hiển thị "Volume (30d)" và "Total Volume" trong bảng customers
  - Enrich customer data với volume information

---

## Tóm tắt

| # | API Endpoint | Method | Composable/Function | Mục đích |
|---|-------------|--------|-------------------|----------|
| 1 | `/customers` | GET | `useCustomers().fetchCustomers()` | Lấy danh sách customers |
| 2 | `/sales-users` | GET | `useSalesUsers().fetchSalesUsers()` | Lấy danh sách sales users |
| 3 | `/customer-assignments/sales-with-customers` | GET | `useCustomerAssignments().fetchSalesWithCustomers()` | Lấy sales users với customers |
| 4 | `/customer-assignments/assign-or-transfer` | POST | `useCustomerAssignments().assignOrTransferCustomers()` | Assign/transfer customers |
| 5 | `/customer-groups` | GET | `useCustomerGroups().fetchCustomerGroups()` | Lấy danh sách groups |
| 6 | `/customer-groups/:groupId/members` | GET | `useCustomerGroups().fetchGroupMembers()` | Lấy members của group |
| 7 | `/customer-groups/:groupId/members/bulk` | POST | `useCustomerGroups().addGroupMembers()` | Thêm customers vào group |
| 8 | `/monitoring/customer-volumes` | GET | `fetchCustomerVolumes()` | Lấy volume data cho customers |

---

## Lưu ý

- Tất cả API đều yêu cầu authentication headers (Authorization token)
- API `/customers` có cache mechanism với timeout 10 phút
- API `/customer-groups/:groupId/members/bulk` trả về partial success response với thông tin chi tiết về errors
- API `/customer-assignments/assign-or-transfer` cũng trả về detailed response với số lượng assigned/transferred/skipped












