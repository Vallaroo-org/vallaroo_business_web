import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
}

export function parseError(error: any): string {
  if (!error) return '';
  const message = typeof error === 'string' ? error : error.toString();

  if (message.startsWith('Exception: ')) {
    return message.substring(11);
  }

  if (message.trim().startsWith('{') && message.trim().endsWith('}')) {
    try {
      const json = JSON.parse(message);
      return json.message || json.error_description || json.msg || message;
    } catch (e) {
      return message;
    }
  }
  return message;
}
