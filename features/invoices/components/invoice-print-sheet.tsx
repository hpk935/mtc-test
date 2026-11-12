'use client';

import { BUSINESS_TIME_ZONE } from '@/lib/dates';
import { COMPANY } from '@/lib/constants';
import { useIsClient } from '@/hooks/use-is-client';
import type { InvoicePrintData } from '../queries';

const INVOICE_POLICIES = [
  'All claims (price, shortage, damage) must be made within 5 days after receipt of goods.',
  'We accept payment by company check, money order, cashier’s check, Visa, Mastercard, or American Express. A $25.00 bounced check fee will be charged for each returned check.',
  'A late fee of 25% of the outstanding balance will be added to any invoice which is 90 days overdue.',
  'Customer will be responsible for all Collection and Legal Fees to collect overdue amounts.',
];

function formatCurrency(value: string | number): string {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** YYYY-MM-DD → MM/DD/YYYY without a time-zone round-trip. */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function InfoCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        {label}
      </p>
      <p className="font-medium">{children || '—'}</p>
    </div>
  );
}

interface InvoicePrintSheetProps {
  data: InvoicePrintData;
}

export function InvoicePrintSheet({ data }: InvoicePrintSheetProps) {
  const { invoice, items } = data;
  // Browser-only so it matches on hydration; shown in Pacific time.
  const isClient = useIsClient();
  const printedOn = isClient
    ? new Date().toLocaleDateString('en-US', { timeZone: BUSINESS_TIME_ZONE })
    : null;

  const salesperson =
    invoice.salespersonFirstName && invoice.salespersonLastName
      ? `${invoice.salespersonFirstName} ${invoice.salespersonLastName}`
      : invoice.salespersonCode;
  const isVoided = invoice.invoiceStatus === 'voided';
  const hasPayments = Number(invoice.amountPaid) > 0;

  return (
    <>
      {/* Print button — hidden on paper */}
      <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-white px-6 py-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Print Invoice
        </button>
      </div>

      {/* Printable content — fixed letter width (8.5in) so mobile sees
          the real paper proportions and scrolls horizontally if needed.
          Print overrides remove the width/border. */}
      <div className="overflow-x-auto bg-gray-100 px-4 py-6 print:overflow-visible print:bg-white print:p-0">
        <div className="print-sheet mx-auto min-h-264 w-204 bg-white p-12 shadow-sm ring-1 ring-gray-200 print:min-h-0 print:w-full print:p-0 print:shadow-none print:ring-0">
          {/* Header — letterhead left, invoice identity right */}
          <header className="mb-4 flex items-start justify-between border-b border-gray-300 pb-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mtc-logo.webp"
                alt="MTC Trading Co."
                className="h-auto w-10"
              />
              <div>
                <h1 className="text-xl leading-tight font-bold uppercase">
                  {COMPANY.legalName}
                </h1>
                <p className="text-sm text-gray-500">
                  {COMPANY.address1}, {COMPANY.cityStateZip}
                </p>
                <p className="text-sm text-gray-500">
                  Tel: {COMPANY.phone} &middot; Fax: {COMPANY.fax}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="text-xl leading-tight font-bold tracking-wide text-gray-900">
                INVOICE
                {isVoided && (
                  <span className="ml-2 rounded border-2 border-red-500 px-1.5 text-base text-red-600">
                    VOID
                  </span>
                )}
              </p>
              <p>
                <span className="font-medium">Number:</span>{' '}
                {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {formatDate(invoice.invoiceDate)}
              </p>
              <p>
                <span className="font-medium">Customer No.:</span>{' '}
                {invoice.customerNumber}
              </p>
            </div>
          </header>

          {/* Sold To & Ship To */}
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded border border-gray-200 p-3">
              <h2 className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Sold To
              </h2>
              <p className="font-medium">{invoice.customerName}</p>
              {invoice.billingAddress1 && <p>{invoice.billingAddress1}</p>}
              {invoice.billingAddress2 && <p>{invoice.billingAddress2}</p>}
              {invoice.billingCity && (
                <p>
                  {invoice.billingCity}, {invoice.billingStateCode}{' '}
                  {invoice.billingPostalCode}
                </p>
              )}
              {invoice.mainPhone && (
                <p className="text-gray-500">Tel: {invoice.mainPhone}</p>
              )}
            </div>
            <div className="rounded border border-gray-200 p-3">
              <h2 className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Ship To
              </h2>
              <p className="font-medium">{invoice.shipToName}</p>
              <p>{invoice.shipToAddress1}</p>
              {invoice.shipToAddress2 && <p>{invoice.shipToAddress2}</p>}
              <p>
                {invoice.shipToCity}, {invoice.shipToStateCode}{' '}
                {invoice.shipToPostalCode}
              </p>
            </div>
          </div>

          {/* Order details strip */}
          <div className="mb-4 grid grid-cols-6 divide-x divide-gray-200 rounded border border-gray-200 text-sm">
            <InfoCell label="Order No.">{invoice.orderNumber}</InfoCell>
            <InfoCell label="Order Date">
              {formatDate(invoice.orderDate)}
            </InfoCell>
            <InfoCell label="Salesman">{salesperson}</InfoCell>
            <InfoCell label="Purchase Order No.">
              {invoice.customerPoReference}
            </InfoCell>
            <InfoCell label="Freight">{invoice.freightTerm}</InfoCell>
            <InfoCell label="Terms">
              {invoice.termDescription ?? invoice.termCode}
            </InfoCell>
          </div>

          {/* Line Items Table — thead repeats on each printed page */}
          <table className="mb-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-800 text-left">
                <th className="w-24 py-1.5 font-semibold">Qty Shipped</th>
                <th className="w-24 py-1.5 font-semibold">Item No.</th>
                <th className="py-1.5 font-semibold">Item Description</th>
                <th className="w-24 py-1.5 text-right font-semibold">
                  Unit Price
                </th>
                <th className="w-28 py-1.5 text-right font-semibold">
                  Extended Price
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                // Discount is the net price that replaces the unit price.
                const netPrice =
                  Number(item.discount) > 0 ? item.discount : item.unitPrice;
                const unit = item.unitSoldBy ?? '';
                const backordered = item.qtyOrdered - item.qtyShipped;

                return (
                  <tr
                    key={item.id}
                    className={`break-inside-avoid border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} print:bg-transparent print:even:bg-gray-50`}>
                    <td className="py-1 align-top font-bold">
                      {item.qtyShipped} {unit}
                      {backordered > 0 && (
                        <span className="block text-xs font-normal text-gray-500">
                          of {item.qtyOrdered} ordered
                        </span>
                      )}
                    </td>
                    <td className="py-1 align-top font-mono font-medium">
                      {item.itemNumber}
                    </td>
                    <td className="py-1 align-top">
                      <span>{item.description ?? '—'}</span>
                      <span className="block text-xs text-gray-500">
                        {item.minQty && item.maxQty ? (
                          <span className="mr-3">
                            ( {item.minQty} {unit} / {item.maxQty} {unit} )
                          </span>
                        ) : null}
                        {item.upcNumber && (
                          <span className="font-mono">
                            UPC {item.upcNumber}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-1 text-right align-top">
                      {formatCurrency(netPrice)}
                    </td>
                    <td className="py-1 text-right align-top font-medium">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Shipping info */}
          {(invoice.shippingNote || invoice.trackingNumber) && (
            <div className="mb-4 break-inside-avoid rounded border border-gray-200 p-2 text-sm">
              {invoice.shippingNote && (
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold">Shipping:</span>{' '}
                  {invoice.shippingNote}
                </p>
              )}
              {invoice.trackingNumber && (
                <p>
                  <span className="font-semibold">Tracking:</span>{' '}
                  {invoice.trackingNumber}
                </p>
              )}
            </div>
          )}

          {/* Footer: Policies & Totals */}
          <div className="grid break-inside-avoid grid-cols-5 gap-4">
            <ul className="col-span-3 list-disc space-y-1 rounded border border-gray-200 p-3 pl-7 text-xs text-gray-600">
              {INVOICE_POLICIES.map((policy) => (
                <li key={policy}>{policy}</li>
              ))}
            </ul>

            <div className="col-span-2 rounded border border-gray-200 p-3 text-sm">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sales Amount</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotalAmount)}
                  </span>
                </div>
                {Number(invoice.salesTaxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sales Tax</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.salesTaxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Freight</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.freightAmount)}
                  </span>
                </div>
                {Number(invoice.creditAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer Credit</span>
                    <span className="font-medium">
                      −{formatCurrency(invoice.creditAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t-2 border-gray-800 pt-2">
                  <span className="font-semibold uppercase">
                    {hasPayments ? 'Total' : 'Please Pay Total'}
                  </span>
                  <span className="text-lg font-bold">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
                {hasPayments && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-medium">
                        −{formatCurrency(invoice.amountPaid)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-t pt-2">
                      <span className="font-semibold uppercase">
                        {Number(invoice.balanceDue) < 0
                          ? 'Credit Balance'
                          : 'Please Pay'}
                      </span>
                      <span className="text-lg font-bold">
                        {formatCurrency(Math.abs(Number(invoice.balanceDue)))}
                      </span>
                    </div>
                  </>
                )}
                {invoice.dueDate && (
                  <p className="pt-1 text-right text-xs text-gray-500">
                    Due {formatDate(invoice.dueDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Print footer */}
          <p className="mt-4 text-center text-xs text-gray-400 print:mt-2">
            {printedOn && <>Printed {printedOn} &middot; </>}Invoice #
            {invoice.invoiceNumber} &middot; {items.length} item
            {items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  );
}
