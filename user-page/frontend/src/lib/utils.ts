import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Decimal from 'decimal.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeDecimal(value: string | number | undefined | null): Decimal {
  if (value === undefined || value === null || value === '') return new Decimal(0);
  try {
    return new Decimal(String(value));
  } catch {
    return new Decimal(0);
  }
}

export const formatAmount = (value: string | number | undefined | null): string => {
  const d = safeDecimal(value);
  const fixed = d.toFixed(2);
  const formatted = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace(/\.?0+$/, '');
  return formatted || '0';
};

export const formatUSDT = (amount: string | number): string => {
  const d = safeDecimal(amount);
  return d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
