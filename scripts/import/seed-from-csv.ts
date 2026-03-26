// scripts/import/seed-from-csv.ts — Seed all business data from CSV files
// Run with: npx tsx scripts/import/seed-from-csv.ts

import { readFileSync } from 'fs';
import { resolve } from 'path';
import db from '../../lib/db';
import { users } from '../../features/users/schema';
import { customers, shipToAddresses } from '../../features/customers/schema';
import { orders } from '../../features/orders/schema';
import { invoices, accountReceivables } from '../../features/invoices/schema';
import { hashPassword } from '../../features/auth/service';
import { eq } from 'drizzle-orm';

const DATA_DIR = resolve(__dirname, '../../data');

// --- Helpers ---

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
    return value.replace(/[$,]/g, '');
}

function parseBoolean(value: string): boolean {
    return value.toUpperCase() === 'TRUE';
}

function emptyToNull(value: string): string | null {
    return value?.trim() || null;
}

function readCsv(filename: string): Record<string, string>[] {
    const filePath = resolve(DATA_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');
    // Skip the first 2 rows (title + blank), actual headers are row 3
    const lines = content.split('\n').filter((l) => l.trim());
    const headers = parseCsvLine(lines[2]);
    const rows: Record<string, string>[] = [];

    for (let i = 3; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }
    return rows;
}

// --- Seed salesperson placeholder users ---

async function seedSalespersons(employeeIds: string[]) {
    const unique = [...new Set(employeeIds)];
    let created = 0;

    for (const empId of unique) {
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.employeeId, empId))
            .limit(1);

        if (existing.length > 0) continue;

        const passwordHash = await hashPassword('changeme123');
        const code = empId.replace('E', '').padStart(3, '0');
        await db.insert(users).values({
            employeeId: empId,
            email: `${empId.toLowerCase()}@mtc.com`,
            passwordHash,
            firstName: `Sales`,
            lastName: `Rep ${code}`,
            role: 'employee',
        });
        created++;
    }

    console.log(
        `  Salesperson users: ${created} created, ${unique.length - created} already existed`,
    );
}

// --- Seed customers ---

async function seedCustomers() {
    const rows = readCsv('customers.csv');

    const values = rows.map((r) => ({
        customerNumber: r.customer_number,
        customerName: r.customer_name,
        primaryContactName: r.primary_contact_name,
        billingAddress1: r.billing_address_1,
        billingAddress2: emptyToNull(r.billing_address_2),
        billingCity: r.billing_city,
        billingStateCode: r.billing_state_code,
        billingPostalCode: r.billing_postal_code,
        countryCode: r.country_code || 'US',
        mainPhone: r.main_phone,
        phoneExtension: emptyToNull(r.phone_extension),
        faxNumber: emptyToNull(r.fax_number),
        mainEmail: r.main_email,
        taxId: emptyToNull(r.tax_id),
        termCode: r.term_code,
        territoryCode: r.territory_code,
        salespersonCode: r.salesperson_code,
        defaultFreightTerm: r.default_freight_term,
        creditBalance: parseMoney(r.credit_balance),
        accountStatus: r.account_status as 'active' | 'inactive' | 'on_hold',
        accountOpenDate: r.account_open_date,
        lastInvoiceDate: emptyToNull(r.last_invoice_date),
        customerNote: emptyToNull(r.customer_note),
    }));

    await db.insert(customers).values(values).onConflictDoNothing();
    console.log(`  Customers: ${values.length} rows`);
}

// --- Seed ship-to addresses ---

async function seedShipToAddresses() {
    const rows = readCsv('ship-to-addresses.csv');

    const values = rows.map((r) => ({
        shipToId: r.ship_to_id,
        customerNumber: r.customer_number,
        locationName: r.location_name,
        locationStatus: r.location_status as 'active' | 'inactive',
        address1: r.address_1,
        address2: emptyToNull(r.address_2),
        city: r.city,
        stateCode: r.state_code,
        postalCode: r.postal_code,
        countryCode: r.country_code || 'US',
        contactName: emptyToNull(r.contact_name),
        mainPhone: emptyToNull(r.main_phone),
        isDefault: parseBoolean(r.is_default),
        customerNote: emptyToNull(r.customer_note),
    }));

    await db.insert(shipToAddresses).values(values).onConflictDoNothing();
    console.log(`  Ship-to addresses: ${values.length} rows`);
}

// --- Seed orders ---

async function seedOrders() {
    const rows = readCsv('orders.csv');

    const values = rows.map((r) => ({
        orderNumber: r.order_number,
        customerNumber: r.customer_number,
        salespersonCode: r.salesperson_code,
        orderDate: r.order_date,
        customerPoReference: emptyToNull(r.customer_po_reference),
        freightTerm: r.freight_term,
        shipToId: r.ship_to_id,
        shipToName: r.ship_to_name,
        shipToAddress1: r.ship_to_address_1,
        shipToAddress2: emptyToNull(r.ship_to_address_2),
        shipToCity: r.ship_to_city,
        shipToStateCode: r.ship_to_state_code,
        shipToPostalCode: r.ship_to_postal_code,
        termCode: r.term_code,
        territoryCode: r.territory_code,
        salesTaxAmount: parseMoney(r.sales_tax_amount),
        subtotalAmount: parseMoney(r.subtotal_amount),
        freightAmount: parseMoney(r.freight_amount),
        totalAmount: parseMoney(r.total_amount),
        costAmount: parseMoney(r.cost_amount),
        orderStatus: r.order_status as 'open' | 'invoiced' | 'voided',
        shippingNote: emptyToNull(r.shipping_note),
    }));

    await db.insert(orders).values(values).onConflictDoNothing();
    console.log(`  Orders: ${values.length} rows`);
}

// --- Seed invoices ---

async function seedInvoices() {
    const rows = readCsv('invoices.csv');

    const values = rows.map((r) => ({
        invoiceNumber: r.invoice_number,
        orderNumber: r.order_number,
        customerNumber: r.customer_number,
        salespersonCode: r.salesperson_code,
        invoiceDate: r.invoice_date,
        customerPoReference: emptyToNull(r.customer_po_reference),
        freightTerm: r.freight_term,
        shipToId: r.ship_to_id,
        shipToName: r.ship_to_name,
        shipToAddress1: r.ship_to_address_1,
        shipToAddress2: emptyToNull(r.ship_to_address_2),
        shipToCity: r.ship_to_city,
        shipToStateCode: r.ship_to_state_code,
        shipToPostalCode: r.ship_to_postal_code,
        termCode: r.term_code,
        territoryCode: r.territory_code,
        salesTaxAmount: parseMoney(r.sales_tax_amount),
        subtotalAmount: parseMoney(r.subtotal_amount),
        freightAmount: parseMoney(r.freight_amount),
        totalAmount: parseMoney(r.total_amount),
        costAmount: parseMoney(r.cost_amount),
        invoiceStatus: r.invoice_status as
            | 'open'
            | 'posted'
            | 'paid'
            | 'voided',
        shippingNote: emptyToNull(r.shipping_note),
    }));

    await db.insert(invoices).values(values).onConflictDoNothing();
    console.log(`  Invoices: ${values.length} rows`);
}

// --- Seed account receivables ---

async function seedAccountReceivables() {
    const rows = readCsv('account-receivables.csv');

    const values = rows.map((r) => ({
        invoiceNumber: r.invoice_number,
        orderNumber: r.order_number,
        customerNumber: r.customer_number,
        receivableDate: r.receivable_date,
        dueDate: r.due_date,
        termCode: r.term_code,
        invoiceTotalAmount: parseMoney(r.invoice_total_amount),
        amountPaid: parseMoney(r.amount_paid),
        balanceDue: parseMoney(r.balance_due),
        paymentStatus: r.payment_status as
            | 'open'
            | 'paid'
            | 'partially_paid'
            | 'voided',
        paidDate: emptyToNull(r.paid_date),
    }));

    await db.insert(accountReceivables).values(values).onConflictDoNothing();
    console.log(`  Account receivables: ${values.length} rows`);
}

// --- Main ---

async function main() {
    console.log('🌱 Seeding business data from CSVs...\n');

    // Collect all salesperson codes from CSVs
    const customerRows = readCsv('customers.csv');
    const orderRows = readCsv('orders.csv');
    const invoiceRows = readCsv('invoices.csv');

    const salespersonCodes = [
        ...customerRows.map((r) => r.salesperson_code),
        ...orderRows.map((r) => r.salesperson_code),
        ...invoiceRows.map((r) => r.salesperson_code),
    ].filter(Boolean);

    // Insert in dependency order
    await seedSalespersons(salespersonCodes);
    await seedCustomers();
    await seedShipToAddresses();
    await seedOrders();
    await seedInvoices();
    await seedAccountReceivables();

    console.log('\n✅ Business data seeding complete.');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
