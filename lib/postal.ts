// Postal codes for every address (customer billing, ship-to, vendor).
//
// Accepts US ZIP with an optional +4 (75165, 75165-1234) and international
// formats such as J3B 1T4, SW1A 1AA, 01310-100 or 1234 AB: 3–10 letters,
// digits, spaces or hyphens, starting and ending with a letter or digit.

export const POSTAL_CODE_MAX_LENGTH = 10;

export const POSTAL_CODE_MESSAGE =
    'Postal code must be 3–10 letters, digits, spaces or hyphens, e.g. 75165, 75165-1234 or J3B 1T4';

const POSTAL_CODE_REGEX = /^[A-Z0-9][A-Z0-9 -]{1,8}[A-Z0-9]$/;

// Same rule for the input's `pattern` attribute, which browsers match
// case-sensitively before the value is normalized.
export const POSTAL_CODE_HTML_PATTERN =
    '[A-Za-z0-9][A-Za-z0-9 \\-]{1,8}[A-Za-z0-9]';

/** Trim, uppercase and collapse runs of whitespace to a single space. */
export function normalizePostalCode(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

export function isValidPostalCode(value: string): boolean {
    return POSTAL_CODE_REGEX.test(normalizePostalCode(value));
}

/** Keep only characters a postal code can contain, as the user types. */
export function sanitizePostalCodeInput(value: string): string {
    return value.replace(/[^A-Za-z0-9 -]/g, '').toUpperCase();
}
