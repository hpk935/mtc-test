// scripts/import/import-invoices.ts — Import legacy invoice data from CSV
// Run with: npx tsx scripts/import/import-invoices.ts [--limit N] [--dry-run]

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { NewInvoice } from '../../features/invoices/types';

const CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - last6MonthInvoices.csv',
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

function parseDate(value: string): string | null {
    if (!value) return null;
    const cleaned = value.replace(/\s+\d+:\d+:\d+$/, '');
    const parts = cleaned.split('/');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatEmployeeId(csvId: string): string {
    const num = csvId.trim();
    if (!num) return '';
    return `E${num.padStart(2, '0')}`;
}

function normalizeCustomerNumber(csvId: string): string {
    const id = csvId.trim();
    if (id.includes('-')) return id;
    if (/^\d+$/.test(id) && id.length >= 3) {
        const prefix = parseInt(id.slice(0, 2), 10);
        if (prefix <= 25) {
            return `${id.slice(0, 2)}-${id.slice(2)}`;
        } else {
            return `0${id[0]}-${id.slice(1)}`;
        }
    }
    return id;
}

function readCsv(limit: number = Infinity): Record<string, string>[] {
    const content = readFileSync(CSV_PATH, 'utf-8');
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

// --- Ship-to address lookup ---

type ShipToFullMap = Map<string, string>;

interface ShipToRecord {
    shipToId: string;
    locationName: string;
    address1: string;
    address2: string | null;
    city: string;
    stateCode: string;
    postalCode: string;
}

type CustomerDefaultShipTo = Map<string, ShipToRecord>;

function buildShipToKey(
    customerNumber: string,
    locationName: string,
    address1: string,
): string {
    return `${customerNumber.toLowerCase()}|${locationName.toLowerCase().trim()}|${address1.toLowerCase().trim()}`;
}

// --- Invoice status derivation ---

function deriveInvoiceStatus(
    row: Record<string, string>,
): 'open' | 'paid' | 'voided' {
    const voidFlag = parseInt(row['Void'] || '0', 10);
    if (voidFlag !== 0) return 'voided';
    const paidFlag = parseInt(row['Paid'] || '0', 10);
    if (paidFlag !== 0) return 'paid';
    return 'open';
}

// --- Transform ---

interface SkippedRow {
    line: number;
    invoiceNo: string;
    reason: string;
}

function transformRows(
    rows: Record<string, string>[],
    existingCustomers: Set<string>,
    existingEmployees: Set<string>,
    existingOrders: Set<string>,
    shipToMap: ShipToFullMap,
    customerDefaultShipTo: CustomerDefaultShipTo,
) {
    const valid: NewInvoice[] = [];
    const skipped: SkippedRow[] = [];
    const seenInvoices = new Set<string>();
    let customerNotFound = 0;
    let employeeNotFound = 0;
    let orderNotFound = 0;
    let shipToNotFound = 0;

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const invoiceNo = r['InvoiceNo']?.trim();
        const orderId = r['OrderID']?.trim();
        const rawCustomerNumber = r['CustomerID']?.trim();

        if (!invoiceNo) {
            skipped.push({
                line: i + 2,
                invoiceNo: '(empty)',
                reason: 'Missing InvoiceNo',
            });
            continue;
        }

        if (seenInvoices.has(invoiceNo)) {
            skipped.push({
                line: i + 2,
                invoiceNo,
                reason: `Duplicate InvoiceNo ${invoiceNo}`,
            });
            continue;
        }
        seenInvoices.add(invoiceNo);

        if (!orderId || !existingOrders.has(orderId)) {
            orderNotFound++;
            skipped.push({
                line: i + 2,
                invoiceNo,
                reason: `Order ${orderId || '(empty)'} not found`,
            });
            continue;
        }

        const customerNumber = rawCustomerNumber
            ? normalizeCustomerNumber(rawCustomerNumber)
            : '';
        if (!customerNumber || !existingCustomers.has(customerNumber)) {
            customerNotFound++;
            skipped.push({
                line: i + 2,
                invoiceNo,
                reason: `Customer ${customerNumber || '(empty)'} not found`,
            });
            continue;
        }

        const employeeId = formatEmployeeId(r['EmployeeID'] || '');
        if (!employeeId || !existingEmployees.has(employeeId)) {
            employeeNotFound++;
            skipped.push({
                line: i + 2,
                invoiceNo,
                reason: `Employee ${r['EmployeeID']} (${employeeId}) not found`,
            });
            continue;
        }

        const invoiceDate = parseDate(r['OrderDate'] || '');
        if (!invoiceDate) {
            skipped.push({
                line: i + 2,
                invoiceNo,
                reason: `Invalid date: "${r['OrderDate']}"`,
            });
            continue;
        }

        // Ship-to lookup
        const shipToName = r['ShipToName']?.trim() || '';
        const shipToAddr1 = r['ShipToAddr1']?.trim() || '';
        const shipToValue = r['ShipTo']?.trim() || '';

        let shipToId: string | undefined;
        let resolvedName = shipToName;
        let resolvedAddr1 = shipToAddr1;
        let resolvedAddr2 = r['ShipToAddr2']?.trim() || null;
        let resolvedCity = r['ShipToCity']?.trim() || 'N/A';
        let resolvedState = r['ShipToState']?.trim() || 'N/A';
        let resolvedZip = r['ShipToZip']?.trim() || '00000';

        if (shipToValue === 'SAME' || (!shipToName && !shipToAddr1)) {
            const defaultShipTo = customerDefaultShipTo.get(customerNumber);
            if (defaultShipTo) {
                shipToId = defaultShipTo.shipToId;
                resolvedName = defaultShipTo.locationName;
                resolvedAddr1 = defaultShipTo.address1;
                resolvedAddr2 = defaultShipTo.address2;
                resolvedCity = defaultShipTo.city;
                resolvedState = defaultShipTo.stateCode;
                resolvedZip = defaultShipTo.postalCode;
            }
        } else {
            const shipToKey = buildShipToKey(
                customerNumber,
                shipToName,
                shipToAddr1,
            );
            shipToId = shipToMap.get(shipToKey);

            // Fallback: match by customer + name only
            if (!shipToId) {
                for (const [key, value] of shipToMap) {
                    const keyParts = key.split('|');
                    if (
                        keyParts[0] === customerNumber.toLowerCase() &&
                        keyParts[1] === shipToName.toLowerCase().trim()
                    ) {
                        shipToId = value;
                        break;
                    }
                }
            }
        }

        if (!shipToId) {
            shipToNotFound++;
            skipped.push({
                line: i + 2,
                invoiceNo,
                reason: `Ship-to not found for ${customerNumber}: "${shipToName}" / "${shipToAddr1}"`,
            });
            continue;
        }

        const freightTerm = r['ShipVia']?.trim() || 'N/A';
        const termCode = r['TermCode']?.trim() || 'N/A';
        const territoryCode = r['TerritoryCode']?.trim() || 'N/A';

        const note1 = r['Note1']?.trim() || '';
        const note2 = r['Note2']?.trim() || '';
        const shippingNote = [note1, note2].filter(Boolean).join('\n') || null;

        const status = deriveInvoiceStatus(r);
        // CSV Amount = full customer-facing total (includes freight)
        // CSV OrderTotal = merchandise subtotal (Amount - Freight)
        const totalAmount = parseMoney(r['Amount']);

        valid.push({
            invoiceNumber: invoiceNo,
            orderNumber: orderId,
            customerNumber,
            salespersonCode: employeeId,
            invoiceDate,
            customerPoReference: r['PONumber']?.trim() || null,
            freightTerm,
            shipToId,
            shipToName: resolvedName || 'N/A',
            shipToAddress1: resolvedAddr1 || 'N/A',
            shipToAddress2: resolvedAddr2 || null,
            shipToCity: resolvedCity,
            shipToStateCode: resolvedState,
            shipToPostalCode: resolvedZip,
            termCode,
            territoryCode,
            salesTaxAmount: parseMoney(r['SalesTax']),
            subtotalAmount: parseMoney(r['OrderTotal']),
            freightAmount: parseMoney(r['Freight']),
            totalAmount,
            costAmount: parseMoney(r['Cost']),
            invoiceStatus: status,
            // AR columns
            balanceDue:
                status === 'paid' || status === 'voided' ? '0' : totalAmount,
            amountPaid: status === 'paid' ? totalAmount : '0',
            paidDate: null,
            dueDate: null,
            shippingNote,
        });
    }

    return {
        valid,
        skipped,
        customerNotFound,
        employeeNotFound,
        orderNotFound,
        shipToNotFound,
    };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing invoices ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    // 1. Read CSV
    const rows = readCsv(rowLimit);
    console.log(`  CSV rows read: ${rows.length}`);

    // 2. Load existing records for FK validation
    const { default: db } = await import('../../lib/db');
    const { orders } = await import('../../features/orders/schema');
    const { invoices } = await import('../../features/invoices/schema');
    const { customers, shipToAddresses } =
        await import('../../features/customers/schema');
    const { users } = await import('../../features/users/schema');
    const { sql } = await import('drizzle-orm');

    const customerRows = await db
        .select({ customerNumber: customers.customerNumber })
        .from(customers);
    const existingCustomers = new Set(
        customerRows.map((r) => r.customerNumber),
    );
    console.log(`  Existing customers in DB: ${existingCustomers.size}`);

    const userRows = await db
        .select({ employeeId: users.employeeId })
        .from(users);
    const existingEmployees = new Set(userRows.map((r) => r.employeeId));
    console.log(`  Existing employees in DB: ${existingEmployees.size}`);

    const orderRows = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders);
    const existingOrders = new Set(orderRows.map((r) => r.orderNumber));
    console.log(`  Existing orders in DB: ${existingOrders.size}`);

    // Build ship-to lookup
    const shipToRows = await db
        .select({
            shipToId: shipToAddresses.shipToId,
            customerNumber: shipToAddresses.customerNumber,
            locationName: shipToAddresses.locationName,
            address1: shipToAddresses.address1,
            address2: shipToAddresses.address2,
            city: shipToAddresses.city,
            stateCode: shipToAddresses.stateCode,
            postalCode: shipToAddresses.postalCode,
            isFavorite: shipToAddresses.isFavorite,
        })
        .from(shipToAddresses);

    const shipToMap: ShipToFullMap = new Map();
    const customerDefaultShipTo: CustomerDefaultShipTo = new Map();

    for (const s of shipToRows) {
        const key = buildShipToKey(
            s.customerNumber,
            s.locationName,
            s.address1,
        );
        shipToMap.set(key, s.shipToId);

        const record: ShipToRecord = {
            shipToId: s.shipToId,
            locationName: s.locationName,
            address1: s.address1,
            address2: s.address2,
            city: s.city,
            stateCode: s.stateCode,
            postalCode: s.postalCode,
        };
        const existing = customerDefaultShipTo.get(s.customerNumber);
        if (!existing || s.isFavorite) {
            customerDefaultShipTo.set(s.customerNumber, record);
        }
    }
    console.log(`  Ship-to address lookup entries: ${shipToMap.size}`);
    console.log(
        `  Customer default ship-to entries: ${customerDefaultShipTo.size}`,
    );

    // 3. Transform
    const {
        valid,
        skipped,
        customerNotFound,
        employeeNotFound,
        orderNotFound,
        shipToNotFound,
    } = transformRows(
        rows,
        existingCustomers,
        existingEmployees,
        existingOrders,
        shipToMap,
        customerDefaultShipTo,
    );

    console.log(`\n  Valid rows: ${valid.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    if (skipped.length > 0) {
        console.log(`\n  Skip breakdown:`);
        console.log(`    Order not found: ${orderNotFound}`);
        console.log(`    Customer not found: ${customerNotFound}`);
        console.log(`    Employee not found: ${employeeNotFound}`);
        console.log(`    Ship-to not found: ${shipToNotFound}`);
        console.log(
            `    Other: ${skipped.length - orderNotFound - customerNotFound - employeeNotFound - shipToNotFound}`,
        );
    }

    // Status breakdown
    const statusCounts = valid.reduce(
        (acc, inv) => {
            acc[inv.invoiceStatus as string] =
                (acc[inv.invoiceStatus as string] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );
    console.log(`\n  Status breakdown:`);
    for (const [status, count] of Object.entries(statusCounts)) {
        console.log(`    ${status}: ${count}`);
    }

    if (skipped.length > 0 && skipped.length <= 20) {
        console.log(`\n  ⚠️  Skipped rows:`);
        for (const s of skipped) {
            console.log(`    Line ${s.line} [${s.invoiceNo}]: ${s.reason}`);
        }
    } else if (skipped.length > 20) {
        console.log(`\n  ⚠️  First 20 skipped rows:`);
        for (const s of skipped.slice(0, 20)) {
            console.log(`    Line ${s.line} [${s.invoiceNo}]: ${s.reason}`);
        }
        console.log(`    ... and ${skipped.length - 20} more`);
    }

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would insert invoices: ${valid.length}`);
        process.exit(0);
    }

    // 4. Insert
    if (valid.length > 0) {
        const BATCH_SIZE = 500;
        let inserted = 0;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            await db
                .insert(invoices)
                .values(batch)
                .onConflictDoNothing({ target: invoices.invoiceNumber });
            inserted += batch.length;
            if (valid.length > BATCH_SIZE) {
                console.log(
                    `    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${inserted}/${valid.length}`,
                );
            }
        }
        console.log(`\n  ✅ Invoices inserted: ${inserted}`);
    } else {
        console.log('\n  No valid rows to insert.');
    }

    // Verify
    const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(invoices);
    console.log(`  Total invoices in DB: ${total}`);

    console.log('\n✅ Import complete.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
