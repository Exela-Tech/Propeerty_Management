"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, RotateCcw } from "lucide-react"
import {
  getMonthlyRentCollection,
  getOutstandingRent,
  getExpenseSummary,
  getLandlordStatements,
  getExpensesList,
  getMonthlyCollectionProgress,
} from "./actions"

export default function ReportsPage() {
  const [rentData, setRentData] = useState<any[]>([])
  const [outstandingData, setOutstandingData] = useState<any[]>([])
  const [landlordData, setLandlordData] = useState<any[]>([])
  const [expensesData, setExpensesData] = useState<any[]>([])
  const [monthlyProgressData, setMonthlyProgressData] = useState<any[]>([])
  const [searchTenant, setSearchTenant] = useState("")
  const [filterProperty, setFilterProperty] = useState("all")
  const [filterLandlord, setFilterLandlord] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchCollectionTenant, setSearchCollectionTenant] = useState("")
  const [filterCollectionProperty, setFilterCollectionProperty] = useState("all")
  const [filterCollectionLandlord, setFilterCollectionLandlord] = useState("all")
  const [searchExpense, setSearchExpense] = useState("")
  const [filterExpenseCategory, setFilterExpenseCategory] = useState("all")
  const [filterExpenseProperty, setFilterExpenseProperty] = useState("all")
  const [filterExpenseDateRange, setFilterExpenseDateRange] = useState("all")
  const [properties, setProperties] = useState<any[]>([])
  const [landlords, setLandlords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [monthlyStatusFilter, setMonthlyStatusFilter] = useState("all")
  const [monthlySearchTenant, setMonthlySearchTenant] = useState("")

  const availableMonths = useMemo(() => {
    const months = []
    const today = new Date()

    // Generate last 12 months plus current month
    for (let i = 12; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      months.push(`${year}-${month}`)
    }

    return months
  }, [])

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
      setSelectedMonth(currentMonth)
    }
  }, [availableMonths, selectedMonth])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [rent, outstanding, expenses, landlordStmt, expensesList, progress] = await Promise.all([
        getMonthlyRentCollection(),
        getOutstandingRent(),
        getExpenseSummary(),
        getLandlordStatements(),
        getExpensesList(),
        getMonthlyCollectionProgress(selectedMonth),
      ])
      setRentData(rent)
      setOutstandingData(outstanding)
      setLandlordData(landlordStmt)
      setExpensesData(expensesList)
      setMonthlyProgressData(progress)
      setLoading(false)
    }
    loadData()
  }, [selectedMonth])

  // Filter outstanding rent data
  const filteredOutstanding = useMemo(() => {
    return outstandingData.filter((item) => {
      const matchesSearch =
        item.tenantName.toLowerCase().includes(searchTenant.toLowerCase()) ||
        item.property?.toLowerCase().includes(searchTenant.toLowerCase())
      const matchesProperty = filterProperty === "all" || item.property === filterProperty
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "1-7" && item.daysOverdue <= 7) ||
        (filterStatus === "8-30" && item.daysOverdue > 7 && item.daysOverdue <= 30) ||
        (filterStatus === "30+" && item.daysOverdue > 30)
      return matchesSearch && matchesProperty && matchesStatus
    })
  }, [outstandingData, searchTenant, filterProperty, filterStatus])

  // Filter landlord data
  const filteredLandlords = useMemo(() => {
    if (filterLandlord === "all") return landlordData
    return landlordData.filter((item) => item.landlordName === filterLandlord)
  }, [landlordData, filterLandlord])

  // Filter rent collection data
  const filteredRentCollection = useMemo(() => {
    return rentData.filter((item) => {
      const matchesSearch =
        item.tenantName.toLowerCase().includes(searchCollectionTenant.toLowerCase()) ||
        item.property?.toLowerCase().includes(searchCollectionTenant.toLowerCase())
      const matchesProperty = filterCollectionProperty === "all" || item.property === filterCollectionProperty
      const matchesStatus = filterCollectionLandlord === "all" || item.landlordName === filterCollectionLandlord
      return matchesSearch && matchesProperty && matchesStatus
    })
  }, [rentData, searchCollectionTenant, filterCollectionProperty, filterCollectionLandlord])

  // Filter expenses data
  const filteredExpenses = useMemo(() => {
    return expensesData.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchExpense.toLowerCase()) ||
        (item.property?.toLowerCase().includes(searchExpense.toLowerCase()) ?? false)
      const matchesCategory = filterExpenseCategory === "all" || item.category === filterExpenseCategory
      const matchesProperty = filterExpenseProperty === "all" || item.property === filterExpenseProperty
      return matchesSearch && matchesCategory && matchesProperty
    })
  }, [expensesData, searchExpense, filterExpenseCategory, filterExpenseProperty])

  // Filter monthly progress data
  const filteredMonthlyProgress = useMemo(() => {
    return monthlyProgressData.filter((item) => {
      const matchesSearch = item.tenantName.toLowerCase().includes(monthlySearchTenant.toLowerCase())
      const matchesStatus = monthlyStatusFilter === "all" || item.paymentStatus === monthlyStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [monthlyProgressData, monthlySearchTenant, monthlyStatusFilter])

  // Calculate totals
  const totalOutstanding = filteredOutstanding.reduce((sum, item) => sum + item.outstandingBalance, 0)
  const totalMonthlyRent = filteredOutstanding.reduce((sum, item) => sum + item.monthlyRent, 0)
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
  const categoryBreakdown = filteredExpenses.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount
    return acc
  }, {})

  const handlePrint = (data: any[], title: string) => {
    const printWindow = window.open("", "", "height=600,width=800")
    if (printWindow) {
      printWindow.document.write("<html><head><title>" + title + "</title>")
      printWindow.document.write(
        "<style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>",
      )
      printWindow.document.write("</head><body>")
      printWindow.document.write("<h2>" + title + "</h2>")
      printWindow.document.write("<table><tr>")

      if (data.length > 0) {
        Object.keys(data[0]).forEach((key) => {
          printWindow.document.write("<th>" + key + "</th>")
        })
        printWindow.document.write("</tr>")

        data.forEach((item) => {
          printWindow.document.write("<tr>")
          Object.values(item).forEach((value: any) => {
            printWindow.document.write("<td>" + value + "</td>")
          })
          printWindow.document.write("</tr>")
        })
      }

      printWindow.document.write("</table></body></html>")
      printWindow.document.close()
      printWindow.print()
    }
  }

  const resetFilters = () => {
    setSearchTenant("")
    setFilterProperty("all")
    setFilterLandlord("all")
    setFilterStatus("all")
  }

  const resetCollectionFilters = () => {
    setSearchCollectionTenant("")
    setFilterCollectionProperty("all")
    setFilterCollectionLandlord("all")
  }

  const resetExpenseFilters = () => {
    setSearchExpense("")
    setFilterExpenseCategory("all")
    setFilterExpenseProperty("all")
    setFilterExpenseDateRange("all")
  }

  const resetMonthlyProgressFilters = () => {
    setSelectedMonth("")
    setMonthlyStatusFilter("all")
    setMonthlySearchTenant("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Track rent collection, outstanding payments, landlord payouts, and expenses
        </p>
      </div>

      <Tabs defaultValue="outstanding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="outstanding">Outstanding Rent</TabsTrigger>
          <TabsTrigger value="collection">Rent Collection</TabsTrigger>
          <TabsTrigger value="landlords">Landlord Statements</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="monthly-progress">Monthly Progress</TabsTrigger>
        </TabsList>

        {/* Outstanding Rent Tab */}
        <TabsContent value="outstanding" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outstanding Rent Report</CardTitle>
                  <CardDescription>
                    Tenants with pending rent payments - Filter and search to find specific records
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(filteredOutstanding, "Outstanding Rent Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Tenant</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tenant or property name..."
                      value={searchTenant}
                      onChange={(e) => setSearchTenant(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Property</label>
                  <Select value={filterProperty} onValueChange={setFilterProperty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {[...new Set(outstandingData.map((d) => d.property))].map((prop) => (
                        <SelectItem key={prop} value={prop || ""}>
                          {prop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Days Overdue</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1-7">1-7 days</SelectItem>
                      <SelectItem value="8-30">8-30 days</SelectItem>
                      <SelectItem value="30+">30+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="w-full bg-transparent">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">UGX {totalOutstanding.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-2">{filteredOutstanding.length} tenants</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Expected Monthly Rent</p>
                    <p className="text-2xl font-bold text-orange-600">UGX {totalMonthlyRent.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Recovery Needed</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((totalOutstanding / totalMonthlyRent) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Monthly Rent</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOutstanding.length > 0 ? (
                      filteredOutstanding.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.tenantName}</TableCell>
                          <TableCell>{item.property}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">UGX {item.monthlyRent.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            UGX {item.outstandingBalance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.daysOverdue > 30 ? "destructive" : item.daysOverdue > 7 ? "secondary" : "outline"
                              }
                            >
                              {item.daysOverdue} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No outstanding payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rent Collection Tab */}
        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Rent Collection</CardTitle>
                  <CardDescription>
                    Track rent collected from all tenants by property, landlord, and payment status
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(filteredRentCollection, "Rent Collection Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Tenant</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tenant or property name..."
                      value={searchCollectionTenant}
                      onChange={(e) => setSearchCollectionTenant(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Property</label>
                  <Select value={filterCollectionProperty} onValueChange={setFilterCollectionProperty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {[...new Set(rentData.map((d) => d.property))].map((prop) => (
                        <SelectItem key={prop} value={prop || ""}>
                          {prop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Landlord</label>
                  <Select value={filterCollectionLandlord} onValueChange={setFilterCollectionLandlord}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Landlords</SelectItem>
                      {[...new Set(rentData.filter((d) => d.landlordName).map((d) => d.landlordName))].map(
                        (landlord) => (
                          <SelectItem key={landlord} value={landlord}>
                            {landlord}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCollectionFilters}
                    className="w-full bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold text-green-600">
                      UGX {filteredRentCollection.reduce((sum, r) => sum + r.totalPaid, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{filteredRentCollection.length} tenants</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Expected Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      UGX {filteredRentCollection.reduce((sum, r) => sum + r.monthlyRent, 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {filteredRentCollection.length > 0
                        ? (
                            (filteredRentCollection.reduce((sum, r) => sum + r.totalPaid, 0) /
                              filteredRentCollection.reduce((sum, r) => sum + r.monthlyRent, 0)) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Avg Payment</p>
                    <p className="text-2xl font-bold text-amber-600">
                      UGX{" "}
                      {filteredRentCollection.length > 0
                        ? (
                            filteredRentCollection.reduce((sum, r) => sum + r.totalPaid, 0) /
                            filteredRentCollection.length
                          ).toFixed(0)
                        : "0"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Monthly Rent</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRentCollection.length > 0 ? (
                      filteredRentCollection.map((item) => {
                        const remaining = item.monthlyRent - item.totalPaid
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{item.tenantName}</TableCell>
                            <TableCell>{item.property}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">UGX {item.monthlyRent.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              UGX {item.totalPaid.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={remaining > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                                UGX {remaining.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.paymentStatus === "paid"
                                    ? "default"
                                    : item.totalPaid > 0
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {item.paymentStatus === "paid" ? "Paid" : item.totalPaid > 0 ? "Partial" : "Pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No rent collection records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Landlord Statements Tab */}
        <TabsContent value="landlords" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Landlord Statements</CardTitle>
                <CardDescription>Monthly payouts with 10% commission breakdown</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handlePrint(landlordData, "Landlord Statements")}>
                <Download className="w-4 h-4 mr-2" />
                Print
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <Select value={filterLandlord} onValueChange={setFilterLandlord}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filter by landlord..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Landlords</SelectItem>
                    {landlordData.map((landlord) => (
                      <SelectItem key={landlord.email} value={landlord.landlordName}>
                        {landlord.landlordName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Tenants</TableHead>
                      <TableHead className="text-right">Monthly Revenue</TableHead>
                      <TableHead className="text-right">Commission (10%)</TableHead>
                      <TableHead className="text-right">Payout (90%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLandlords.map((item) => (
                      <TableRow key={item.email} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.landlordName}</TableCell>
                        <TableCell>{item.properties}</TableCell>
                        <TableCell>{item.tenants}</TableCell>
                        <TableCell className="text-right font-medium">
                          UGX {item.totalMonthlyRent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          UGX {item.commission.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          UGX {item.landlordPayout.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expenses Report</CardTitle>
                  <CardDescription>
                    Track all business expenses by category, property, and filter by date range
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handlePrint(filteredExpenses, "Expenses Report")}>
                  <Download className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Expense</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Description or property..."
                      value={searchExpense}
                      onChange={(e) => setSearchExpense(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={filterExpenseCategory} onValueChange={setFilterExpenseCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="wage">Wage</SelectItem>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="field_expense">Field Expense</SelectItem>
                      <SelectItem value="office_rent">Office Rent</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Property</label>
                  <Select value={filterExpenseProperty} onValueChange={setFilterExpenseProperty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      {[...new Set(expensesData.filter((d) => d.property).map((d) => d.property))].map((prop) => (
                        <SelectItem key={prop} value={prop || ""}>
                          {prop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button variant="outline" size="sm" onClick={resetExpenseFilters} className="w-full bg-transparent">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">UGX {totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-2">{filteredExpenses.length} transactions</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Category Breakdown</p>
                    <div className="mt-3 space-y-1">
                      {Object.entries(categoryBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([category, amount]) => (
                          <p key={category} className="text-xs text-muted-foreground">
                            {category}: <span className="font-semibold">UGX {Number(amount).toLocaleString()}</span>
                          </p>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{item.property || "Internal"}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {Number(item.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>{item.currency}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.transaction_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No expenses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Collection Progress Tab */}
        <TabsContent value="monthly-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Collection Progress</CardTitle>
                  <CardDescription>
                    Track which tenants have paid and which are pending for a selected month
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(monthlyProgressData, `Monthly Collection Progress - ${selectedMonth}`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Month Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((month) => {
                        const [year, monthNum] = month.split("-")
                        const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })
                        return (
                          <SelectItem key={month} value={month}>
                            {monthName}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Status</label>
                  <Select value={monthlyStatusFilter} onValueChange={setMonthlyStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Tenant</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tenant name..."
                      value={monthlySearchTenant}
                      onChange={(e) => setMonthlySearchTenant(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {monthlyProgressData.filter((d) => d.isPaid).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {monthlyProgressData.length > 0
                        ? `${((monthlyProgressData.filter((d) => d.isPaid).length / monthlyProgressData.length) * 100).toFixed(0)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Partial Payment</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {monthlyProgressData.filter((d) => !d.isPaid && d.amountPaid > 0).length}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-red-600">
                      {monthlyProgressData.filter((d) => d.amountPaid === 0).length}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Expected</p>
                    <p className="text-2xl font-bold text-blue-600">
                      UGX {monthlyProgressData.reduce((sum, d) => sum + d.monthlyRent, 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Tenant Name</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMonthlyProgress.length > 0 ? (
                      filteredMonthlyProgress.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{item.tenantName}</TableCell>
                          <TableCell>{item.propertyName}</TableCell>
                          <TableCell>{item.landlordName}</TableCell>
                          <TableCell>{item.unitNumber}</TableCell>
                          <TableCell className="text-right">UGX {item.monthlyRent.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            UGX {item.amountPaid.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={item.balance > 0 ? "text-red-600" : "text-green-600"}>
                              UGX {item.balance.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.paymentStatus === "Paid"
                                  ? "default"
                                  : item.paymentStatus === "Partial"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {item.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.rentDueDay}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No collection records found for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
