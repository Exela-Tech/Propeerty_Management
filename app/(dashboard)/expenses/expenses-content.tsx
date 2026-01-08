"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Filter, Calendar, TrendingDown, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteExpense, getProperties } from "./actions"

interface Expense {
  id: string
  amount: number
  currency: string
  category: string | null
  transaction_date: string
  description: string
  property_id: string | null
  property?: {
    id: string
    name: string
  }
}

function ExpenseActionButtons({ expense }: { expense: Expense }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteExpense(expense.id)
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/expenses/${expense.id}/edit`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "all",
    propertyId: "all",
  })
  const { toast } = useToast()

  // Fetch properties for filter
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const props = await getProperties()
        setProperties(props || [])
      } catch (error) {
        console.error("Error loading properties:", error)
      }
    }
    loadProperties()
  }, [])

  // Fetch expenses with filters
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.startDate) params.append("startDate", filters.startDate)
        if (filters.endDate) params.append("endDate", filters.endDate)
        if (filters.category !== "all") params.append("category", filters.category)
        if (filters.propertyId !== "all") params.append("propertyId", filters.propertyId)

        const response = await fetch(`/api/expenses?${params.toString()}`)
        const result = await response.json()
        setExpenses(result.data || result || [])
      } catch (error) {
        console.error("Error fetching expenses:", error)
        toast({
          title: "Error",
          description: "Failed to load expenses",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [filters, toast])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const byCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || "uncategorized"
      acc[cat] = (acc[cat] || 0) + Number(exp.amount)
      return acc
    }, {} as Record<string, number>)
    const categoryCount = Object.keys(byCategory).length

    return {
      total,
      count: expenses.length,
      categoryCount,
      byCategory,
    }
  }, [expenses])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    expenses.forEach((exp) => {
      if (exp.category) cats.add(exp.category)
    })
    return Array.from(cats).sort()
  }, [expenses])

  const handleRefresh = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.startDate) params.append("startDate", filters.startDate)
    if (filters.endDate) params.append("endDate", filters.endDate)
    if (filters.category !== "all") params.append("category", filters.category)
    if (filters.propertyId !== "all") params.append("propertyId", filters.propertyId)

    fetch(`/api/expenses?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        setExpenses(result.data || result || [])
        toast({
          title: "Refreshed",
          description: "Expenses list has been updated",
        })
      })
      .catch((error) => {
        console.error("Error refreshing expenses:", error)
        toast({
          title: "Error",
          description: "Failed to refresh expenses",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      category: "all",
      propertyId: "all",
    })
  }

  if (loading && expenses.length === 0) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage all business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses.length > 0
                ? `${expenses[0].currency} ${summary.total.toLocaleString()}`
                : "UGX 0"}
            </div>
            <p className="text-xs text-muted-foreground">{summary.count} expenses recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.categoryCount}</div>
            <p className="text-xs text-muted-foreground">Different expense categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses.length > 0
                ? `${expenses[0].currency} ${Math.round(summary.total / summary.count).toLocaleString()}`
                : "UGX 0"}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Expenses History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select
                value={filters.propertyId}
                onValueChange={(value) => setFilters({ ...filters, propertyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                ) : expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        <span className="inline-block px-2 py-1 rounded bg-gray-100 text-sm">
                          {expense.category?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{expense.property?.name || "Internal"}</TableCell>
                      <TableCell className="max-w-md truncate">{expense.description || "No description"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {expense.currency} {Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <ExpenseActionButtons expense={expense} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No expenses found. {Object.values(filters).some((f) => f && f !== "all") ? "Try adjusting your filters." : "Add one to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
