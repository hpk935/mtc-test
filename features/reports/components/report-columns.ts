export interface ReportColumn {
    key: string;
    label: string;
    /** Always shown regardless of user selection. Default false. */
    required?: boolean;
}

/**
 * Parse the `cols` URL param into a Set of visible column keys.
 * - If the param is missing, returns `undefined` meaning "show all".
 * - If present, returns a Set containing the listed keys plus any required keys.
 */
export function parseVisibleColumns(
    raw: string | string[] | undefined,
    all: ReportColumn[],
): Set<string> | undefined {
    if (raw == null || raw === '') return undefined;
    const value = Array.isArray(raw) ? raw.join(',') : raw;
    const keys = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const valid = new Set(all.map((c) => c.key));
    const result = new Set<string>();
    for (const k of keys) if (valid.has(k)) result.add(k);
    for (const c of all) if (c.required) result.add(c.key);
    return result;
}

/** Returns true if the column should be rendered. */
export function isColumnVisible(
    visibleColumns: Set<string> | undefined,
    key: string,
): boolean {
    if (!visibleColumns) return true;
    return visibleColumns.has(key);
}

/** Count how many of the given keys are visible. Useful for footer colSpans. */
export function countVisible(
    visibleColumns: Set<string> | undefined,
    keys: string[],
): number {
    if (!visibleColumns) return keys.length;
    let n = 0;
    for (const k of keys) if (visibleColumns.has(k)) n++;
    return n;
}
