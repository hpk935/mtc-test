// scripts/import/import-ship-to-addresses.ts — Import legacy ship-to address data from CSV
// Run with: npx tsx scripts/import/import-ship-to-addresses.ts [--limit N] [--dry-run]

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { NewShipToAddress } from '../../features/customers/types';

const CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - ShipToAddresses.csv',
);

// --- CLI args ---

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const rowLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// --- CSV helpers ---

function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

function truncate(
    value: string,
    maxLen: number,
    field: string,
    rowId: string,
    warnings: string[],
): string {
    if (value.length > maxLen) {
        warnings.push(
            `  [${rowId}] ${field} truncated: "${value}" → ${maxLen} chars`,
        );
        return value.slice(0, maxLen);
    }
    return value;
}

function truncateOrNull(
    value: string,
    maxLen: number,
    field: string,
    rowId: string,
    warnings: string[],
): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    return truncate(trimmed, maxLen, field, rowId, warnings);
}

const US_POSTAL_STATE_CODES = new Set([
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
    'DC',
    'AS',
    'GU',
    'MP',
    'PR',
    'VI',
]);

function normalizePostalCode(
    postalCode: string,
    stateCode: string,
    rowId: string,
    warnings: string[],
): string {
    if (!postalCode) return '00000';
    if (
        /^\d+$/.test(postalCode) &&
        postalCode.length < 5 &&
        US_POSTAL_STATE_CODES.has(stateCode.toUpperCase())
    ) {
        const padded = postalCode.padStart(5, '0');
        warnings.push(
            `  [${rowId}] postalCode padded: "${postalCode}" → "${padded}"`,
        );
        return padded;
    }
    return postalCode;
}

function stripTrailingComma(value: string): string {
    return value.replace(/,\s*$/, '');
}

function hasClosedMarker(locationName: string, addressLine2: string): boolean {
    const fields = [locationName, addressLine2];
    return fields.some((f) => f && /\bclosed\b/i.test(f));
}

function isNoteRow(row: Record<string, string>): boolean {
    const location = row['LocationName']?.trim() || '';
    const street = row['ShipToStreet']?.trim() || '';
    const combined = `${location} ${street}`.toLowerCase();
    return (
        combined.includes('refer to acct') ||
        combined.includes('for future orders')
    );
}

function isEmptyRow(row: Record<string, string>): boolean {
    const location = row['LocationName']?.trim() || '';
    const street = row['ShipToStreet']?.trim() || '';
    const city = row['ShiptoCity']?.trim() || '';
    const state = row['ShiptoState']?.trim() || '';
    const contact = row['Contact']?.trim() || '';
    const phone = row['Phone Number']?.trim() || '';

    // Completely empty — no useful data at all
    if (!location && !street && !city && !state && !contact && !phone) {
        return true;
    }

    // Only has phone and/or contact — not enough for an address record
    if (!location && !street && !city && !state) {
        return true;
    }

    return false;
}

function readCsv(): Record<string, string>[] {
    const content = readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    // Headers are on row 1 (index 0)
    const headers = parseCsvLine(lines[0]);
    const rows: Record<string, string>[] = [];

    const dataEnd = Math.min(lines.length, 1 + rowLimit);
    for (let i = 1; i < dataEnd; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }
    return rows;
}

// --- Transforms ---

interface SkippedRow {
    line: number;
    custNumber: string;
    reason: string;
    originalRow: Record<string, string>;
}

function generateShipToId(counter: number): string {
    return `ST${counter.toString().padStart(4, '0')}`;
}

function transformRows(
    rows: Record<string, string>[],
    existingCustomers: Set<string>,
) {
    const valid: NewShipToAddress[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];

    // Track first valid address per customer for isDefault
    const firstSeenPerCustomer = new Set<string>();
    // Track seen (custNumber, addressNo) pairs for deduplication
    const seenKeys = new Set<string>();
    let idCounter = 1;
    let duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const custNumber = r['Cust Number']?.trim();
        const rowId = `line ${i + 2}, cust ${custNumber || '(empty)'}`;

        if (!custNumber) {
            skipped.push({
                line: i + 2,
                custNumber: '(empty)',
                reason: 'Missing Cust Number',
                originalRow: r,
            });
            continue;
        }

        // Check if customer exists in DB
        if (!existingCustomers.has(custNumber)) {
            skipped.push({
                line: i + 2,
                custNumber,
                reason: `Customer ${custNumber} not found in database`,
                originalRow: r,
            });
            continue;
        }

        // Skip note-like entries
        if (isNoteRow(r)) {
            skipped.push({
                line: i + 2,
                custNumber,
                reason: 'Note-like entry (not a real address)',
                originalRow: r,
            });
            continue;
        }

        // Skip empty/junk rows
        if (isEmptyRow(r)) {
            skipped.push({
                line: i + 2,
                custNumber,
                reason: 'Empty row (no location, address, city, or state)',
                originalRow: r,
            });
            continue;
        }

        const addressNo = r['ShiptoAddressNo']?.trim() || '0';

        // Deduplicate on (custNumber, addressNo, locationName, address)
        const locationNameRaw_ = r['LocationName']?.trim() || '';
        const streetRaw_ = r['ShipToStreet']?.trim() || '';
        const dedupKey = `${custNumber}|${addressNo}|${locationNameRaw_}|${streetRaw_}`;
        if (seenKeys.has(dedupKey)) {
            duplicateCount++;
            skipped.push({
                line: i + 2,
                custNumber,
                reason: `Duplicate (addressNo=${addressNo}, location="${locationNameRaw_}")`,
                originalRow: r,
            });
            continue;
        }
        seenKeys.add(dedupKey);
        const locationNameRaw = r['LocationName']?.trim() || '';
        const streetRaw = r['ShipToStreet']?.trim() || '';
        const addressLine2Raw = r['AddressLine2']?.trim() || '';
        const cityRaw = r['ShiptoCity']?.trim() || '';
        const stateRaw = r['ShiptoState']?.trim() || '';
        const zipRaw = r['ShiptoZip']?.trim() || '';
        const contactRaw = r['Contact']?.trim() || '';
        const phoneRaw = r['Phone Number']?.trim() || '';

        // Derive location name: fallback chain
        let locationName = locationNameRaw;
        if (!locationName && streetRaw) {
            locationName = streetRaw;
            warnings.push(
                `  [${rowId}] Using ShipToStreet as locationName: "${streetRaw}"`,
            );
        }
        if (!locationName) {
            locationName = `Location ${addressNo}`;
            warnings.push(
                `  [${rowId}] No location name — defaulting to "Location ${addressNo}"`,
            );
        }

        // Derive address1: use street, fallback to N/A
        const address1 = streetRaw || 'N/A';

        // Clean city
        const city = stripTrailingComma(cityRaw) || 'N/A';

        // State
        const stateCode = stateRaw || 'N/A';

        // Normalize postal code
        const postalCode = normalizePostalCode(
            zipRaw,
            stateRaw,
            rowId,
            warnings,
        );

        // Derive location status
        const locationStatus = hasClosedMarker(locationNameRaw, addressLine2Raw)
            ? ('inactive' as const)
            : ('active' as const);

        // isDefault: first valid address per customer
        const isDefault = !firstSeenPerCustomer.has(custNumber);
        if (isDefault) {
            firstSeenPerCustomer.add(custNumber);
        }

        const shipToId = generateShipToId(idCounter++);

        valid.push({
            shipToId,
            customerNumber: truncate(
                custNumber,
                20,
                'customerNumber',
                rowId,
                warnings,
            ),
            locationName: truncate(
                locationName,
                255,
                'locationName',
                rowId,
                warnings,
            ),
            locationStatus,
            address1: truncate(address1, 255, 'address1', rowId, warnings),
            address2: truncateOrNull(
                addressLine2Raw,
                255,
                'address2',
                rowId,
                warnings,
            ),
            city: truncate(city, 100, 'city', rowId, warnings),
            stateCode: truncate(stateCode, 10, 'stateCode', rowId, warnings),
            postalCode: truncate(postalCode, 20, 'postalCode', rowId, warnings),
            countryCode: 'US',
            contactName: truncateOrNull(
                contactRaw,
                255,
                'contactName',
                rowId,
                warnings,
            ),
            mainPhone: truncateOrNull(
                phoneRaw,
                20,
                'mainPhone',
                rowId,
                warnings,
            ),
            isDefault,
            customerNote: null,
        });
    }

    return { valid, skipped, warnings, duplicateCount };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing legacy ship-to addresses ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    const rows = readCsv();
    console.log(`  CSV rows read: ${rows.length}`);

    // Load existing customers for FK validation
    const { default: db } = await import('../../lib/db');
    const { customers } = await import('../../features/customers/schema');

    const customerRows = await db
        .select({ customerNumber: customers.customerNumber })
        .from(customers);
    const existingCustomers = new Set(
        customerRows.map((r) => r.customerNumber),
    );
    console.log(`  Existing customers in DB: ${existingCustomers.size}`);

    const { valid, skipped, warnings, duplicateCount } = transformRows(
        rows,
        existingCustomers,
    );
    console.log(`  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    // Summarize skip reasons
    const notFoundCount = skipped.filter((s) =>
        s.reason.includes('not found in database'),
    ).length;
    const notFoundUnique = new Set(
        skipped
            .filter((s) => s.reason.includes('not found in database'))
            .map((s) => s.custNumber),
    ).size;
    const emptyCount = skipped.filter((s) =>
        s.reason.includes('Empty row'),
    ).length;
    const noteCount = skipped.filter((s) =>
        s.reason.includes('Note-like'),
    ).length;
    const missingCustCount = skipped.filter((s) =>
        s.reason.includes('Missing Cust'),
    ).length;

    console.log(`\n  Skip breakdown:`);
    console.log(
        `    Customer not found: ${notFoundCount} rows (${notFoundUnique} unique customers)`,
    );
    console.log(`    Duplicates: ${duplicateCount}`);
    console.log(`    Empty rows: ${emptyCount}`);
    console.log(`    Note-like entries: ${noteCount}`);
    console.log(`    Missing Cust Number: ${missingCustCount}`);

    if (warnings.length > 0) {
        console.log(`\n  ⚠️  Data warnings (${warnings.length}):`);
        for (const w of warnings) {
            console.log(w);
        }
    }

    if (skipped.length > 0) {
        console.log('\n  ⚠️  Skipped rows:');
        for (const s of skipped) {
            console.log(`    Line ${s.line} [${s.custNumber}]: ${s.reason}`);
        }
    }

    if (isDryRun) {
        // Export skipped rows to CSV for client review
        if (skipped.length > 0) {
            const csvHeaders = [
                'CSV Line',
                'Skip Reason',
                'Cust Number',
                'ShiptoAddressNo',
                'LocationName',
                'ShipToStreet',
                'AddressLine2',
                'ShiptoCity',
                'ShiptoState',
                'ShiptoZip',
                'Contact',
                'Phone Number',
            ];
            const escapeCsv = (val: string) => {
                if (
                    val.includes(',') ||
                    val.includes('"') ||
                    val.includes('\n')
                ) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            };
            const csvRows = skipped.map((s) =>
                [
                    s.line.toString(),
                    s.reason,
                    s.originalRow['Cust Number'] || '',
                    s.originalRow['ShiptoAddressNo'] || '',
                    s.originalRow['LocationName'] || '',
                    s.originalRow['ShipToStreet'] || '',
                    s.originalRow['AddressLine2'] || '',
                    s.originalRow['ShiptoCity'] || '',
                    s.originalRow['ShiptoState'] || '',
                    s.originalRow['ShiptoZip'] || '',
                    s.originalRow['Contact'] || '',
                    s.originalRow['Phone Number'] || '',
                ]
                    .map(escapeCsv)
                    .join(','),
            );
            const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
            const outPath = resolve(
                __dirname,
                '../../data/skipped-ship-to-addresses.csv',
            );
            writeFileSync(outPath, csvContent, 'utf-8');
            console.log(
                `\n  📄 Skipped rows exported to: data/skipped-ship-to-addresses.csv`,
            );
        }

        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would insert ship-to addresses: ${valid.length}`);
        if (valid.length > 0) {
            console.log(
                `  ID range: ${valid[0].shipToId} – ${valid[valid.length - 1].shipToId}`,
            );
        }
        process.exit(0);
    }

    // Insert ship-to addresses
    const { shipToAddresses } = await import('../../features/customers/schema');

    if (valid.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            await db
                .insert(shipToAddresses)
                .values(batch)
                .onConflictDoNothing();
            inserted += batch.length;
            console.log(`  Inserted batch: ${inserted}/${valid.length}`);
        }
        console.log(
            `\n✅ Ship-to address import complete. ${inserted} rows inserted.`,
        );
    } else {
        console.log('\n⚠️  No valid rows to insert.');
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
