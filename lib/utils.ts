import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BUSINESS_TIME_ZONE } from './dates';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(date: Date | string): string {
    // A date-only value (YYYY-MM-DD) is a calendar date: show that day as-is.
    // Anything else is a moment in time: show its Pacific date.
    const isCalendarDate = typeof date === 'string' && DATE_ONLY.test(date);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: isCalendarDate ? 'UTC' : BUSINESS_TIME_ZONE,
    }).format(isCalendarDate ? new Date(`${date}T00:00:00Z`) : new Date(date));
}

/** Rounds a dollar amount to whole cents (2 decimal places). */
export function roundCents(dollars: number): number {
    return Math.round(dollars * 100) / 100;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

/** Phones are stored as digits; show 10-digit numbers as (650) 343-6853. */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
}
