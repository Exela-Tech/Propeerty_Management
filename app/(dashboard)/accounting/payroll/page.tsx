"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, FileText } from "lucide-react"

export default function PayrollPage() {
  const [employees, setEmployees] = useState([
    {
      id: "1",
      name: "John Mwesige",
      position: "Property Manager",
      salary: 2500000,
      joinDate: "2023-01-15",
    },
    {
      id: "2",
      name: "Sarah Nakato",
      position: "Finance Officer",
      salary: 2000000,
      joinDate: "2023-02-20",
    },
  ])

  const [payrolRuns, setPayrollRuns] = useState([
    {
      id: "1",
      month: "December 2024",
      totalPayroll: 4500000,
      totalDeductions: 890000,
      netPayment: 3610000,
      status: "completed",
    },
    {
      id: "2",
      month: "January 2025",
      totalPayroll: 4500000,
      totalDeductions: 890000,
      netPayment: 3610000,
      status: "pending",
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Manage employees and process monthly payroll</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Process Payroll
        </Button>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">
            <Users className="mr-2 h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <FileText className="mr-2 h-4 w-4" />
            Payroll Runs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Total: {employees.length} employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">{emp.position}</p>
                      <p className="text-xs text-muted-foreground">Joined {emp.joinDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">UGX {emp.salary.toLocaleString()}</p>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>Recent payroll runs and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payrolRuns.map((run) => (
                  <div key={run.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{run.month}</p>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Payroll</p>
                            <p className="font-semibold">UGX {run.totalPayroll.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deductions</p>
                            <p className="font-semibold text-red-600">UGX {run.totalDeductions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Net Payment</p>
                            <p className="font-semibold text-green-600">UGX {run.netPayment.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={run.status === "completed" ? "default" : "secondary"}>{run.status}</Badge>
                        <Button variant="ghost" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
