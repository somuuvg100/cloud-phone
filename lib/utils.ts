import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInternationalPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Basic display formatter fallback
  return phone;
}

