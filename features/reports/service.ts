import { todayIso } from '@/lib/dates';
import type { PeriodOption } from './constants';

// Ranges work on calendar dates held as UTC-midnight Dates. By default they
// end on today's date in Pacific time.
function pacificToday(): Date {
    return new Date(`${todayIso()}T00:00:00Z`);
}

/**
 * Rolling window ending at `now` that covers the given period option.
 * Returns ISO date strings (YYYY-MM-DD) for DB comparison against `date` cols.
 */
export function getPeriodRange(
    period: PeriodOption,
    now: Date = pacificToday(),
): { startDate: string; endDate: string } {
    const months = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[period];
    const end = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    // Same day N months back, clamped to that month's last day (Oct 31 - 1m
    // is Sep 30, not "Sep 31" = Oct 1).
    const lastDayOfStartMonth = new Date(
        Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 0),
    ).getUTCDate();
    const start = new Date(
        Date.UTC(
            end.getUTCFullYear(),
            end.getUTCMonth() - months,
            Math.min(end.getUTCDate(), lastDayOfStartMonth),
        ),
    );

    return {
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
    };
}

/**
 * Month-to-date range ending at `now`.
 */
export function getMtdRange(now: Date = pacificToday()): {
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
export function getYtdRange(now: Date = pacificToday()): {
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
