// scripts/import/import-vendors.ts — Import legacy vendor data from CSV
// Run with: npx tsx scripts/import/import-vendors.ts [--limit N] [--dry-run]
//
// Vendor.csv is headerless. Columns (0-indexed):
//   0  vendorCode
//   1  name
//   2  address1
//   3  address2
//   4  city
//   5  state
//   6  zip
//   7  phone
//   8  (unused)
//   9  fax
//   10 accountNumber
//   11 contactName
//   12 taxId
//   13 dateAdded (MM/DD/YYYY hh:mm:ss)
//   14 (unused flag)
//   15 (unused)
//   16 send1099 (Y/N)
//   17 vendorType (CS/CO)
//   18 (unused category code)
//   19 (unused code)
//   20 paymentTerms
//   21 glAccountCode
//   22 (unused)
//   23 inactive flag (0=active, 1=inactive) — inverted into isActive

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { NewVendor } from '../../features/vendors/types';
import type { VendorType } from '../../features/vendors/constants';

const CSV_PATH = resolve(__dirname, '../../data/Vendor.csv');

// --- CLI ---

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const rowLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// --- CSV helpers ---

/**
 * Parse a CSV file that may contain quoted fields with embedded commas and
 * newlines. Returns rows as arrays of string fields.
 */
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(field);
                field = '';
            } else if (ch === '\n' || ch === '\r') {
                if (ch === '\r' && text[i + 1] === '\n') i++;
                row.push(field);
                field = '';
                if (row.some((f) => f.length > 0)) rows.push(row);
                row = [];
            } else {
                field += ch;
            }
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        if (row.some((f) => f.length > 0)) rows.push(row);
    }
    return rows;
}

function readCsv(): string[][] {
    const text = readFileSync(CSV_PATH, 'utf-8');
    return parseCsv(text);
}

function cleanStr(v: string | undefined): string {
    return (v ?? '').trim();
}

function nullIfEmpty(v: string | undefined): string | null {
    const t = cleanStr(v);
    return t.length === 0 ? null : t;
}

function truncate(
    value: string,
    maxLen: number,
    field: string,
    vendorCode: string,
    warnings: string[],
): string {
    if (value.length > maxLen) {
        warnings.push(
            `  [${vendorCode}] ${field} truncated: "${value}" → ${maxLen} chars`,
        );
        return value.slice(0, maxLen);
    }
    return value;
}

function truncateOrNull(
    value: string | undefined,
    maxLen: number,
    field: string,
    vendorCode: string,
    warnings: string[],
): string | null {
    const t = cleanStr(value);
    if (!t) return null;
    return truncate(t, maxLen, field, vendorCode, warnings);
}

/** Parse MM/DD/YYYY[ hh:mm:ss] → YYYY-MM-DD, or null. */
function parseDateAdded(raw: string | undefined): string | null {
    const t = cleanStr(raw);
    if (!t) return null;
    const datePart = t.split(/\s+/)[0];
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(datePart);
    if (!m) return null;
    const month = m[1].padStart(2, '0');
    const day = m[2].padStart(2, '0');
    let year = m[3];
    if (year.length === 2) {
        const n = parseInt(year, 10);
        year = n > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
}

function parseYesNo(raw: string | undefined): boolean {
    return cleanStr(raw).toUpperCase() === 'Y';
}

function parseVendorType(raw: string | undefined): VendorType {
    const v = cleanStr(raw).toUpperCase();
    return v === 'CO' ? 'CO' : 'CS';
}

// --- Transform ---

interface SkippedRow {
    line: number;
    vendorCode: string;
    reason: string;
}

function transformRows(rows: string[][]) {
    const valid: NewVendor[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const vendorCode = cleanStr(r[0]);

        if (!vendorCode) {
            skipped.push({
                line: i + 1,
                vendorCode: '(empty)',
                reason: 'Missing vendor code',
            });
            continue;
        }

        if (seen.has(vendorCode)) {
            skipped.push({
                line: i + 1,
                vendorCode,
                reason: 'Duplicate vendor code in CSV',
            });
            continue;
        }
        seen.add(vendorCode);

        const name = cleanStr(r[1]);
        if (!name) {
            skipped.push({
                line: i + 1,
                vendorCode,
                reason: 'Missing vendor name',
            });
            continue;
        }

        const inactiveFlag = cleanStr(r[23]);
        const isActive = inactiveFlag !== '1';

        valid.push({
            vendorCode: truncate(
                vendorCode,
                10,
                'vendorCode',
                vendorCode,
                warnings,
            ),
            name: truncate(name, 255, 'name', vendorCode, warnings),
            address1: truncateOrNull(
                r[2],
                255,
                'address1',
                vendorCode,
                warnings,
            ),
            address2: truncateOrNull(
                r[3],
                255,
                'address2',
                vendorCode,
                warnings,
            ),
            city: truncateOrNull(r[4], 100, 'city', vendorCode, warnings),
            state: truncateOrNull(r[5], 10, 'state', vendorCode, warnings),
            zip: truncateOrNull(r[6], 20, 'zip', vendorCode, warnings),
            phone: truncateOrNull(r[7], 20, 'phone', vendorCode, warnings),
            fax: truncateOrNull(r[9], 20, 'fax', vendorCode, warnings),
            accountNumber: truncateOrNull(
                r[10],
                50,
                'accountNumber',
                vendorCode,
                warnings,
            ),
            contactName: truncateOrNull(
                r[11],
                100,
                'contactName',
                vendorCode,
                warnings,
            ),
            taxId: truncateOrNull(r[12], 20, 'taxId', vendorCode, warnings),
            dateAdded: parseDateAdded(r[13]),
            send1099: parseYesNo(r[16]),
            vendorType: parseVendorType(r[17]),
            paymentTerms: truncateOrNull(
                r[20],
                10,
                'paymentTerms',
                vendorCode,
                warnings,
            ),
            glAccountCode: truncateOrNull(
                r[21],
                10,
                'glAccountCode',
                vendorCode,
                warnings,
            ),
            isActive,
        });
    }

    return { valid, skipped, warnings };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing legacy vendors ${mode}${
            rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''
        }...\n`,
    );

    let rows = readCsv();
    console.log(`  CSV rows read: ${rows.length}`);
    if (rows.length > rowLimit) rows = rows.slice(0, rowLimit);

    const { valid, skipped, warnings } = transformRows(rows);
    console.log(`  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    if (warnings.length > 0) {
        console.log(`\n  ⚠️  Data warnings (${warnings.length}):`);
        for (const w of warnings) console.log(w);
    }

    if (skipped.length > 0) {
        console.log('\n  ⚠️  Skipped rows:');
        for (const s of skipped) {
            console.log(`    Line ${s.line} [${s.vendorCode}]: ${s.reason}`);
        }
    }

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would upsert vendors: ${valid.length}`);
        process.exit(0);
    }

    const { default: db } = await import('../../lib/db');
    const { vendors } = await import('../../features/vendors/schema');
    const { sql } = await import('drizzle-orm');

    if (valid.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            const result = await db
                .insert(vendors)
                .values(batch)
                .onConflictDoUpdate({
                    target: vendors.vendorCode,
                    set: {
                        name: sql`excluded.name`,
                        address1: sql`excluded.address_1`,
                        address2: sql`excluded.address_2`,
                        city: sql`excluded.city`,
                        state: sql`excluded.state`,
                        zip: sql`excluded.zip`,
                        phone: sql`excluded.phone`,
                        fax: sql`excluded.fax`,
                        accountNumber: sql`excluded.account_number`,
                        contactName: sql`excluded.contact_name`,
                        taxId: sql`excluded.tax_id`,
                        dateAdded: sql`excluded.date_added`,
                        send1099: sql`excluded.send_1099`,
                        vendorType: sql`excluded.vendor_type`,
                        paymentTerms: sql`excluded.payment_terms`,
                        glAccountCode: sql`excluded.gl_account_code`,
                        isActive: sql`excluded.is_active`,
                        updatedAt: sql`now()`,
                    },
                })
                .returning({ id: vendors.id });
            inserted += result.length;
        }
        console.log(`\n  ✅ Upserted ${inserted} vendor rows.`);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
});
