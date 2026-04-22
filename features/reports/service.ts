import type { AgingBucket, PeriodOption } from './constants';

/**
 * Given an "as of" date and an invoice's due date (or invoice date as fallback),
 * return which aging bucket the balance falls into.
 */
export function calcAgingBucket(args: {
    asOf: Date;
    dueDate: string | null;
    invoiceDate: string;
}): AgingBucket {
    const reference = args.dueDate ?? args.invoiceDate;
    const refDate = new Date(reference + 'T00:00:00Z');
    const asOfUtc = new Date(
        Date.UTC(
            args.asOf.getUTCFullYear(),
            args.asOf.getUTCMonth(),
            args.asOf.getUTCDate(),
        ),
    );
    const daysPastDue = Math.floor(
        (asOfUtc.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysPastDue <= 0) return 'current';
    if (daysPastDue <= 30) return 'd1_30';
    if (daysPastDue <= 60) return 'd31_60';
    if (daysPastDue <= 90) return 'd61_90';
    return 'd90_plus';
}

/**
 * Rolling window ending at `now` that covers the given period option.
 * Returns ISO date strings (YYYY-MM-DD) for DB comparison against `date` cols.
 */
export function getPeriodRange(
    period: PeriodOption,
    now: Date = new Date(),
): { startDate: string; endDate: string } {
    const months = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[period];
    const end = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const start = new Date(end);
    start.setUTCMonth(start.getUTCMonth() - months);

    return {
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
    };
}

/**
 * Month-to-date range ending at `now`.
 */
export function getMtdRange(now: Date = new Date()): {
    startDate: string;
    endDate: string;
} {
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const end = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

/**
 * Year-to-date range ending at `now`.
 */
export function getYtdRange(now: Date = new Date()): {
    startDate: string;
    endDate: string;
} {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

function toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}
