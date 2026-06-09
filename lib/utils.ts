import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Locale-independent formatter — avoids server/client hydration mismatches
export function formatDate(dateStr: string): string {
  const d = dateStr.split('T')[0] // handle both "2026-06-08" and ISO timestamps
  const [year, month, day] = d.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}
