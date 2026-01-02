"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertCircle } from "lucide-react"
import {
  getBankReconciliationSummary,
  getAccountReconciliationSummary,
  getBankReconciliation,
  getAccountReconciliation,
} from "@/app/(dashboard)/accounting/actions"

export default function ReconciliationPage() {
  const [bankReconciliation, setBankReconciliation] = useState(null)
  const [accountReconciliation, setAccountReconciliation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBank, setSelectedBank] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split("T")[0])
  const [bankList, setBankList] = useState([])
  const [accountList, setAccountList] = useState([])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [bankData, accountData] = await Promise.all([
          getBankReconciliationSummary(),
          getAccountReconciliationSummary(),
        ])
        setBankReconciliation(bankData)
        setAccountReconciliation(accountData)
        setBankList(bankData.accounts || [])
        setAccountList(accountData.accounts || [])
        if (bankData.accounts?.length > 0) {
          setSelectedBank(bankData.accounts[0].id)
        }
        if (accountData.accounts?.length > 0) {
          setSelectedAccount(accountData.accounts[0].id)
        }
      } catch (error) {
        console.error("Error loading reconciliation data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const handleBankReconciliation = async () => {
    if (!selectedBank) return
    try {
      const data = await getBankReconciliation(selectedBank, statementDate)
      setBankReconciliation(data)
    } catch (error) {
      console.error("Error reconciling bank account:", error)
    }
  }

  const handleAccountReconciliation = async () => {
    if (!selectedAccount) return
    try {
      const data = await getAccountReconciliation(selectedAccount, statementDate)
      setAccountReconciliation(data)
    } catch (error) {
      console.error("Error reconciling account:", error)
    }
  }

  const isBalanced = accountReconciliation?.totalDebits === accountReconciliation?.totalCredits

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reconciliation</h1>
        <p className="text-gray-500 mt-2">Reconcile your bank and general ledger accounts</p>
      </div>

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bank">Bank Reconciliation</TabsTrigger>
          <TabsTrigger value="account">Account Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Reconciliation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Select Bank Account</label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankList.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Statement Date</label>
                  <input
                    type="date"
                    value={statementDate}
                    onChange={(e) => setStatementDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <Button onClick={handleBankReconciliation} className="px-6">
                  Reconcile
                </Button>
              </div>

              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`flex items-center gap-3 p-4 rounded border ${bankReconciliation?.isReconciled ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
                  >
                    {bankReconciliation?.isReconciled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {bankReconciliation?.isReconciled
                          ? "Bank account reconciled"
                          : "Bank account pending reconciliation"}
                      </p>
                      <p className="text-sm text-gray-600">Discrepancy: UGX {bankReconciliation?.discrepancy || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-2">Bank Statement</p>
                        <p className="font-bold text-lg">UGX {bankReconciliation?.bankStatement || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-2">GL Balance</p>
                        <p className="font-bold text-lg">UGX {bankReconciliation?.glBalance || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-2">Discrepancy</p>
                        <p
                          className={`font-bold text-lg ${bankReconciliation?.discrepancy === 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          UGX {bankReconciliation?.discrepancy || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Reconciliation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Select Account</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountList.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">As Of Date</label>
                  <input
                    type="date"
                    value={statementDate}
                    onChange={(e) => setStatementDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <Button onClick={handleAccountReconciliation} className="px-6">
                  Reconcile
                </Button>
              </div>

              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`flex items-center gap-3 p-4 rounded border ${isBalanced ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                  >
                    {isBalanced ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{isBalanced ? "Account is balanced" : "Account is out of balance"}</p>
                      <p className="text-sm text-gray-600">Trial balance: {isBalanced ? "Balanced" : "Not balanced"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-blue-50">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-2">Total Debits</p>
                        <p className="font-bold text-xl">UGX {accountReconciliation?.totalDebits || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50">
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-2">Total Credits</p>
                        <p className="font-bold text-xl">UGX {accountReconciliation?.totalCredits || 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
