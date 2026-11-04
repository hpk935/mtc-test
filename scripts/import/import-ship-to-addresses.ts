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
const isFixSkipped = args.includes('--fix-skipped');
const limitIdx = args.indexOf('--limit');
const rowLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

const SKIPPED_CSV_PATH = resolve(
    __dirname,
    '../../data/skipped-ship-to-addresses.csv',
);

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
    plus4: string,
    stateCode: string,
    rowId: string,
    warnings: string[],
): string {
    // Blank stays blank: imports skip form validation, and the edit form
    // accepts an unchanged blank (see updateShipToSchemaFor).
    if (!postalCode) return '';
    let zip = postalCode;
    if (
        /^\d+$/.test(postalCode) &&
        postalCode.length < 5 &&
        US_POSTAL_STATE_CODES.has(stateCode.toUpperCase())
    ) {
        zip = postalCode.padStart(5, '0');
        warnings.push(
            `  [${rowId}] postalCode padded: "${postalCode}" → "${zip}"`,
        );
    }
    // Append the +4 to 5-digit US zips. Like the zip, it may have lost its
    // leading zeros in the legacy export ("999" → "0999").
    if (/^\d{5}$/.test(zip) && /^\d{1,4}$/.test(plus4)) {
        return `${zip}-${plus4.padStart(4, '0')}`;
    }
    return zip;
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

// --- Customer number correction ---

/** Valid prefixes are 00–25 (26 letter-based groups). Anything >= 26 is corrupted. */
function correctCustomerNumber(custNumber: string): {
    original: string;
    corrected: string;
    wasCorrected: boolean;
} {
    const match = custNumber.match(/^(\d+)-(\d+)$/);
    if (!match)
        return {
            original: custNumber,
            corrected: custNumber,
            wasCorrected: false,
        };

    const prefix = parseInt(match[1], 10);
    if (prefix <= 25)
        return {
            original: custNumber,
            corrected: custNumber,
            wasCorrected: false,
        };

    // e.g. "41-007" → prefixStr="41", rest="007"
    // First digit of prefix becomes second digit of new prefix: "0" + "4" = "04"
    // Second digit of prefix becomes first digit of new suffix: "1" + "007" = "1007"
    const prefixStr = match[1];
    const rest = match[2];
    const newPrefix = '0' + prefixStr[0]; // e.g. "04"
    const newSuffix = prefixStr.slice(1) + rest; // e.g. "1007"
    const corrected = `${newPrefix}-${newSuffix}`;

    return { original: custNumber, corrected, wasCorrected: true };
}

/** Read the skipped CSV and return rows with corrupted customer numbers (prefix >= 26, "not found" reason). */
function readSkippedCsv(): Record<string, string>[] {
    const content = readFileSync(SKIPPED_CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const headers = parseCsvLine(lines[0]);
    // Skipped CSV columns: CSV Line, Skip Reason, Cust Number, ShiptoAddressNo, LocationName, ShipToStreet, AddressLine2, ShiptoCity, ShiptoState, ShiptoZip, Contact, Phone Number, ShiptoZip4
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });

        const reason = row['Skip Reason'] || '';
        const custNumber = row['Cust Number']?.trim();
        if (!reason.includes('not found in database') || !custNumber) continue;

        const { wasCorrected } = correctCustomerNumber(custNumber);
        if (!wasCorrected) continue;

        // Map skipped CSV columns back to the original CSV column names expected by transformRows
        rows.push({
            'Cust Number': custNumber,
            ShiptoAddressNo: row['ShiptoAddressNo'] || '',
            LocationName: row['LocationName'] || '',
            ShipToStreet: row['ShipToStreet'] || '',
            AddressLine2: row['AddressLine2'] || '',
            ShiptoCity: row['ShiptoCity'] || '',
            ShiptoState: row['ShiptoState'] || '',
            ShiptoZip: row['ShiptoZip'] || '',
            ShiptoZip4: row['ShiptoZip4'] || '',
            Contact: row['Contact'] || '',
            'Phone Number': row['Phone Number'] || '',
        });
    }
    return rows;
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
    opts?: {
        idCounterStart?: number;
        customersWithExistingAddresses?: Set<string>;
    },
) {
    const valid: NewShipToAddress[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];

    // Track first valid address per customer for isDefault
    // Pre-seed with customers that already have addresses in DB
    const firstSeenPerCustomer = new Set<string>(
        opts?.customersWithExistingAddresses ?? [],
    );
    // Track seen (custNumber, addressNo) pairs for deduplication
    const seenKeys = new Set<string>();
    let idCounter = opts?.idCounterStart ?? 1;
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
        const zip4Raw = r['ShiptoZip4']?.trim() || '';
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

        // Address fields stay blank when the legacy row has none
        const address1 = streetRaw;

        // Clean city
        const city = stripTrailingComma(cityRaw);

        // State
        const stateCode = stateRaw;

        // Normalize postal code
        const postalCode = normalizePostalCode(
            zipRaw,
            zip4Raw,
            stateRaw,
            rowId,
            warnings,
        );

        // Derive location status
        const locationStatus = hasClosedMarker(locationNameRaw, addressLine2Raw)
            ? ('inactive' as const)
            : ('active' as const);

        // isFavorite: first valid address per customer
        const isFavorite = !firstSeenPerCustomer.has(custNumber);
        if (isFavorite) {
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
            isFavorite,
            customerNote: null,
        });
    }

    return { valid, skipped, warnings, duplicateCount };
}

// --- Fix skipped entries with corrupted customer numbers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fixSkipped(db: any, customers: any, shipToAddresses: any) {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔧 Fix-skipped: re-importing addresses with corrected customer numbers ${mode}...\n`,
    );

    // 1. Read skipped rows with corrupted prefixes
    const skippedRows = readSkippedCsv();
    console.log(
        `  Skipped rows with corrupted customer numbers: ${skippedRows.length}`,
    );

    // 2. Apply corrections and check which exist in DB
    const customerRows = await db
        .select({ customerNumber: customers.customerNumber })
        .from(customers);
    const existingCustomers = new Set<string>(
        customerRows.map((r: { customerNumber: string }) => r.customerNumber),
    );
    console.log(`  Existing customers in DB: ${existingCustomers.size}`);

    const corrections: {
        original: string;
        corrected: string;
        foundInDb: boolean;
    }[] = [];
    const correctedRows: Record<string, string>[] = [];

    for (const row of skippedRows) {
        const custNumber = row['Cust Number']?.trim();
        if (!custNumber) continue;

        const { corrected, wasCorrected } = correctCustomerNumber(custNumber);
        if (!wasCorrected) continue;

        const foundInDb = existingCustomers.has(corrected);
        corrections.push({ original: custNumber, corrected, foundInDb });

        if (foundInDb) {
            // Replace the customer number with the corrected one
            correctedRows.push({ ...row, 'Cust Number': corrected });
        }
    }

    // Log correction mapping
    const uniqueCorrections = new Map<
        string,
        { corrected: string; foundInDb: boolean }
    >();
    for (const c of corrections) {
        if (!uniqueCorrections.has(c.original)) {
            uniqueCorrections.set(c.original, {
                corrected: c.corrected,
                foundInDb: c.foundInDb,
            });
        }
    }

    const matchedCount = corrections.filter((c) => c.foundInDb).length;
    const unmatchedCount = corrections.filter((c) => !c.foundInDb).length;
    const uniqueMatched = new Set(
        corrections.filter((c) => c.foundInDb).map((c) => c.corrected),
    ).size;
    const uniqueUnmatched = new Set(
        corrections.filter((c) => !c.foundInDb).map((c) => c.corrected),
    ).size;

    console.log(`\n  Correction summary:`);
    console.log(
        `    Matched in DB: ${matchedCount} rows (${uniqueMatched} unique customers)`,
    );
    console.log(
        `    Not matched: ${unmatchedCount} rows (${uniqueUnmatched} unique customers)`,
    );

    // Print unmatched corrections for visibility
    if (uniqueUnmatched > 0) {
        console.log(`\n  Unmatched corrections:`);
        for (const [original, { corrected }] of uniqueCorrections) {
            if (!uniqueCorrections.get(original)!.foundInDb) {
                console.log(`    ${original} → ${corrected} (not in DB)`);
            }
        }
    }

    if (correctedRows.length === 0) {
        console.log(
            '\n⚠️  No corrected rows matched existing customers. Nothing to import.',
        );
        process.exit(0);
    }

    // 3. Determine starting ID counter from existing ship-to addresses
    const { sql } = await import('drizzle-orm');
    const maxIdResult = await db.execute(
        sql`SELECT MAX(CAST(SUBSTRING(ship_to_id FROM 3) AS INTEGER)) as max_num FROM ship_to_addresses`,
    );
    const maxExistingId = maxIdResult.rows?.[0]?.max_num ?? 0;
    const idCounterStart = (maxExistingId as number) + 1;
    console.log(
        `\n  Existing max ship-to ID: ST${String(maxExistingId).padStart(4, '0')}`,
    );
    console.log(
        `  New IDs will start from: ST${String(idCounterStart).padStart(4, '0')}`,
    );

    // 4. Determine which corrected customers already have addresses (for isFavorite)
    const correctedCustNumbers = [
        ...new Set(correctedRows.map((r) => r['Cust Number'])),
    ];
    const customersWithAddresses = new Set<string>();
    for (const cn of correctedCustNumbers) {
        const existing = await db
            .select({ shipToId: shipToAddresses.shipToId })
            .from(shipToAddresses)
            .where(sql`${shipToAddresses.customerNumber} = ${cn}`)
            .limit(1);
        if (existing.length > 0) {
            customersWithAddresses.add(cn);
        }
    }
    console.log(
        `  Customers already with addresses: ${customersWithAddresses.size}/${correctedCustNumbers.length}`,
    );

    // 5. Transform through existing pipeline
    const { valid, skipped, warnings, duplicateCount } = transformRows(
        correctedRows,
        existingCustomers,
        {
            idCounterStart,
            customersWithExistingAddresses: customersWithAddresses,
        },
    );

    console.log(`\n  Valid rows to import: ${valid.length}`);
    console.log(`  Skipped (still invalid): ${skipped.length}`);
    if (duplicateCount > 0) {
        console.log(`  Duplicates: ${duplicateCount}`);
    }

    // Skip breakdown
    if (skipped.length > 0) {
        const emptyCount = skipped.filter((s) =>
            s.reason.includes('Empty row'),
        ).length;
        const noteCount = skipped.filter((s) =>
            s.reason.includes('Note-like'),
        ).length;
        const otherCount =
            skipped.length - emptyCount - noteCount - duplicateCount;
        console.log(`    Empty rows: ${emptyCount}`);
        console.log(`    Note-like entries: ${noteCount}`);
        if (otherCount > 0) console.log(`    Other: ${otherCount}`);
    }

    if (warnings.length > 0) {
        console.log(`\n  ⚠️  Data warnings (${warnings.length}):`);
        for (const w of warnings) {
            console.log(w);
        }
    }

    // Sample of what will be inserted
    if (valid.length > 0) {
        console.log(`\n  Sample (first 5):`);
        for (const v of valid.slice(0, 5)) {
            console.log(
                `    ${v.shipToId} → ${v.customerNumber}: ${v.locationName}, ${v.city}, ${v.stateCode}`,
            );
        }
    }

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would insert ship-to addresses: ${valid.length}`);
        if (valid.length > 0) {
            console.log(
                `  ID range: ${valid[0].shipToId} – ${valid[valid.length - 1].shipToId}`,
            );
        }
        process.exit(0);
    }

    // 6. Insert
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
            `\n✅ Fix-skipped import complete. ${inserted} rows inserted.`,
        );
    } else {
        console.log('\n⚠️  No valid rows to insert.');
    }

    process.exit(0);
}

// --- Main ---

async function main() {
    const { default: db } = await import('../../lib/db');
    const { customers, shipToAddresses } =
        await import('../../features/customers/schema');

    if (isFixSkipped) {
        return fixSkipped(db, customers, shipToAddresses);
    }

    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing legacy ship-to addresses ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    const rows = readCsv();
    console.log(`  CSV rows read: ${rows.length}`);

    // Load existing customers for FK validation
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
                'ShiptoZip4',
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
            const csvRows = skipped
                .filter((s) => !s.reason.includes('not found in database'))
                .map((s) =>
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
                        s.originalRow['ShiptoZip4'] || '',
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
