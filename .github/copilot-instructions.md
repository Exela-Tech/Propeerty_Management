# Copilot Instructions for Property Management System

## Project Overview
**Exela Property Management Software** is a Next.js-based internal admin/staff system for property managers. It tracks properties, units, tenants, payments, maintenance, and accounting—but **landlords are data records only** with no login access. Only admin/staff users can access the system.

## Architecture

### Stack & Key Technologies
- **Frontend**: Next.js 14+ with React, TypeScript, Server Components
- **Backend**: Next.js API routes with Server Actions
- **Database**: Supabase (PostgreSQL) with RLS (Row Level Security)
- **Auth**: Supabase Auth with JWT + cookie-based sessions
- **UI**: Radix UI components + Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **Payment**: Stripe integration
- **Rate Limiting**: Upstash Redis

### Data Layer Architecture
```
lib/supabase/
  ├── server.ts    → Server-side client (cookies from request context)
  ├── client.ts    → Browser client (cookies from document.cookie)
  └── middleware.ts → Auth middleware for route protection
```

**Critical**: Use `createServerClient` from `@supabase/ssr` in API routes (request-scoped), not from `@supabase/supabase-js`.

### API Response Pattern
All API routes use standardized error handling via `lib/api-response.ts`:
```typescript
// Success: { success: true, data: T, message?: string }
// Error: { success: false, error: { message, code?, details? } }
successResponse(data, statusCode)
notFoundResponse(resource)
handleApiError(error)
```

Validation: Use `validateUUID()` for IDs before DB queries.

### Role-Based Access Control (RBAC)
- **Super Admin**: Full system access, manage admins
- **Admin**: Full feature access, manage staff/landlords/properties
- **Landlord**: Manage own properties (but can't log in—data only)
- **Tenant**: View own lease, submit maintenance, view payments
- **Maintenance Staff**: View/update assigned requests

Database table: `role_permissions` (resource, role, can_view/create/edit/delete/approve). Use `hasPermission(role, resource, action)` from `lib/permissions.ts` before sensitive operations.

## Development Workflow

### Build & Run
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Run ESLint
```

### Database Schema
Core tables:
- `tenants` – User records with financial state (balance, monthly_rent, prepaid_balance)
- `tenant_payments` – Payment records (amount, payment_date, payment_period, receipt_number)
- `properties` – Property records linked to landlords via owner_id
- `units` – Units within properties (monthly_rent, currency)
- `profiles` – Auth users (role, is_active, status)
- `chart_of_accounts` – GL account definitions
- `general_ledger` – All financial transactions
- `bank_accounts`, `payment_deposits` – Cash management

## Code Patterns & Conventions

### Server Actions Pattern (Mutations)
```typescript
// In app/(dashboard)/[resource]/actions.ts
"use server"

export async function updateProperty(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Validate user auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  
  // 2. Check permissions
  const canEdit = await hasPermission(userRole, "properties", "edit")
  if (!canEdit) throw new Error("Forbidden")
  
  // 3. Validate input
  const id = formData.get("id")
  if (!validateUUID(id)) throw new Error("Invalid ID")
  
  // 4. Execute mutation
  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return data
}
```

### API Route Pattern – Separate Queries for Related Data
**Important**: When fetching related data (tenant + property + unit), **fetch separately** rather than using nested selects. This avoids Supabase join ambiguities:

```typescript
// In app/api/payments/[id]/receipt/route.ts
export async function GET(request, { params: { id } }) {
  try {
    // 1. Fetch payment
    const { data: payment, error: paymentError } = await supabase
      .from("tenant_payments")
      .select("*")
      .eq("id", id)
      .single()

    if (paymentError || !payment) return notFoundResponse("Payment")

    // 2. Fetch tenant (separate query)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", payment.tenant_id)
      .single()

    if (!tenant) return notFoundResponse("Tenant")

    // 3. Fetch property (separate query)
    const { data: property } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", tenant.property_id)
      .single()

    // 4. Fetch unit (separate query)
    const { data: unit } = await supabase
      .from("units")
      .select("id, unit_number")
      .eq("id", tenant.unit_id)
      .single()

    // 5. Return combined response
    return successResponse({
      ...payment,
      tenant: { ...tenant, ... },
      property,
      unit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Client Component Pattern
```typescript
"use client"

import { useState, useEffect, useTransition } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export function MyComponent() {
  const [state, setState] = useState()
  const [isPending, startTransition] = useTransition()
  
  // For queries: useEffect + fetch API
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/resource")
      const data = await res.json()
      setState(data)
    }
    load()
  }, [])
  
  // For mutations: startTransition + server action
  const handleUpdate = () => {
    startTransition(async () => {
      await updateProperty(formData)
    })
  }
  
  return (...)
}
```

## Component Structure

### Key Directories
- `app/(dashboard)/` → Protected routes (wrapped in RoleGuard)
- `app/auth/` → Auth pages (login, signup, password reset)
- `app/api/` → API endpoints (organized by resource)
- `components/` → Reusable UI components
  - `role-guard.tsx` → Wraps routes requiring specific roles
  - `edit-property-form.tsx` → Form example using React Hook Form
  - `property-actions.tsx` → Server action buttons

### Forms Pattern
Use React Hook Form + Zod:
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const schema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
})

export function MyForm() {
  const form = useForm({ resolver: zodResolver(schema) })
  
  const onSubmit = async (data) => {
    startTransition(async () => await serverAction(data))
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("name")} />
    </form>
  )
}
```

## Important Security Patterns

### RLS (Row Level Security)
- Supabase RLS policies enforce user isolation
- API routes must verify auth before querying
- Never trust client-side role checks—always verify on server

### Input Validation
- Use `validateUUID()` for IDs
- API validation: `lib/api-validation.ts`
- Form validation: Zod schemas
- **Always validate on server**, even if client validates

### Activity Logging
```typescript
await logActivity(userId, "update", "properties", propertyId, { changes })
// Logged to `activity_log` table
```

## Known Patterns to Follow

### Payment Receipt Generation
See [app/(dashboard)/payments/[id]/receipt/page.tsx](app/(dashboard)/payments/%5Bid%5D/receipt/page.tsx):
- Fetches payment data + breakdown from API
- Formats dates per user locale
- Supports print styles via `@media print`
- Displays balance, overpayment credits, payment breakdown

### Form Submission Flow
1. Client: Use `startTransition()` to wrap server action
2. Server: Validate, check auth/permissions, execute mutation
3. Return: Success data or throw error (caught by useTransition)
4. Client: Show toast notification (via `useToast()` hook)

### List Filtering/Search
- Implement on server side (server action or API route)
- Use database queries, not client-side filtering
- Pagination: Use `offset` + `limit` pattern

## File Organization Tips

- **Actions**: Group by feature in `app/[feature]/actions.ts`
- **API Routes**: Mirror URL structure in `app/api/[resource]/[id]/route.ts`
- **Components**: Named exports, co-locate with usage or in `components/ui/`
- **Types**: Centralize in `lib/types.ts`; extend as needed
- **Constants**: `lib/constants.ts`

## Common Issues & Debugging

### Payment Receipt 404 Error
**Issue**: Receipt API returns 404 "Payment not found"
**Root Cause**: Nested Supabase selects fail due to ambiguous joins
**Solution**: Fetch payment → tenant → property → unit in separate queries (see API Route Pattern above)

### RLS Blocking Queries
Check that RLS policies in Supabase dashboard allow the user's role to access data.

### Logging
```typescript
import { logger } from "@/lib/logger"
const log = logger.child("context:name")
log.info("message", { details })
```

## When Modifying This Codebase

1. **Adding a new feature**: Create `app/(dashboard)/[feature]/(pages)`, `app/api/[feature]/route.ts`, `lib/types.ts` entry
2. **Changing auth logic**: Update `lib/supabase/{server,client}.ts`, `middleware.ts`, test login flow
3. **Adding permissions**: Update `role_permissions` table + `hasPermission()` checks
4. **Modifying data schema**: Create numbered migration in `scripts/`, test migrations thoroughly
5. **Adding external API**: Document in `.env.example`, validate via `lib/api-validation.ts`

## Environment & Deployment

### Required `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
UPSTASH_REDIS_REST_URL=[url]
UPSTASH_REDIS_REST_TOKEN=[token]
```

### Build Configuration
- TypeScript errors ignored in `next.config.mjs` (see IMPROVEMENTS.md #2)
- Images unoptimized for self-hosting
- Source maps disabled in production

---

**Last Updated**: January 2026 | **Framework**: Next.js 14+ | **Database**: Supabase
