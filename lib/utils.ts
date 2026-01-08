import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: "UGX")
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, currency: string = "UGX"): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return `${currency} 0`
  
  return `${currency} ${numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}
