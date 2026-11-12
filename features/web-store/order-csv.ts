import { BUSINESS_TIME_ZONE } from '@/lib/dates';
import type { WebOrder, WebOrderItem } from './types';

// The order sheet staff download for each web order. The layout is fixed:
// sender block in column A, customer block in column J, then the items.

const CRLF = '\r\n';
const COLUMN_COUNT = 10;
const DOZEN = 12;

const SENDER_LINES = [
    "MTC-MAN'S",
    '301 ALLERTON AVE',
    'S. SAN FRANCISCO, CA 94080',
    'TEL: 1-650-866-4800',
    'FAX: 1-415-468-7300',
];

/** Rows above the item table (sender/customer block, note row, blank row). */
const PREAMBLE_ROWS = 12;

/** Zero-based row where the customer note is printed in column A. */
const NOTE_ROW = 10;

const ITEM_HEADER = [
    'InvItmNo',
    'InvQtyOrd',
    'InvProDes',
    'InvUniPri',
    'ExtendPrice',
    'MinQty',
    'MinUnit',
    'MaxQty',
    'MaxUnit',
    'UPCNumber',
];

const orderDateFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});

function escapeCsvField(value: string): string {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function toRow(fields: string[]): string {
    const padded = [...fields];
    while (padded.length < COLUMN_COUNT) padded.push('');
    return padded.map(escapeCsvField).join(',');
}

/** A quantity without trailing zeros, e.g. 12 -> "12", 1.5 -> "1.5". */
function formatQuantity(value: number): string {
    return Number.isInteger(value)
        ? String(value)
        : String(Number(value.toFixed(2)));
}

function csvAmount(value: number): string {
    return value.toFixed(2);
}

/** E.g. "Mon Oct 26", in Pacific time. */
function formatOrderDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const parts = Object.fromEntries(
        orderDateFormat.formatToParts(date).map((p) => [p.type, p.value]),
    );
    return `${parts.weekday} ${parts.month} ${parts.day}`;
}

/**
 * Stored quantities are in cases and prices are per case. The sheet is in
 * dozens, so both are converted using the case pack (pieces per case).
 */
function itemToRow(item: WebOrderItem): string[] {
    const cases = Number(item.quantity) || 0;
    const casePack = Number(item.casePack);
    const pricePerCase = Number(item.amountPerQuantity) || 0;
    const hasCasePack = Number.isFinite(casePack) && casePack > 0;

    const dozensPerCase = hasCasePack ? casePack / DOZEN : 1;
    const extendedPrice = Number(item.totalAmount);

    return [
        item.sku ?? '',
        `${formatQuantity(cases * dozensPerCase)} DZ`,
        item.name ?? '',
        csvAmount(pricePerCase / dozensPerCase),
        Number.isFinite(extendedPrice) ? csvAmount(extendedPrice) : '',
        hasCasePack ? formatQuantity(dozensPerCase) : '',
        hasCasePack ? 'DZ' : '',
        '',
        '',
        item.upc ?? '',
    ];
}

/** Customer block for column J. Positions are fixed; empty lines stay blank. */
function customerLines(order: WebOrder): string[] {
    const { shippingAddress: addr, contactInfo } = order;
    return [
        `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim(),
        addr.streetAddress ?? '',
        addr.address2 ?? '',
        `${addr.city ?? ''}, ${addr.state ?? ''} ${addr.postalZip ?? ''}`,
        addr.country ?? '',
        contactInfo?.phone ?? '',
        order.orderNumber,
        `ORDER ${order.orderNumber}`,
        formatOrderDate(order.createdAt),
        contactInfo?.email ?? '',
    ];
}

/** Line breaks and runs of spaces in the note are flattened to one space. */
function noteLine(order: WebOrder): string {
    const note = (order.note ?? '').replace(/\s+/g, ' ').trim();
    return note === '' ? '' : `Note: ${note}`;
}

export function buildWebOrderCsv(order: WebOrder): string {
    const customer = customerLines(order);
    const rows: string[] = [];

    for (let i = 0; i < PREAMBLE_ROWS; i++) {
        const fields = new Array<string>(COLUMN_COUNT).fill('');
        fields[0] = i === NOTE_ROW ? noteLine(order) : (SENDER_LINES[i] ?? '');
        fields[COLUMN_COUNT - 1] = customer[i] ?? '';
        rows.push(toRow(fields));
    }

    rows.push(toRow(ITEM_HEADER));
    for (const item of order.items) rows.push(toRow(itemToRow(item)));

    const total = order.totalPrice ?? '';
    rows.push(toRow(['', '', '', 'Sales Amount', total]));
    rows.push(toRow(['', '', '', 'Freight', '']));
    rows.push(toRow(['', '', '', 'Total Amount', total]));

    return rows.join(CRLF) + CRLF;
}

export function webOrderCsvFilename(order: WebOrder): string {
    return `${order.orderNumber}.csv`;
}
