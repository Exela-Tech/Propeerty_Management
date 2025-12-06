export type UserRole = "admin" | "seller" | "blocker" | "landlord"

export type PropertyStatus = "pending" | "approved" | "rejected"

export type PropertyType = "house" | "apartment" | "condo" | "townhouse" | "studio" | "land"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  landlord_id: string
  title: string
  description: string
  property_type: PropertyType
  listing_type: "sale" | "rent"
  address: string
  city: string
  state: string
  zip_code: string
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  rent_amount: number | null
  sale_price: number | null
  deposit_amount: number | null
  currency: "UGX" | "USD"
  parking: boolean
  furnished: boolean
  status: PropertyStatus
  owner_role?: UserRole
  images: string[] | null
  amenities: string[] | null
  available_from: string | null
  created_at: string
  updated_at: string
}

export interface RentPayment {
  id: string
  tenant_id: string | null
  amount: number
  currency: "UGX" | "USD"
  due_date: string
  paid_date: string | null
  status: string
  stripe_payment_id: string | null
  created_at: string
  updated_at: string
}

// Re-export Result types for convenience
export type { Result, AppError, ErrorCodeType } from './result'
export { ErrorCode, success, failure, createError, toAppError } from './result'
