// The business runs on Pacific time. "Today" and displayed moments use it,
// whatever the time zone of the server (UTC in production) or the viewer.
export const BUSINESS_TIME_ZONE = 'America/Los_Angeles';

const isoDateFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

/** Today's date in Pacific time, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
    return isoDateFormat.format(now);
}
