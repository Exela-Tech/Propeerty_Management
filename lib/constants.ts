// User roles available in the system
export const USER_ROLES = {
  ADMIN: "admin",
  LANDLORD: "landlord",
  TENANT: "tenant",
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  landlord: 2,
  tenant: 1,
}

// Check if a role has sufficient permissions
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// Maintenance request statuses
export const MAINTENANCE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

// Maintenance request priorities
export const MAINTENANCE_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const
