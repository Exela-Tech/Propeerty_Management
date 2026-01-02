"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getBankAccounts,
  getUndepositedFunds,
  getPaymentDeposits,
  createPaymentDeposit,
  getBankTransactions,
} from "../actions"

export default function CashManagementPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [undepositedFunds, setUndepositedFunds] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [depositRef, setDepositRef] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [selectedBankForView, setSelectedBankForView] = useState<string>("")
  const [bankTransactions, setBankTransactions] = useState<any[]>([])
  const [selectedBankInfo, setSelectedBankInfo] = useState<any>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accounts, funds, deps] = await Promise.all([
          getBankAccounts(),
          getUndepositedFunds(),
          getPaymentDeposits(),
        ])
        setBankAccounts(accounts)
        setUndepositedFunds(funds)
        setDeposits(deps)
        if (accounts.length > 0) {
          const trustAccount = accounts.find((a: any) => a.account_name?.toLowerCase().includes("trust"))
          setSelectedBank(trustAccount?.id || accounts[0].id)
          setSelectedBankForView(accounts[0].id)
        }
      } catch (error) {
        console.error("[v0] Error loading cash management:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const loadBankTransactions = async () => {
      if (!selectedBankForView) return

      setLoadingTransactions(true)
      try {
        const result = await getBankTransactions(selectedBankForView)
        setBankTransactions(result.transactions)
        setSelectedBankInfo(result.bankAccount)
      } catch (error) {
        console.error("[v0] Error loading bank transactions:", error)
      } finally {
        setLoadingTransactions(false)
      }
    }

    loadBankTransactions()
  }, [selectedBankForView])

  const handleDepositPayments = async () => {
    if (selectedPayments.size === 0 || !selectedBank) {
      alert("Please select payments and a bank account")
      return
    }

    try {
      await createPaymentDeposit(
        selectedBank,
        Array.from(selectedPayments),
        new Date().toISOString().split("T")[0],
        depositRef,
      )
      setSelectedPayments(new Set())
      setDepositRef("")
      // Refresh data
      const [funds, deps] = await Promise.all([getUndepositedFunds(), getPaymentDeposits()])
      setUndepositedFunds(funds)
      setDeposits(deps)

      if (selectedBankForView) {
        const result = await getBankTransactions(selectedBankForView)
        setBankTransactions(result.transactions)
      }
    } catch (error) {
      console.error("[v0] Error creating deposit:", error)
      alert("Failed to create deposit")
    }
  }

  const transactionsWithBalance = bankTransactions
    .map((transaction, index) => {
      const previousTransactions = bankTransactions.slice(index + 1)
      const runningBalance =
        previousTransactions.reduce((balance, t) => {
          return balance + (t.debit || 0) - (t.credit || 0)
        }, 0) +
        (transaction.debit || 0) -
        (transaction.credit || 0)

      return {
        ...transaction,
        runningBalance,
      }
    })
    .reverse() // Reverse to show oldest first with running balance

  const totalUndeposited = undepositedFunds.reduce((sum, p) => sum + p.amount, 0)

  const tenantPayments = undepositedFunds.filter((p) => p.type === "tenant_payment")
  const landlordPayments = undepositedFunds.filter((p) => p.type === "landlord_payment")
  const tenantTotal = tenantPayments.reduce((sum, p) => sum + p.amount, 0)
  const landlordTotal = landlordPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Undeposited Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUndeposited.toLocaleString("en-US", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cash awaiting deposit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tenant Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tenantPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Landlord Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landlordTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{landlordPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="undeposited" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="undeposited">Undeposited Funds</TabsTrigger>
          <TabsTrigger value="deposits">Bank Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="undeposited">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Undeposited Funds - General Ledger View</CardTitle>
                <Badge variant="secondary" className="text-lg">
                  {totalUndeposited.toLocaleString("en-US", {
                    style: "currency",
                    currency: "UGX",
                    minimumFractionDigits: 0,
                  })}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Showing GL entries where cash is received but not yet deposited to bank
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="block font-medium">Select Bank Account:</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.bank_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block font-medium">Deposit Reference:</label>
                <Input
                  placeholder="e.g., Deposit #001 or Check #12345"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedPayments.size === undepositedFunds.length && undepositedFunds.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPayments(new Set(undepositedFunds.map((p) => p.id)))
                            } else {
                              setSelectedPayments(new Set())
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">From</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-right p-3 font-semibold text-green-700">Debit</th>
                      <th className="text-right p-3 font-semibold text-blue-700">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {undepositedFunds.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedPayments.has(payment.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedPayments)
                              if (e.target.checked) {
                                newSelected.add(payment.id)
                              } else {
                                newSelected.delete(payment.id)
                              }
                              setSelectedPayments(newSelected)
                            }}
                          />
                        </td>
                        <td className="p-3 font-mono">{payment.payment_date}</td>
                        <td className="p-3">{payment.payerName}</td>
                        <td className="p-3">
                          <Badge variant="outline">{payment.type === "tenant_payment" ? "Tenant" : "Landlord"}</Badge>
                        </td>
                        <td className="p-3 text-right font-mono text-green-700 font-semibold">
                          {payment.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "UGX",
                            minimumFractionDigits: 0,
                          })}
                        </td>
                        <td className="p-3 text-right font-mono text-muted-foreground">-</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold bg-muted">
                      <td colSpan={4} className="p-3 text-right">
                        Total:
                      </td>
                      <td className="p-3 text-right font-mono text-green-700">
                        {totalUndeposited.toLocaleString("en-US", {
                          style: "currency",
                          currency: "UGX",
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Accounting Entry:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-green-700">Debit: Undeposited Funds (Asset)</strong> - Cash received
                    increases this asset account
                  </li>
                  <li>
                    <strong>Credit: Rental Income (Revenue)</strong> - Not shown here, posted to income statement
                  </li>
                </ul>
              </div>

              <Button onClick={handleDepositPayments} disabled={selectedPayments.size === 0} className="w-full">
                Deposit {selectedPayments.size} Payment(s) to Bank
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Transactions</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                View complete transaction history with running balance for each bank account
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="block font-medium">Select Bank Account:</label>
                <select
                  value={selectedBankForView}
                  onChange={(e) => setSelectedBankForView(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} - {acc.bank_name} ({acc.account_number})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBankInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedBankInfo.account_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedBankInfo.bank_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {(
                          transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance || 0
                        ).toLocaleString("en-US", {
                          style: "currency",
                          currency: "UGX",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loadingTransactions ? (
                <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-right p-3 font-semibold text-green-700">Debit</th>
                        <th className="text-right p-3 font-semibold text-red-700">Credit</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsWithBalance.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No transactions found for this bank account
                          </td>
                        </tr>
                      ) : (
                        transactionsWithBalance.map((transaction, index) => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{transaction.description}</span>
                                {transaction.reference && (
                                  <span className="text-xs text-muted-foreground">Ref: {transaction.reference}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono">
                              {transaction.debit > 0 ? (
                                <span className="text-green-700 font-semibold">
                                  {transaction.debit.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "UGX",
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {transaction.credit > 0 ? (
                                <span className="text-red-700 font-semibold">
                                  {transaction.credit.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "UGX",
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold">
                              <span className={transaction.runningBalance >= 0 ? "text-green-700" : "text-red-700"}>
                                {transaction.runningBalance.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "UGX",
                                  minimumFractionDigits: 0,
                                })}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Understanding Bank Transactions:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-green-700">Debit</strong> - Money coming INTO the bank (deposits, income)
                  </li>
                  <li>
                    <strong className="text-red-700">Credit</strong> - Money going OUT of the bank (expenses,
                    withdrawals)
                  </li>
                  <li>
                    <strong>Balance</strong> - Running total showing current bank account balance
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
