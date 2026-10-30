// scripts/import/import-customers.ts — Import legacy customer data from CSV
// Run with: npx tsx scripts/import/import-customers.ts [--limit N] [--dry-run]

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ensureReferenceCodes } from './ensure-reference-codes';
import type { AccountStatus } from '../../features/customers/constants';
import type { NewCustomer } from '../../features/customers/types';

const CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - Customers.csv',
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

function parseMoney(value: string): string {
    if (!value) return '0';
    return value.replace(/[$,]/g, '') || '0';
}

function truncate(
    value: string,
    maxLen: number,
    field: string,
    customerNumber: string,
    warnings: string[],
): string {
    if (value.length > maxLen) {
        warnings.push(
            `  [${customerNumber}] ${field} truncated: "${value}" → ${maxLen} chars`,
        );
        return value.slice(0, maxLen);
    }
    return value;
}

function truncateOrNull(
    value: string,
    maxLen: number,
    field: string,
    customerNumber: string,
    warnings: string[],
): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    return truncate(trimmed, maxLen, field, customerNumber, warnings);
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
    customerNumber: string,
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
            `  [${customerNumber}] billingPostalCode padded: "${postalCode}" → "${padded}"`,
        );
        return padded;
    }
    return postalCode;
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

function parseDate(mmddyyyy: string): string | null {
    if (!mmddyyyy || mmddyyyy.trim() === '') return null;
    const parts = mmddyyyy.split('/');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function toSalespersonCode(salesman: string): string {
    if (!salesman || salesman.trim() === '') return 'E00';
    return `E${salesman.padStart(2, '0')}`;
}

function deriveAccountStatus(inactive: string, onHold: string): AccountStatus {
    const isInactive = inactive === '-1';
    const isOnHold = onHold === '-1';

    if (isInactive && isOnHold) return 'on_hold';
    if (isInactive) return 'inactive';
    if (isOnHold) return 'on_hold';
    return 'active';
}

function hasStoreClosed(row: Record<string, string>): boolean {
    const fields = [
        row['Company Name'],
        row['Billing Address'],
        row['AddressLine2'],
    ];
    return fields.some((f) => f && /store\s*closed/i.test(f));
}

// --- Salesperson seeding ---

async function seedSalespersons(codes: string[]) {
    const { default: db } = await import('../../lib/db');
    const { users } = await import('../../features/users/schema');
    const { hashPassword } = await import('../../features/auth/service');
    const { eq } = await import('drizzle-orm');

    const unique = [...new Set(codes)];
    let created = 0;

    for (const empId of unique) {
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.employeeId, empId))
            .limit(1);

        if (existing.length > 0) continue;

        const passwordHash = await hashPassword('changeme123');
        const num = empId.replace('E', '').padStart(3, '0');
        await db.insert(users).values({
            employeeId: empId,
            email: `${empId.toLowerCase()}@mtc.com`,
            passwordHash,
            firstName: 'Sales',
            lastName: `Rep ${num}`,
            role: 'employee',
        });
        created++;
    }

    console.log(
        `  Salesperson users: ${created} created, ${unique.length - created} already existed`,
    );
}

// --- Transform rows ---

interface SkippedRow {
    line: number;
    customerNumber: string;
    reason: string;
}

function transformRows(rows: Record<string, string>[]) {
    const valid: NewCustomer[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const customerNumber = r['CustomerNumber']?.trim();

        if (!customerNumber) {
            skipped.push({
                line: i + 2,
                customerNumber: '(empty)',
                reason: 'Missing CustomerNumber',
            });
            continue;
        }

        const customerName =
            r['Company Name']?.trim() ||
            r['Contact Person']?.trim() ||
            'Unknown';
        const primaryContactName = r['Contact Person']?.trim() || 'Unknown';
        const billingAddress1 = r['Billing Address']?.trim() || 'N/A';
        const billingCity = r['City']?.trim() || 'N/A';
        const billingStateCode = r['State/Province']?.trim() || 'N/A';
        const billingPostalCode = normalizePostalCode(
            r['Postal Code']?.trim() ?? '',
            billingStateCode,
            customerNumber,
            warnings,
        );
        const mainPhone = r['Phone Number']?.trim() || 'N/A';
        const email = r['Email']?.trim();
        const mainEmail = email || `${customerNumber}@legacy.mtc.com`;
        const termCode = r['Terms']?.trim() || 'N/A';
        const territoryCode = r['Territory']?.trim() || 'N/A';
        const salespersonCode = toSalespersonCode(r['Salesman']);
        const defaultFreightTerm = r['FreightPayment']?.trim() || 'N/A';
        const accountOpenDate = parseDate(r['AccountOpenDate']);

        if (!accountOpenDate) {
            skipped.push({
                line: i + 2,
                customerNumber,
                reason: `Invalid AccountOpenDate: "${r['AccountOpenDate']}"`,
            });
            continue;
        }

        valid.push({
            customerNumber: truncate(
                customerNumber,
                20,
                'customerNumber',
                customerNumber,
                warnings,
            ),
            customerName: truncate(
                customerName,
                255,
                'customerName',
                customerNumber,
                warnings,
            ),
            primaryContactName: truncate(
                primaryContactName,
                255,
                'primaryContactName',
                customerNumber,
                warnings,
            ),
            billingAddress1: truncate(
                billingAddress1,
                255,
                'billingAddress1',
                customerNumber,
                warnings,
            ),
            billingAddress2: truncateOrNull(
                r['AddressLine2'],
                255,
                'billingAddress2',
                customerNumber,
                warnings,
            ),
            billingCity: truncate(
                billingCity,
                100,
                'billingCity',
                customerNumber,
                warnings,
            ),
            billingStateCode: truncate(
                billingStateCode,
                10,
                'billingStateCode',
                customerNumber,
                warnings,
            ),
            billingPostalCode,
            countryCode: 'US',
            mainPhone: truncate(
                mainPhone,
                20,
                'mainPhone',
                customerNumber,
                warnings,
            ),
            phoneExtension:
                r['Extension']?.trim() === '0'
                    ? null
                    : truncateOrNull(
                          r['Extension'],
                          10,
                          'phoneExtension',
                          customerNumber,
                          warnings,
                      ),
            faxNumber: truncateOrNull(
                r['Fax Number'],
                20,
                'faxNumber',
                customerNumber,
                warnings,
            ),
            mainEmail: truncate(
                mainEmail,
                255,
                'mainEmail',
                customerNumber,
                warnings,
            ),
            taxId: truncateOrNull(
                r['FedIDNo'],
                20,
                'taxId',
                customerNumber,
                warnings,
            ),
            termCode: truncate(
                termCode,
                10,
                'termCode',
                customerNumber,
                warnings,
            ),
            territoryCode: truncate(
                territoryCode,
                20,
                'territoryCode',
                customerNumber,
                warnings,
            ),
            salespersonCode: truncate(
                salespersonCode,
                10,
                'salespersonCode',
                customerNumber,
                warnings,
            ),
            defaultFreightTerm: truncate(
                defaultFreightTerm,
                50,
                'defaultFreightTerm',
                customerNumber,
                warnings,
            ),
            creditBalance: parseMoney(r['Credit']),
            accountStatus: hasStoreClosed(r)
                ? 'inactive'
                : deriveAccountStatus(r['Inactive'], r['AccountOnHold']),
            accountOpenDate,
        });
    }

    return { valid, skipped, warnings };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing legacy customers ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    const rows = readCsv();
    console.log(`  CSV rows read: ${rows.length}`);

    const { valid, skipped, warnings } = transformRows(rows);
    console.log(`  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    if (warnings.length > 0) {
        console.log(`\n  ⚠️  Data warnings (${warnings.length}):`);
        for (const w of warnings) {
            console.log(w);
        }
    }

    if (skipped.length > 0) {
        console.log('\n  ⚠️  Skipped rows:');
        for (const s of skipped) {
            console.log(
                `    Line ${s.line} [${s.customerNumber}]: ${s.reason}`,
            );
        }
    }

    // Collect salesperson codes
    const salespersonCodes = valid.map((r) => r.salespersonCode as string);

    await ensureReferenceCodes(valid, { dryRun: isDryRun });

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(
            `  Would create salesperson users: ${[...new Set(salespersonCodes)].length}`,
        );
        console.log(`  Would insert customers: ${valid.length}`);
        process.exit(0);
    }

    // Seed salesperson placeholder users
    await seedSalespersons(salespersonCodes);

    // Insert customers
    const { default: db } = await import('../../lib/db');
    const { customers } = await import('../../features/customers/schema');
    const { sql } = await import('drizzle-orm');

    if (valid.length > 0) {
        // Batch inserts to stay under PostgreSQL's 65534 parameter limit
        // ~21 columns per row → ~3000 rows per batch is safe
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            await db.insert(customers).values(batch).onConflictDoNothing();
            inserted += batch.length;
            if (valid.length > BATCH_SIZE) {
                console.log(
                    `    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${inserted}/${valid.length}`,
                );
            }
        }
        console.log(`\n  ✅ Customers inserted: ${inserted}`);
    } else {
        console.log('\n  No valid rows to insert.');
    }

    // Verify count
    const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(customers);
    console.log(`  Total customers in DB: ${total}`);

    console.log('\n✅ Import complete.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
