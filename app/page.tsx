import { Button } from "@/components/ui/button"
import { Building2, BarChart3, Users, Wrench } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">PropertyPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-primary hover:bg-blue-50 dark:hover:bg-blue-950/20">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance text-foreground">
            Manage your properties with confidence
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground text-pretty">
            Complete property management solution for landlords. Track tenants, manage maintenance requests, collect
            payments, and streamline operations all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Link href="/auth/sign-up">Start free trial</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 bg-transparent"
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Property Management</h3>
                <p className="text-sm text-muted-foreground">
                  Organize all your properties and units in one centralized dashboard
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Tenant Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Manage tenant information, leases, and payment history effortlessly
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Maintenance Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Track and resolve maintenance issues quickly and efficiently
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Financial Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor payments, expenses, and generate comprehensive reports
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 PropertyPro. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
