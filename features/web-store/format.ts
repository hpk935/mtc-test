import { BUSINESS_TIME_ZONE } from '@/lib/dates';

const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

/** A moment as Pacific time, e.g. "Nov 11, 2026, 10:30 AM". */
export function formatDateTime(iso: string): string {
    return dateTimeFormat.format(new Date(iso));
}

/** Storefront amounts arrive as numbers or numeric strings. */
export function formatMoney(
    amount: number | string,
    currency: string = 'USD',
): string {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(value);
}
