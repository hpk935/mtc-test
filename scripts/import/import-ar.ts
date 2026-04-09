// scripts/import/import-ar.ts — Import legacy AR payment data from CSV
// Updates matching invoices with payment amounts, dates, and statuses
// Run with: npx tsx scripts/import/import-ar.ts [--limit N] [--dry-run]

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSV_PATH = resolve(
    __dirname,
    '../../data/MTC Internal Data - AccountReceivables.csv',
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

// --- Derive invoice status from AR payment data ---

function deriveStatus(
    amount: number,
    paidAmount: number,
    paidInFull: boolean,
): 'open' | 'paid' | 'partially_paid' {
    if (paidInFull || (paidAmount > 0 && paidAmount >= amount)) return 'paid';
    if (paidAmount > 0) return 'partially_paid';
    return 'open';
}

// --- Transform ---

interface ArUpdate {
    invoiceNumber: string;
    amountPaid: string;
    balanceDue: string;
    dueDate: string | null;
    paidDate: string | null;
    paymentRef: string | null;
    invoiceStatus: 'open' | 'paid' | 'partially_paid';
}

interface SkippedRow {
    line: number;
    invoiceNumber: string;
    reason: string;
}

function transformRows(
    rows: Record<string, string>[],
    existingInvoices: Set<string>,
) {
    const updates: ArUpdate[] = [];
    const skipped: SkippedRow[] = [];
    let invoiceNotFound = 0;
    let duplicateInvoice = 0;
    const seenInvoices = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const invoiceNumber = r['InvoiceNumber']?.trim();

        if (!invoiceNumber) {
            skipped.push({
                line: i + 2,
                invoiceNumber: '(empty)',
                reason: 'Missing InvoiceNumber',
            });
            continue;
        }

        if (!existingInvoices.has(invoiceNumber)) {
            invoiceNotFound++;
            skipped.push({
                line: i + 2,
                invoiceNumber,
                reason: 'Invoice not found in DB',
            });
            continue;
        }

        // Take the first (most recent) AR record for each invoice
        if (seenInvoices.has(invoiceNumber)) {
            duplicateInvoice++;
            skipped.push({
                line: i + 2,
                invoiceNumber,
                reason: 'Duplicate — already processed',
            });
            continue;
        }
        seenInvoices.add(invoiceNumber);

        const amount = parseFloat(parseMoney(r['Amount']));
        const paidAmount = parseFloat(parseMoney(r['PaidAmount']));
        const paidInFull = r['PaidInFull']?.trim() === '1';
        const balanceDue = Math.max(0, amount - paidAmount);

        const status = deriveStatus(amount, paidAmount, paidInFull);

        const dueDate = parseDate(r['DueDate'] || '');
        const paidDate = paidInFull ? parseDate(r['PaidDate'] || '') : null;
        const paymentRef = r['PaymentRef']?.trim() || null;

        updates.push({
            invoiceNumber,
            amountPaid: paidAmount.toFixed(2),
            balanceDue: balanceDue.toFixed(2),
            dueDate,
            paidDate,
            paymentRef,
            invoiceStatus: status,
        });
    }

    return { updates, skipped, invoiceNotFound, duplicateInvoice };
}

// --- Main ---

async function main() {
    const mode = isDryRun ? '(DRY RUN)' : '';
    console.log(
        `\n🔄 Importing AR payment data ${mode}${rowLimit < Infinity ? ` (limit: ${rowLimit} rows)` : ''}...\n`,
    );

    // 1. Read CSV
    const rows = readCsv(rowLimit);
    console.log(`  CSV rows read: ${rows.length}`);

    // 2. Load existing invoices for matching
    const { default: db } = await import('../../lib/db');
    const { invoices } = await import('../../features/invoices/schema');
    const { eq, sql } = await import('drizzle-orm');

    const invoiceRows = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices);
    const existingInvoices = new Set(invoiceRows.map((r) => r.invoiceNumber));
    console.log(`  Existing invoices in DB: ${existingInvoices.size}`);

    // 3. Transform
    const { updates, skipped, invoiceNotFound, duplicateInvoice } =
        transformRows(rows, existingInvoices);

    console.log(`\n  Matching updates: ${updates.length}`);
    console.log(`  Skipped rows: ${skipped.length}`);

    if (skipped.length > 0) {
        console.log(`\n  Skip breakdown:`);
        console.log(`    Invoice not found in DB: ${invoiceNotFound}`);
        console.log(`    Duplicate AR records: ${duplicateInvoice}`);
        console.log(
            `    Other: ${skipped.length - invoiceNotFound - duplicateInvoice}`,
        );
    }

    // Status breakdown
    const statusCounts = updates.reduce(
        (acc, u) => {
            acc[u.invoiceStatus] = (acc[u.invoiceStatus] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );
    console.log(`\n  Status breakdown:`);
    for (const [status, count] of Object.entries(statusCounts)) {
        console.log(`    ${status}: ${count}`);
    }

    if (isDryRun) {
        console.log('\n  Dry run — no database changes made.');
        console.log(`  Would update invoices: ${updates.length}`);
        process.exit(0);
    }

    // 4. Apply updates in batches
    if (updates.length > 0) {
        const { payments } = await import('../../features/invoices/schema');

        const BATCH_SIZE = 100;
        let updated = 0;
        let paymentsInserted = 0;
        const now = new Date();

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);

            for (const u of batch) {
                await db
                    .update(invoices)
                    .set({
                        amountPaid: u.amountPaid,
                        balanceDue: u.balanceDue,
                        dueDate: u.dueDate,
                        paidDate: u.paidDate,
                        paymentRef: u.paymentRef,
                        invoiceStatus: u.invoiceStatus,
                        updatedAt: now,
                    })
                    .where(eq(invoices.invoiceNumber, u.invoiceNumber));

                // Seed payment record for invoices with payments
                const paidAmount = parseFloat(u.amountPaid);
                if (paidAmount > 0) {
                    await db.insert(payments).values({
                        invoiceNumber: u.invoiceNumber,
                        amount: u.amountPaid,
                        paymentDate:
                            u.paidDate ||
                            u.dueDate ||
                            now.toISOString().split('T')[0],
                        paymentRef: u.paymentRef,
                    });
                    paymentsInserted++;
                }
            }

            updated += batch.length;
            if (updates.length > BATCH_SIZE) {
                console.log(
                    `    Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${updated}/${updates.length}`,
                );
            }
        }
        console.log(`\n  ✅ Invoices updated with AR data: ${updated}`);
        console.log(`  ✅ Payment records seeded: ${paymentsInserted}`);
    } else {
        console.log('\n  No matching invoices to update.');
    }

    // Verify
    const [{ total }] = await db
        .select({ total: sql<number>`count(*)` })
        .from(invoices);
    const [{ paid }] = await db
        .select({ paid: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.invoiceStatus, 'paid'));
    const [{ partial }] = await db
        .select({ partial: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.invoiceStatus, 'partially_paid'));
    const [{ open }] = await db
        .select({ open: sql<number>`count(*)` })
        .from(invoices)
        .where(eq(invoices.invoiceStatus, 'open'));

    console.log(`\n  Final DB status counts:`);
    console.log(`    Total invoices: ${total}`);
    console.log(`    Open: ${open}`);
    console.log(`    Paid: ${paid}`);
    console.log(`    Partially paid: ${partial}`);

    console.log('\n✅ AR import complete.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ AR import failed:', err);
    process.exit(1);
});
