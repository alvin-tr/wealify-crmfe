# Permissions System

Hệ thống phân quyền theo từng trang/module, giúp quản lý quyền truy cập các action cụ thể một cách rõ ràng và dễ maintain.

## Cấu trúc

```
permissions/
  ├── customers.ts    # Permissions cho trang Customers
  ├── tasks.ts       # Permissions cho trang Tasks (ví dụ)
  └── README.md      # Documentation
```

## Cách sử dụng

### 1. Định nghĩa permissions cho một module

Tạo file trong thư mục `permissions/`:

```typescript
// permissions/customers.ts
export default {
  addToGroup: ["admin", "sale_manager"],
  assignSale: ["admin", "sale_manager"],
  saleFilter: ["admin", "sale_manager", "mkt"],
}
```

### 2. Sử dụng trong components

```vue
<script setup lang="ts">
const { hasPermission } = usePermissions()

// Kiểm tra quyền cho một action
const canAddToGroup = computed(() => hasPermission('customers', 'addToGroup'))
const canAssignSale = computed(() => hasPermission('customers', 'assignSale'))
const canUseSaleFilter = computed(() => hasPermission('customers', 'saleFilter'))
</script>

<template>
  <!-- Chỉ hiển thị button nếu có quyền -->
  <UButton 
    v-if="canAddToGroup"
    @click="openAddToGroupModal"
  >
    Add to Group
  </UButton>

  <UButton 
    v-if="canAssignSale"
    @click="openBulkAssignSaleModal"
  >
    Assign Sale
  </UButton>

  <!-- Hoặc disable thay vì ẩn -->
  <UButton 
    :disabled="!canAssignSale"
    @click="handleAction"
  >
    Assign Sale
  </UButton>
</template>
```

### 3. Kiểm tra nhiều quyền cùng lúc

```typescript
const { hasAllPermissions, hasAnyPermission } = usePermissions()

// Tất cả quyền phải có
const canManageCustomers = computed(() => 
  hasAllPermissions('customers', ['addToGroup', 'assignSale'])
)

// Chỉ cần một trong các quyền
const canViewCustomers = computed(() => 
  hasAnyPermission('customers', ['saleFilter', 'assignSale'])
)
```

## Lợi ích

✅ **Tách biệt logic**: Permissions được định nghĩa riêng, không lẫn với business logic  
✅ **Dễ maintain**: Chỉ cần sửa một file khi thay đổi quyền  
✅ **Type-safe**: TypeScript hỗ trợ autocomplete và type checking  
✅ **Mở rộng dễ dàng**: Thêm module mới chỉ cần tạo file mới  
✅ **Tái sử dụng**: Composable có thể dùng ở bất kỳ component nào  

## Thêm module mới

1. Tạo file `permissions/[module-name].ts`
2. Export default object với các permissions
3. Import vào `composables/usePermissions.ts` và thêm vào `permissionConfigs`

```typescript
// permissions/tasks.ts
export default {
  createTask: ["admin", "sales", "sale_manager"],
  deleteTask: ["admin"],
  assignTask: ["admin", "sale_manager"],
}
```

```typescript
// composables/usePermissions.ts
import tasksPermissions from '~/permissions/tasks'

const permissionConfigs = {
  customers: customersPermissions,
  tasks: tasksPermissions, // Thêm vào đây
} as const
```

