// scripts/import/import-products.ts — Import legacy product data from CSV
// Run with: npx tsx scripts/import/import-products.ts [--limit N] [--dry-run]

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { NewProduct } from '../../features/products/types';

const CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - Products.csv',
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

function parseIntOrDefault(value: string, fallback: number = 0): number {
    if (!value || value.trim() === '') return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
}

function parseNumericOrDefault(value: string, fallback: string = '0'): string {
    if (!value || value.trim() === '') return fallback;
    const cleaned = value.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed.toString();
}

function emptyToNull(value: string): string | null {
    const trimmed = value?.trim();
    if (!trimmed || trimmed === '') return null;
    return trimmed;
}

function parseDate(mmddyyyy: string): string | null {
    if (!mmddyyyy || mmddyyyy.trim() === '') return null;
    // Handle "MM/DD/YYYY" and "MM/DD/YYYY 0:00:00" formats
    const dateOnly = mmddyyyy.split(' ')[0];
    const parts = dateOnly.split('/');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts;
    const result = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    // Basic sanity check
    if (isNaN(Date.parse(result))) return null;
    return result;
}

function readCsv(): Record<string, string>[] {
    const content = readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
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
    productId: string;
    reason: string;
}

function transformRows(rows: Record<string, string>[]) {
    const valid: NewProduct[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];
    const seenProductIds = new Set<number>();
    const seenItemNumbers = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const productIdRaw = r['Product ID']?.trim();
        const itemNumber = r['ItemNumber']?.trim();

        if (!productIdRaw) {
            skipped.push({
                line: i + 2,
                productId: '(empty)',
                reason: 'Missing Product ID',
            });
            continue;
        }

        const productId = parseInt(productIdRaw, 10);
        if (isNaN(productId)) {
            skipped.push({
                line: i + 2,
                productId: productIdRaw,
                reason: `Invalid Product ID: "${productIdRaw}"`,
            });
            continue;
        }

        if (!itemNumber) {
            skipped.push({
                line: i + 2,
                productId: productIdRaw,
                reason: 'Missing ItemNumber',
            });
            continue;
        }

        // Dedup by product_id
        if (seenProductIds.has(productId)) {
            skipped.push({
                line: i + 2,
                productId: productIdRaw,
                reason: `Duplicate Product ID: ${productId}`,
            });
            continue;
        }

        // Dedup by item_number
        if (seenItemNumbers.has(itemNumber)) {
            skipped.push({
                line: i + 2,
                productId: productIdRaw,
                reason: `Duplicate ItemNumber: ${itemNumber}`,
            });
            continue;
        }

        seenProductIds.add(productId);
        seenItemNumbers.add(itemNumber);

        const description =
            r['Product Description']?.trim() || 'No description';

        valid.push({
            productId,
            itemNumber,
            description,
            cartonNumber: emptyToNull(r['CartonNumber']),
            unitSoldBy: r['UnitSoldBy']?.trim() || 'EA',
            minQty: parseIntOrDefault(r['MinQty']),
            maxQty: parseIntOrDefault(r['MaxQty']),
            productType: r['ProductType']?.trim() || 'N/A',
            dimensionsL: parseNumericOrDefault(r['DimensionsL']),
            dimensionsW: parseNumericOrDefault(r['DimensionsW']),
            dimensionsH: parseNumericOrDefault(r['DimensionsH']),
            cubicFeet: parseNumericOrDefault(r['CubicFeet']),
            caseWeight: parseNumericOrDefault(r['CaseWeight']),
            upcNumber: emptyToNull(r['UPCNumber']),
            landedCost: parseMoney(r['LandedCost']),
            minimumPackPrice: parseMoney(r['MinimumPackPrice']),
            casePrice: parseMoney(r['CasePrice']),
            qtyInStock: parseIntOrDefault(r['QtyInStock']),
            qtyCommitted: parseIntOrDefault(r['QtyCommited']),
            qtyAvailable: parseIntOrDefault(r['QtyAvailable']),
            qtyOnOrder: parseIntOrDefault(r['QtyOrdered']),
            nob: r['NOB']?.trim() ? parseIntOrDefault(r['NOB']) : null,
            isDiscontinued: r['Discontinued']?.trim() === '1',
            htsCode: emptyToNull(r['HTSCode']),
        });
    }

    return { valid, skipped, warnings };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing products ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    const rows = readCsv();
    console.log(`  CSV rows read: ${rows.length}`);

    const { valid, skipped, warnings } = transformRows(rows);
    console.log(`  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    // Status breakdown
    const activeCount = valid.filter((p) => !p.isDiscontinued).length;
    const discontinuedCount = valid.filter((p) => p.isDiscontinued).length;
    console.log(`  Active: ${activeCount}, Discontinued: ${discontinuedCount}`);

    if (warnings.length > 0) {
        console.log(`\n  ⚠️  Data warnings (${warnings.length}):`);
        for (const w of warnings) {
            console.log(w);
        }
    }

    if (skipped.length > 0) {
        console.log('\n  ⚠️  Skipped rows:');
        for (const s of skipped) {
            console.log(`    Line ${s.line} [${s.productId}]: ${s.reason}`);
        }
    }

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would insert products: ${valid.length}`);
        if (valid.length > 0) {
            console.log(
                `  Product ID range: ${valid[0].productId} – ${valid[valid.length - 1].productId}`,
            );
        }
        process.exit(0);
    }

    // Insert products
    const { default: db } = await import('../../lib/db');
    const { products } = await import('../../features/products/schema');
    const { sql } = await import('drizzle-orm');

    if (valid.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            await db.insert(products).values(batch).onConflictDoNothing();
            inserted += batch.length;
            if (valid.length > BATCH_SIZE) {
                console.log(
                    `    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${inserted}/${valid.length}`,
                );
            }
        }
        console.log(`\n  ✅ Products inserted: ${inserted}`);
    } else {
        console.log('\n  No valid rows to insert.');
    }

    // Verify count
    const { default: db2 } = await import('../../lib/db');
    const [{ total }] = await db2
        .select({ total: sql<number>`count(*)` })
        .from(products);
    console.log(`  Total products in DB: ${total}`);

    console.log('\n✅ Import complete.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
