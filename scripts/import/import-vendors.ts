// scripts/import/import-vendors.ts — Import legacy vendor data from CSV
// Run with: npx tsx scripts/import/import-vendors.ts [--limit N] [--dry-run]
//
// Reads data/new_data/Vendor.csv. Columns are looked up by header name:
//   Vendor_number → vendorCode
//   Name          → name
//   Address1/2    → address1/address2
//   City, State   → city, state
//   Zip_Code      → zip (with Zip_Code4 appended as ZIP+4 when present)
//   Phone, Fax    → phone, fax
//   Acct_ID       → accountNumber
//   Contact       → contactName
//   Federal_ID    → taxId
//   Date_Opened   → dateAdded (MM/DD/YY[YY] hh:mm:ss)
//   1099          → send1099 (Y/N)
//   APType        → vendorType (CS/CO)
//   TermsCode     → paymentTerms
//   AccountNo     → glAccountCode
//   Delete        → inactive flag (0=active, 1=inactive) — inverted into isActive
// Unused: Ext, Alt_Sequence, Hold_Invoices, DistCode, PaymentGroup

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { NewVendor } from '../../features/vendors/types';
import type { VendorType } from '../../features/vendors/constants';

const CSV_PATH = resolve(__dirname, '../../data/new_data/Vendor.csv');

const COLUMNS = [
    'Vendor_number',
    'Name',
    'Address1',
    'Address2',
    'City',
    'State',
    'Zip_Code',
    'Zip_Code4',
    'Phone',
    'Fax',
    'Acct_ID',
    'Contact',
    'Federal_ID',
    'Date_Opened',
    '1099',
    'APType',
    'TermsCode',
    'AccountNo',
    'Delete',
] as const;

type Column = (typeof COLUMNS)[number];
type CsvRow = Record<Column, string>;

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

function readCsv(): CsvRow[] {
    const text = readFileSync(CSV_PATH, 'utf-8').replace(/^﻿/, '');
    const [header, ...rows] = parseCsv(text);
    const headerIndex = new Map(header.map((h, i) => [h.trim(), i]));

    const missing = COLUMNS.filter((c) => !headerIndex.has(c));
    if (missing.length > 0) {
        throw new Error(`Vendor.csv is missing columns: ${missing.join(', ')}`);
    }

    return rows.map(
        (r) =>
            Object.fromEntries(
                COLUMNS.map((c) => [c, r[headerIndex.get(c)!] ?? '']),
            ) as CsvRow,
    );
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

/** Zip_Code + Zip_Code4 → "12345-6789", or just the 5-digit zip. */
function joinZip(zip: string, plus4: string): string {
    const z = cleanStr(zip);
    const p = cleanStr(plus4);
    return z && p ? `${z}-${p}` : z;
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

function transformRows(rows: CsvRow[]) {
    const valid: NewVendor[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const vendorCode = cleanStr(r.Vendor_number);

        if (!vendorCode) {
            skipped.push({
                line: i + 2,
                vendorCode: '(empty)',
                reason: 'Missing vendor code',
            });
            continue;
        }

        if (seen.has(vendorCode)) {
            skipped.push({
                line: i + 2,
                vendorCode,
                reason: 'Duplicate vendor code in CSV',
            });
            continue;
        }
        seen.add(vendorCode);

        const name = cleanStr(r.Name);
        if (!name) {
            skipped.push({
                line: i + 2,
                vendorCode,
                reason: 'Missing vendor name',
            });
            continue;
        }

        const inactiveFlag = cleanStr(r.Delete);
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
                r.Address1,
                255,
                'address1',
                vendorCode,
                warnings,
            ),
            address2: truncateOrNull(
                r.Address2,
                255,
                'address2',
                vendorCode,
                warnings,
            ),
            city: truncateOrNull(r.City, 100, 'city', vendorCode, warnings),
            state: truncateOrNull(r.State, 10, 'state', vendorCode, warnings),
            zip: truncateOrNull(
                joinZip(r.Zip_Code, r.Zip_Code4),
                20,
                'zip',
                vendorCode,
                warnings,
            ),
            phone: truncateOrNull(r.Phone, 20, 'phone', vendorCode, warnings),
            fax: truncateOrNull(r.Fax, 20, 'fax', vendorCode, warnings),
            accountNumber: truncateOrNull(
                r.Acct_ID,
                50,
                'accountNumber',
                vendorCode,
                warnings,
            ),
            contactName: truncateOrNull(
                r.Contact,
                100,
                'contactName',
                vendorCode,
                warnings,
            ),
            taxId: truncateOrNull(
                r.Federal_ID,
                20,
                'taxId',
                vendorCode,
                warnings,
            ),
            dateAdded: parseDateAdded(r.Date_Opened),
            send1099: parseYesNo(r['1099']),
            vendorType: parseVendorType(r.APType),
            paymentTerms: truncateOrNull(
                r.TermsCode,
                10,
                'paymentTerms',
                vendorCode,
                warnings,
            ),
            glAccountCode: truncateOrNull(
                r.AccountNo,
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
