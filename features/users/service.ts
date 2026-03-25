/**
 * Pure business logic for employee ID generation.
 * No DB access — takes the current max and returns the next ID.
 */
export function generateEmployeeId(currentMax: string | null): string {
    if (!currentMax) return 'E01';

    const num = parseInt(currentMax.slice(1), 10);
    const next = num + 1;
    return `E${next.toString().padStart(2, '0')}`;
}
