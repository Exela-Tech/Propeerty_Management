import { getServiceClient } from "@/lib/supabase/server"
import { successResponse, handleApiError } from "@/lib/api-response"
import { validateQueryParams, validatePagination, createValidationErrorResponse } from "@/lib/api-validation"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate pagination parameters
    const page = searchParams.get("page")
    const limit = searchParams.get("limit")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const category = searchParams.get("category")
    const propertyId = searchParams.get("propertyId")
    
    if (page || limit) {
      const paginationResult = validatePagination(page || undefined, limit || undefined)
      if (!paginationResult.valid) {
        return createValidationErrorResponse(paginationResult)
      }
    }

    const supabase = getServiceClient()

    const pageNum = page ? Number.parseInt(page, 10) : 1
    const limitNum = limit ? Number.parseInt(limit, 10) : 100
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from("transactions")
      .select("id, amount, currency, category, transaction_date, description, property:property_id(id, name)", {
        count: "exact",
      })
      .eq("type", "expense")

    // Apply filters
    if (startDate) {
      query = query.gte("transaction_date", startDate)
    }
    if (endDate) {
      query = query.lte("transaction_date", endDate)
    }
    if (category) {
      query = query.eq("category", category)
    }
    if (propertyId) {
      query = query.eq("property_id", propertyId)
    }

    const { data: expenses, error } = await query
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
