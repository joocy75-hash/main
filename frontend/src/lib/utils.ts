import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const amountFormatter = new Intl.NumberFormat('ko-KR');

export function formatAmount(amount: number, unit = 'USDT'): string {
  return `${amountFormatter.format(amount)} ${unit}`;
}
