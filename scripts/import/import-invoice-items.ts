// scripts/import/import-invoice-items.ts — Import authoritative billed line items
// Run with: npx tsx scripts/import/import-invoice-items.ts [--limit N] [--dry-run]
//
// Reads two CSVs:
//   - last6MonthInvoices.csv       → builds OrderID → InvoiceNo mapping
//   - last6MonthInvoiceItems.csv   → billed line items keyed by OrderID
//
// Unlike order_items (which is the order lifecycle log with duplicates),
// invoice_items has exactly one row per billed line. Totals reconcile with
// invoice subtotals.

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { NewInvoiceItem } from '../../features/invoices/types';

const INVOICES_CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - last6MonthInvoices.csv',
);
const ITEMS_CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - last6MonthInvoiceItems.csv',
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
    const valid: NewInvoiceItem[] = [];
    const skipped: SkippedRow[] = [];

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

        if (!existingOrders.has(orderId)) {
            skipped.push({
                line: i + 2,
                orderId,
                reason: `Order ${orderId} not found in database`,
            });
            continue;
        }

        if (!existingProducts.has(itemNumber)) {
            skipped.push({
                line: i + 2,
                orderId,
                reason: `Product ${itemNumber} not found in database`,
            });
            continue;
        }

        // Invoice is REQUIRED for invoice_items
        const invoiceNumber = orderToInvoice.get(orderId);
        if (!invoiceNumber || !existingInvoices.has(invoiceNumber)) {
            skipped.push({
                line: i + 2,
                orderId,
                reason: `Invoice for order ${orderId} not found in database`,
            });
            continue;
        }

        const unitPrice = parseMoney(r['Unit Price']);
        const qtyOrdered = parseIntOrDefault(r['QuantityOrder']);
        const qtyShipped = parseIntOrDefault(r['QuantityShipped']);
        const discount = parseMoney(r['Discount']);
        const posted = parseIntOrDefault(r['Posted']);
        const processed = parseIntOrDefault(r['Processed']);
        const unitCost = parseMoney(r['Cost']);
        const legacyIndex = parseIntOrDefault(r['Index'], 0) || null;
        const lineTotal = (parseFloat(unitPrice) * qtyShipped).toFixed(2);

        valid.push({
            invoiceNumber,
            orderNumber: orderId,
            itemNumber,
            unitPrice,
            qtyOrdered,
            qtyShipped,
            discount,
            posted,
            processed,
            unitCost,
            lineTotal,
            legacyIndex,
        });
    }

    return { valid, skipped };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing invoice items ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    const invoiceRows = readCsv(INVOICES_CSV_PATH);
    console.log(`  Invoice header CSV rows: ${invoiceRows.length}`);

    const itemRows = readCsv(ITEMS_CSV_PATH, rowLimit);
    console.log(`  Invoice line item CSV rows: ${itemRows.length}`);

    const orderToInvoice = buildOrderToInvoiceMap(invoiceRows);
    console.log(`  Order→Invoice mappings: ${orderToInvoice.size}`);

    const { default: db } = await import('../../lib/db');
    const { orders } = await import('../../features/orders/schema');
    const { invoices, invoiceItems } =
        await import('../../features/invoices/schema');
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

    const { valid, skipped } = transformRows(
        itemRows,
        orderToInvoice,
        existingOrders,
        existingProducts,
        existingInvoices,
    );

    console.log(`\n  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    if (skipped.length > 0) {
        const reasonCounts = new Map<string, number>();
        for (const s of skipped) {
            const key = s.reason.replace(/\s\S+\s/, ' <x> ');
            reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
        }
        console.log(`\n  Skip breakdown:`);
        for (const [reason, count] of reasonCounts) {
            console.log(`    ${reason}: ${count}`);
        }
    }

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would insert invoice items: ${valid.length}`);
        process.exit(0);
    }

    if (valid.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            await db.insert(invoiceItems).values(batch);
            inserted += batch.length;
            if (valid.length > BATCH_SIZE) {
                console.log(
                    `    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${inserted}/${valid.length}`,
                );
            }
        }
        console.log(`\n  ✅ Invoice items inserted: ${inserted}`);
    } else {
        console.log('\n  No valid rows to insert.');
    }

    const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(invoiceItems);
    console.log(`  Total invoice items in DB: ${total}`);

    console.log('\n✅ Import complete.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
