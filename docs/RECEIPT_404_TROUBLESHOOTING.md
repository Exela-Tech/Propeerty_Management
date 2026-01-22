# Payment Receipt 404 - Troubleshooting Guide

## Quick Fix Checklist

### 1. ✅ Code Fix Applied
The API route has been updated to use separate queries instead of nested selects.
- File: `app/api/payments/[id]/receipt/route.ts`
- Status: **FIXED**

### 2. 🔄 Clear Cache & Restart Dev Server

**Option A: Manual Steps (Recommended)**
```bash
# In your terminal, do the following:

# Step 1: Stop the current dev server (Ctrl+C if running)
# Step 2: Clear Next.js build cache
rm -rf .next

# Step 3: Start fresh
npm run dev
```

**Option B: One-liner**
```bash
rm -rf .next && npm run dev
```

### 3. 🔍 Verify Payment Data Exists

Before testing the receipt page, verify a payment actually exists:

1. Go to `http://localhost:3000/payments`
2. Check that payments are listed
3. If no payments, create one first at `http://localhost:3000/payments/new`
4. Copy the payment ID
5. Navigate to `http://localhost:3000/payments/{payment-id}/receipt`

### 4. 🐛 Debug Steps if 404 Still Occurs

**Check Server Logs:**
```
Look for these patterns in the dev server console:
- "Payment not found" - payment ID doesn't exist
- "Tenant not found for payment" - tenant record missing
- "Failed to fetch payment history" - payment history lookup failed
```

**Manual API Test:**
```bash
# Replace {PAYMENT_ID} with an actual payment ID
curl "http://localhost:3000/api/payments/{PAYMENT_ID}/receipt"

# You should get:
# {"success": true, "data": {...receipt data...}}

# If you get 404:
# {"success": false, "error": {"message": "Payment not found", "code": "NOT_FOUND"}}
```

**Check Database Directly:**
1. Open Supabase dashboard → SQL Editor
2. Run:
```sql
SELECT id, tenant_id, amount, payment_date FROM tenant_payments LIMIT 1;
```
3. Verify tenants exist:
```sql
SELECT id, first_name, last_name FROM tenants LIMIT 1;
```

### 5. 📋 API Flow Verification

The receipt API follows this sequence:
1. ✅ Validate payment ID is valid UUID
2. ✅ Query `tenant_payments` table
3. ✅ Query `tenants` table (related to payment)
4. ✅ Query `properties` table (related to tenant)
5. ✅ Query `units` table (related to tenant)
6. ✅ Query payment history for calculations
7. ✅ Return combined receipt data

If any step fails, you'll get a 404 with context about which lookup failed.

---

## What Changed

### Before (❌ Broken)
```typescript
const { data: payment } = await supabase
  .from("tenant_payments")
  .select(`
    id, amount, payment_date,
    tenant:tenant_id (
      id, first_name, last_name,
      property:property_id (...),
      unit:unit_id (...)
    )
  `)
  .eq("id", id)
  .single()
// ❌ Returns tenant as array
// ❌ Ambiguous join errors
// ❌ Hard to debug which lookup failed
```

### After (✅ Fixed)
```typescript
const { data: payment } = await supabase
  .from("tenant_payments")
  .select("*")
  .eq("id", id)
  .single()

const { data: tenant } = await supabase
  .from("tenants")
  .select("*")
  .eq("id", payment.tenant_id)
  .single()

const { data: property } = await supabase
  .from("properties")
  .select("id, name")
  .eq("id", tenant.property_id)
  .single()

const { data: unit } = await supabase
  .from("units")
  .select("id, unit_number, room_number")
  .eq("id", tenant.unit_id)
  .single()
// ✅ Each query is independent
// ✅ Clear error location
// ✅ Proper response structure
```

---

## Next Steps

1. **Restart dev server** with fresh cache (most likely will fix the issue)
2. **Test receipt page** with an existing payment ID
3. **Check server logs** if any errors occur
4. **Verify database data** exists using Supabase dashboard

If issues persist after restart, check the server console for specific error messages.
