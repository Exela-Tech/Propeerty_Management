import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { successResponse, handleApiError } from "@/lib/api-response"
import { validateQueryParams, validatePagination, createValidationErrorResponse } from "@/lib/api-validation"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate pagination parameters
    const page = searchParams.get("page")
    const limit = searchParams.get("limit")
    
    if (page || limit) {
      const paginationResult = validatePagination(page || undefined, limit || undefined)
      if (!paginationResult.valid) {
        return createValidationErrorResponse(paginationResult)
      }
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach((cookie: any) => cookieStore.set(cookie.name, cookie.value, cookie.options))
          } catch {}
        },
      },
    })

    const pageNum = page ? Number.parseInt(page, 10) : 1
    const limitNum = limit ? Number.parseInt(limit, 10) : 100
    const offset = (pageNum - 1) * limitNum

    const { data: expenses, error } = await supabase
      .from("transactions")
      .select("id, amount, currency, category, transaction_date, description, property:property_id(id, name)", {
        count: "exact",
      })
      .eq("type", "expense")
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (error) {
      return handleApiError(error, "expenses:GET")
    }

    return successResponse(expenses || [])
  } catch (error) {
    return handleApiError(error, "expenses:GET")
  }
}
