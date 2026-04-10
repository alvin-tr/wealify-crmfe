import { computed } from 'vue'
import customersPermissions from '~/permissions/customers'
import groupsPermissions from '~/permissions/groups'
import monitoringPermissions from '~/permissions/monitoring'
import leadsPermissions from '~/permissions/leads'
import customerCarePermissions from '~/permissions/customer-care'

// Type definitions for permissions
export type PermissionKey = keyof typeof customersPermissions

// Permission configs for each page/module
const permissionConfigs = {
  customers: customersPermissions,
  groups: groupsPermissions,
  monitoring: monitoringPermissions,
  leads: leadsPermissions,
  customerCare: customerCarePermissions,
  // Add more pages here as needed
  // tasks: tasksPermissions,
} as const

export type PermissionModule = keyof typeof permissionConfigs

/**
 * Composable to check permissions for a specific module and action
 * @param module - The module name (e.g., 'customers')
 * @param action - The action name (e.g., 'addToGroup')
 * @returns boolean indicating if the current user has permission
 */
export const usePermissions = () => {
  const auth = useAuth()
  
  const userRole = computed(() => {
    const role = auth.user.value?.role
    return role ? role.toLowerCase() : null
  })

  /**
   * Check if user has permission for a specific action in a module
   */
  const hasPermission = (module: PermissionModule, action: string): boolean => {
    const userRoleValue = userRole.value
    if (!userRoleValue) return false

    const modulePermissions = permissionConfigs[module]
    if (!modulePermissions) return false

    const allowedRoles = (modulePermissions as Record<string, string[]>)[action]
    if (!allowedRoles || allowedRoles.length === 0) {
      // If no roles specified, allow all (backward compatibility)
      return true
    }

    return allowedRoles.map(r => r.toLowerCase()).includes(userRoleValue)
  }

  /**
   * Get all permissions for a specific module
   */
  const getModulePermissions = (module: PermissionModule) => {
    return permissionConfigs[module] || {}
  }

  /**
   * Check multiple permissions at once (returns true if ALL are allowed)
   */
  const hasAllPermissions = (module: PermissionModule, actions: string[]): boolean => {
    return actions.every(action => hasPermission(module, action))
  }

  /**
   * Check multiple permissions at once (returns true if ANY is allowed)
   */
  const hasAnyPermission = (module: PermissionModule, actions: string[]): boolean => {
    return actions.some(action => hasPermission(module, action))
  }

  return {
    userRole,
    hasPermission,
    getModulePermissions,
    hasAllPermissions,
    hasAnyPermission,
  }
}

