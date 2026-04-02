// scripts/import/import-order-items.ts — Import line items from legacy order data
// Run with: npx tsx scripts/import/import-order-items.ts [--limit N] [--dry-run]
//
// Reads two CSVs:
//   - last6MonthInvoices.csv     → builds OrderID → InvoiceNo mapping
//   - last6MonthOrderItems.csv   → line items keyed by OrderID (primary source)

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { NewOrderItem } from '../../features/orders/types';

const INVOICES_CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - last6MonthInvoices.csv',
);
const ITEMS_CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - last6MonthOrderItems.csv',
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

function readCsv(
    path: string,
    limit: number = Infinity,
): Record<string, string>[] {
    const content = readFileSync(path, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const headers = parseCsvLine(lines[0]);
    const rows: Record<string, string>[] = [];

    const dataEnd = Math.min(lines.length, 1 + limit);
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

// --- Build Order → Invoice mapping ---

function buildOrderToInvoiceMap(
    invoiceRows: Record<string, string>[],
): Map<string, string> {
    const map = new Map<string, string>();
    for (const r of invoiceRows) {
        const orderId = r['OrderID']?.trim();
        const invoiceNo = r['InvoiceNo']?.trim();
        if (orderId && invoiceNo) {
            map.set(orderId, invoiceNo);
        }
    }
    return map;
}

// --- Transforms ---

interface SkippedRow {
    line: number;
    orderId: string;
    reason: string;
}

function transformRows(
    rows: Record<string, string>[],
    orderToInvoice: Map<string, string>,
    existingOrders: Set<string>,
    existingProducts: Set<string>,
    existingInvoices: Set<string>,
) {
    const valid: NewOrderItem[] = [];
    const skipped: SkippedRow[] = [];
    const warnings: string[] = [];
    let productNotFoundCount = 0;
    let orderNotFoundCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const orderId = r['Order ID']?.trim();
        const itemNumber = r['Product']?.trim();

        if (!orderId) {
            skipped.push({
                line: i + 2,
                orderId: '(empty)',
                reason: 'Missing Order ID',
            });
            continue;
        }

        if (!itemNumber) {
            skipped.push({
                line: i + 2,
                orderId,
                reason: 'Missing Product/ItemNumber',
            });
            continue;
        }

        // Check order exists in DB
        if (!existingOrders.has(orderId)) {
            orderNotFoundCount++;
            skipped.push({
                line: i + 2,
                orderId,
                reason: `Order ${orderId} not found in database`,
            });
            continue;
        }

        // Check product exists in DB
        if (!existingProducts.has(itemNumber)) {
            productNotFoundCount++;
            skipped.push({
                line: i + 2,
                orderId,
                reason: `Product ${itemNumber} not found in database`,
            });
            continue;
        }

        // Look up invoice number (nullable)
        const invoiceNumber = orderToInvoice.get(orderId) ?? null;
        const invoiceExists =
            invoiceNumber && existingInvoices.has(invoiceNumber);

        if (invoiceNumber && !invoiceExists) {
            warnings.push(
                `  [line ${i + 2}] Invoice ${invoiceNumber} for order ${orderId} not in DB — setting to null`,
            );
        }

        const unitPrice = parseMoney(r['Unit Price']);
        const qtyOrdered = parseIntOrDefault(r['QuantityOrder']);
        const qtyShipped = parseIntOrDefault(r['QuantityShipped']);
        const discount = parseMoney(r['Discount']);
        const unitCost = parseMoney(r['Cost']);
        const lineTotal = (parseFloat(unitPrice) * qtyShipped).toFixed(2);

        valid.push({
            orderNumber: orderId,
            invoiceNumber: invoiceExists ? invoiceNumber : null,
            itemNumber,
            unitPrice,
            qtyOrdered,
            qtyShipped,
            discount,
            unitCost,
            lineTotal,
        });
    }

    return {
        valid,
        skipped,
        warnings,
        productNotFoundCount,
        orderNotFoundCount,
    };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing order items ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    // 1. Read CSVs
    const invoiceRows = readCsv(INVOICES_CSV_PATH);
    console.log(`  Invoice header CSV rows: ${invoiceRows.length}`);

    const itemRows = readCsv(ITEMS_CSV_PATH, rowLimit);
    console.log(`  Line item CSV rows: ${itemRows.length}`);

    // 2. Build order → invoice mapping
    const orderToInvoice = buildOrderToInvoiceMap(invoiceRows);
    console.log(`  Order→Invoice mappings: ${orderToInvoice.size}`);

    // 3. Load existing records for FK validation
    const { default: db } = await import('../../lib/db');
    const { orders, orderItems } = await import('../../features/orders/schema');
    const { invoices } = await import('../../features/invoices/schema');
    const { products } = await import('../../features/products/schema');
    const { sql } = await import('drizzle-orm');

    const orderRows = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders);
    const existingOrders = new Set(orderRows.map((r) => r.orderNumber));
    console.log(`  Existing orders in DB: ${existingOrders.size}`);

    const productRows = await db
        .select({ itemNumber: products.itemNumber })
        .from(products);
    const existingProducts = new Set(productRows.map((r) => r.itemNumber));
    console.log(`  Existing products in DB: ${existingProducts.size}`);

    const invoiceDbRows = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices);
    const existingInvoices = new Set(invoiceDbRows.map((r) => r.invoiceNumber));
    console.log(`  Existing invoices in DB: ${existingInvoices.size}`);

    // 4. Transform
    const {
        valid,
        skipped,
        warnings,
        productNotFoundCount,
        orderNotFoundCount,
    } = transformRows(
        itemRows,
        orderToInvoice,
        existingOrders,
        existingProducts,
        existingInvoices,
    );

    console.log(`\n  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    // Skip breakdown
    const missingOrderCount = skipped.filter(
        (s) =>
            s.reason.includes('not found in database') &&
            s.reason.includes('Order'),
    ).length;
    const missingProductCount = skipped.filter(
        (s) =>
            s.reason.includes('not found in database') &&
            s.reason.includes('Product'),
    ).length;
    const missingIdCount = skipped.filter((s) =>
        s.reason.includes('Missing'),
    ).length;

    console.log(`\n  Skip breakdown:`);
    console.log(
        `    Order not found: ${missingOrderCount} (${new Set(skipped.filter((s) => s.reason.includes('Order') && s.reason.includes('not found')).map((s) => s.orderId)).size} unique)`,
    );
    console.log(
        `    Product not found: ${missingProductCount} (${new Set(skipped.filter((s) => s.reason.includes('Product') && s.reason.includes('not found')).map((s) => s.reason.match(/Product (\S+)/)?.[1])).size} unique)`,
    );
    console.log(`    Missing fields: ${missingIdCount}`);

    if (warnings.length > 0) {
        console.log(`\n  ⚠️  Data warnings (${warnings.length}):`);
        for (const w of warnings.slice(0, 20)) {
            console.log(w);
        }
        if (warnings.length > 20) {
            console.log(`    ... and ${warnings.length - 20} more`);
        }
    }

    // With-invoice stats
    const withInvoice = valid.filter((v) => v.invoiceNumber).length;
    const withoutInvoice = valid.filter((v) => !v.invoiceNumber).length;
    console.log(
        `\n  With invoice: ${withInvoice}, Without invoice: ${withoutInvoice}`,
    );

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would insert order items: ${valid.length}`);
        process.exit(0);
    }

    // 5. Insert
    if (valid.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            await db.insert(orderItems).values(batch);
            inserted += batch.length;
            if (valid.length > BATCH_SIZE) {
                console.log(
                    `    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${inserted}/${valid.length}`,
                );
            }
        }
        console.log(`\n  ✅ Order items inserted: ${inserted}`);
    } else {
        console.log('\n  No valid rows to insert.');
    }

    // Verify count
    const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(orderItems);
    console.log(`  Total order items in DB: ${total}`);

    console.log('\n✅ Import complete.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
