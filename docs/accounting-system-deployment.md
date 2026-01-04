# Full-Fledged Accounting System - Deployment Guide

## Overview

This document outlines the comprehensive accounting system integrated with the property management software. The system follows **Trust Accounting** principles, where tenant rent is treated as a liability (held in trust for landlords) rather than company income.

## Database Setup

### 1. Run the Database Migration

Execute the SQL script to create all accounting tables:

```bash
# Connect to your Supabase database and run:
psql -h [your-db-host] -U [username] -d [database] -f scripts/008_create_full_accounting_system.sql
```

Or run it directly in Supabase SQL Editor.

### 2. Verify Tables Created

The script creates the following tables:
- `chart_of_accounts` - Hierarchical account structure
- `general_ledger` - All posted transactions
- `journal_entries` - Journal entry headers
- `journal_entry_lines` - Journal entry detail lines
- `landlord_sub_ledgers` - Individual landlord accounting
- `accounts_payable` - Vendor/landlord invoices
- `ap_payments` - Payments against AP invoices
- `bank_accounts` - Bank account management
- `bank_reconciliations` - Bank reconciliation records
- `accounting_periods` - Period locking for audit
- `accounting_audit_log` - Transaction audit trail

### 3. System Accounts Initialized

The script automatically creates default system accounts following Trust Accounting:
- **Assets (1000-1999)**: Cash, Trust Bank Account, Operating Bank Account
- **Liabilities (2000-2999)**: Rent Trust Liability, Landlord Payables, Accounts Payable
- **Equity (3000-3999)**: Owners Equity, Retained Earnings
- **Revenue (4000-4999)**: Management Fee Income, Other Income
- **Expenses (5000-5999)**: Repairs & Maintenance, Administrative Expenses

## Key Features Implemented

### ✅ Core Accounting
1. **Chart of Accounts** - Full hierarchical structure with account codes
2. **General Ledger** - Central transaction hub with debits/credits and running balances
3. **Journal Management** - Support for General, Sales, Purchase, Cash, Payroll, and Closing journals
4. **Journal Entry Posting** - Automatic posting to General Ledger with balance calculations

### ✅ Trust Accounting
1. **Rent Trust Liability** - Rent collected from tenants is recorded as a liability
2. **Landlord Sub-ledgers** - Individual accounting for each landlord showing:
   - Rent collected
   - Expenses paid
   - Management fees charged
   - Payouts made
   - Running balance (net amount owed)

### ✅ Accounts Payable
1. **AP Invoice Management** - Track vendor bills and landlord payables
2. **Payment Tracking** - Record payments against invoices
3. **Aging Reports** - View overdue invoices

### ✅ Bank Management
1. **Multi-Account Support** - Trust, Operating, Payroll, Tax accounts
2. **Bank Reconciliation** - Reconcile bank statements with book balances
3. **GL Integration** - Link bank accounts to Chart of Accounts

### ✅ Financial Reporting
1. **Trial Balance** - All account balances at a point in time
2. **General Ledger Reports** - Filter by account, date range, period
3. **Landlord Sub-ledger Reports** - Individual landlord statements

### ✅ Audit & Compliance
1. **Period Locking** - Lock accounting periods to prevent modifications
2. **Audit Log** - Complete transaction history (structure ready)
3. **Status Tracking** - Draft, Posted, Reversed, Voided transaction statuses

## UI Components Created

### Main Dashboard
- `/admin/accounting/system` - Main navigation hub

### Chart of Accounts
- `/admin/accounting/system/chart-of-accounts` - List, create, edit accounts
- Hierarchical tree view with expand/collapse
- System accounts protection

### Journal Entries
- `/admin/accounting/system/journal-entries` - List all journal entries
- `/admin/accounting/system/journal-entries/new` - Create new journal entry
- `/admin/accounting/system/journal-entries/[id]` - View journal entry details
- Post to General Ledger functionality

### General Ledger
- `/admin/accounting/system/general-ledger` - View all posted transactions
- Filter by account, date range, period
- Running balance display

### Landlord Sub-ledgers
- `/admin/accounting/system/landlord-ledgers` - View landlord accounting
- Filter by landlord, date range
- Shows rent collected, expenses, fees, payouts, and balance

### Accounts Payable
- `/admin/accounting/system/accounts-payable` - List AP invoices
- Status tracking (Open, Partial, Paid, Overdue, Voided)

### Bank Accounts
- `/admin/accounting/system/bank-accounts` - Manage bank accounts
- Create Trust, Operating, Payroll, Tax accounts

### Financial Reports
- `/admin/accounting/system/reports/trial-balance` - Trial Balance report
- `/admin/accounting/system/reports/profit-loss` - P&L (placeholder)
- `/admin/accounting/system/reports/balance-sheet` - Balance Sheet (placeholder)
- `/admin/accounting/system/reports/cash-flow` - Cash Flow (placeholder)

### Period Management
- `/admin/accounting/system/periods` - Lock/unlock accounting periods

## API Endpoints

### Chart of Accounts
- `GET /api/accounting/chart-of-accounts` - List all accounts
- `POST /api/accounting/chart-of-accounts` - Create account
- `GET /api/accounting/chart-of-accounts/[id]` - Get account
- `PUT /api/accounting/chart-of-accounts/[id]` - Update account
- `DELETE /api/accounting/chart-of-accounts/[id]` - Delete account

### Journal Entries
- `GET /api/accounting/journal-entries` - List entries (with filters)
- `POST /api/accounting/journal-entries` - Create entry
- `GET /api/accounting/journal-entries/[id]` - Get entry with lines
- `POST /api/accounting/journal-entries/[id]/post` - Post entry to GL

### General Ledger
- `GET /api/accounting/general-ledger` - Get GL entries (with filters)

### Landlord Sub-ledgers
- `GET /api/accounting/landlord-ledgers` - Get landlord ledger entries

### Accounts Payable
- `GET /api/accounting/accounts-payable` - List AP invoices
- `POST /api/accounting/accounts-payable` - Create AP invoice

### Bank Accounts
- `GET /api/accounting/bank-accounts` - List bank accounts
- `POST /api/accounting/bank-accounts` - Create bank account

### Reports
- `GET /api/accounting/reports/trial-balance` - Generate trial balance

### Periods
- `GET /api/accounting/periods` - List periods
- `POST /api/accounting/periods` - Lock/unlock period

## Trust Accounting Principles

### Key Concepts

1. **Tenant Rent = Liability**
   - Rent collected from tenants is NOT company income
   - Recorded in "Rent Trust Liability" account (2110)
   - Held in trust for landlords

2. **Management Fees = Income**
   - Management fees charged to landlords ARE company income
   - Recorded in "Management Fee Income" account (4110)

3. **Separate Bank Accounts**
   - **Trust Bank Account** (1120): For tenant rent (held in trust)
   - **Operating Bank Account** (1130): For company operations

4. **Landlord Sub-ledgers**
   - Each landlord has individual accounting
   - Tracks: Rent Collected, Expenses Paid, Fees Charged, Payouts
   - Shows running balance (net amount owed to landlord)

## Database Functions

### `generate_journal_number(j_type, p_year)`
Automatically generates journal numbers in format: `GJ-2024-001`

### `calculate_account_balance(p_account_id, p_as_of_date)`
Calculates running balance for an account as of a specific date

### `post_journal_entry(p_journal_entry_id)`
Posts a journal entry to General Ledger:
- Validates entry is in DRAFT status
- Checks period is not locked
- Creates GL entries for each line
- Calculates running balances
- Updates journal entry status to POSTED

## Security

- All API routes require admin authentication
- Row Level Security (RLS) enabled on all tables
- Admin-only access policies
- Landlords can view their own sub-ledger entries

## Next Steps for Full Implementation

### Remaining Features (Placeholders Created)
1. **Advanced Invoicing** - Templates, recurring invoices, tax/discounts
2. **Payroll Management** - Employee database, salary calculations, deductions
3. **Tax Management** - VAT, withholding tax, PAYE, eTIMS export
4. **Fixed Assets** - Asset register, depreciation tracking
5. **Budgeting & Forecasting** - Budget creation, variance analysis
6. **Complete Financial Reports** - P&L, Balance Sheet, Cash Flow (full implementation)
7. **Bank Reconciliation UI** - Full reconciliation workflow
8. **Audit Log UI** - View and filter audit trail

### Integration Points Needed
1. **Rent Collection Integration** - Auto-create journal entries when rent is collected
2. **Expense Integration** - Auto-create journal entries for expenses
3. **Landlord Payment Integration** - Auto-update landlord sub-ledgers
4. **Trust Accounting Automation** - Automatic posting to trust liability accounts

## Testing Checklist

- [ ] Run database migration script
- [ ] Verify system accounts created
- [ ] Test Chart of Accounts CRUD operations
- [ ] Create and post a journal entry
- [ ] Verify General Ledger entries created
- [ ] Test period locking
- [ ] Generate trial balance
- [ ] Test landlord sub-ledger queries
- [ ] Verify RLS policies working

## Deployment Notes

1. **Database Migration**: Run `scripts/008_create_full_accounting_system.sql` first
2. **No Breaking Changes**: All new tables, no modifications to existing tables
3. **Backward Compatible**: Existing functionality remains unchanged
4. **Admin Access Required**: All accounting features require admin role

## Support

For issues or questions, refer to:
- Database schema: `scripts/008_create_full_accounting_system.sql`
- API routes: `app/api/accounting/`
- UI components: `app/admin/accounting/system/`
