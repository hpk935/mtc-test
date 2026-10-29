// Largest value a Postgres `integer` / `serial` column can hold.
const MAX_INT4 = 2_147_483_647;

/**
 * Parses a dynamic route segment as a numeric database ID.
 *
 * Returns `null` for anything that isn't a whole number the database can
 * hold (letters, decimals, negatives, out-of-range values), so pages can call
 * `notFound()` instead of sending a bad value to the database and crashing.
 */
export function parseIdParam(value: string): number | null {
    if (!/^\d{1,10}$/.test(value)) return null;
    const id = Number(value);
    return id <= MAX_INT4 ? id : null;
}
