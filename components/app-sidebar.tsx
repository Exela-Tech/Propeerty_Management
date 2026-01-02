"use client"
import {
  Building2,
  Home,
  Users,
  Wrench,
  DollarSign,
  LayoutDashboard,
  UserCircle,
  Shield,
  LogOut,
  Receipt,
  UsersRound,
  FileText,
  TrendingUp,
  Calculator,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { createBrowserClient } from "@/lib/supabase/client"

interface AppSidebarProps {
  userProfile?: {
    first_name?: string
    last_name?: string
    email?: string
    role?: string
    is_admin?: boolean
  }
}

export function AppSidebar({ userProfile }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAccountingOpen, setIsAccountingOpen] = useState(false)

  const mainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Landlords",
      url: "/landlords",
      icon: UserCircle,
    },
    {
      title: "Landlord Payments",
      url: "/landlords/payments",
      icon: DollarSign,
    },
    {
      title: "Properties",
      url: "/properties",
      icon: Building2,
    },
    {
      title: "Units",
      url: "/units",
      icon: Home,
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: Users,
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: Receipt,
    },
    {
      title: "Payments",
      url: "/payments",
      icon: DollarSign,
    },
    {
      title: "Financials",
      url: "/financials",
      icon: TrendingUp,
    },
    {
      title: "Team",
      url: "/team",
      icon: UsersRound,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
  ]

  const accountingItems = [
    {
      title: "Chart of Accounts",
      url: "/accounting/chart-of-accounts",
    },
    {
      title: "General Ledger",
      url: "/accounting/general-ledger",
    },
    {
      title: "Trial Balance",
      url: "/accounting/trial-balance",
    },
    {
      title: "Cash Management",
      url: "/accounting/cash-management",
    },
    {
      title: "Bank Management",
      url: "/accounting/bank-management",
    },
    {
      title: "Landlord Statements",
      url: "/accounting/landlord-statements",
    },
    {
      title: "Financial Reports",
      url: "/accounting/financial-reports",
    },
    {
      title: "Tax Management",
      url: "/accounting/tax-management",
    },
    {
      title: "Payroll",
      url: "/accounting/payroll",
    },
    {
      title: "Invoicing",
      url: "/accounting/invoicing",
    },
    {
      title: "Reconciliation",
      url: "/accounting/reconciliation",
    },
    {
      title: "Budgets",
      url: "/accounting/budgets",
    },
  ]

  const handleSignOut = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">PropertyPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsAccountingOpen(!isAccountingOpen)}
                  isActive={pathname.startsWith("/accounting")}
                >
                  <Calculator />
                  <span>Accounting</span>
                  <ChevronDown className={`ml-auto transition-transform ${isAccountingOpen ? "rotate-180" : ""}`} />
                </SidebarMenuButton>
                {isAccountingOpen && (
                  <SidebarMenuSub>
                    {accountingItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userProfile?.is_admin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/users"}>
                    <Link href="/admin/users">
                      <Shield />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-4 py-2 text-sm">
              <p className="font-medium">
                {userProfile?.first_name} {userProfile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
              {userProfile?.role && (
                <p className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {userProfile.role.toUpperCase()}
                </p>
              )}
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
