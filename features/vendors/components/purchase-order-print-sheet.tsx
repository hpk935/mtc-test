'use client';

import { BUSINESS_TIME_ZONE } from '@/lib/dates';
import { useIsClient } from '@/hooks/use-is-client';
import { PO_STATUS_LABEL } from '../constants';
import type { PurchaseOrderPrintData } from '../queries';

/** YYYY-MM-DD → MM/DD/YYYY without a time-zone round-trip. */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

/** Whole cases print bare; a broken case shows two decimals. */
function formatCases(cases: number): string {
  return Number.isInteger(cases) ? String(cases) : cases.toFixed(2);
}

/** Label + value on one line; an empty value leaves a write-in rule. */
function HeaderField({
  label,
  value,
  className = '',
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="whitespace-nowrap">{label} :</span>
      <span className="min-w-28 flex-1 border-b border-gray-300 font-medium">
        {value || ' '}
      </span>
    </div>
  );
}

const th = 'border border-gray-500 px-1.5 py-1 font-semibold';
const td = 'border border-gray-400 px-1.5 py-0.5';

interface PurchaseOrderPrintSheetProps {
  data: PurchaseOrderPrintData;
}

export function PurchaseOrderPrintSheet({
  data,
}: PurchaseOrderPrintSheetProps) {
  const { po, items } = data;
  // Browser-only so it matches on hydration; shown in Pacific time.
  const isClient = useIsClient();
  const printedOn = isClient
    ? new Date().toLocaleDateString('en-US', { timeZone: BUSINESS_TIME_ZONE })
    : null;

  const lines = items.map((item) => {
    const casePack = item.casePack ?? 0;
    return {
      ...item,
      cases: casePack > 0 ? item.qtyOrdered / casePack : null,
    };
  });
  const totalCases = lines.reduce((sum, l) => sum + (l.cases ?? 0), 0);
  const showStatus = po.status === 'draft' || po.status === 'cancelled';

  return (
    <>
      {/* Print button — hidden on paper */}
      <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-white px-6 py-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Print Purchase Order
        </button>
      </div>

      {/* Printable content — fixed letter width (8.5in) so mobile sees
          the real paper proportions and scrolls horizontally if needed.
          Print overrides remove the width/border. */}
      <div className="overflow-x-auto bg-gray-100 px-4 py-6 print:overflow-visible print:bg-white print:p-0">
        <div className="print-sheet mx-auto min-h-264 w-204 bg-white p-12 font-serif text-gray-900 shadow-sm ring-1 ring-gray-200 print:min-h-0 print:w-full print:p-0 print:shadow-none print:ring-0">
          {/* Title */}
          <h1 className="mb-3 text-center text-lg font-bold">
            Purchase Order Record: {po.poNumber}
            {showStatus && (
              <span
                className={`ml-2 rounded border-2 px-1.5 align-middle font-sans text-xs tracking-wide uppercase ${po.status === 'cancelled' ? 'border-red-500 text-red-600' : 'border-gray-500 text-gray-600'}`}>
                {PO_STATUS_LABEL[po.status]}
              </span>
            )}
          </h1>

          {/* Header — vessel, vendor invoice and departure aren't tracked
              yet, so they print as write-in rules. */}
          <div className="mb-3 grid grid-cols-[2fr_1fr_1fr] gap-x-6 gap-y-1.5 text-sm">
            <HeaderField label="Vendor Name" value={po.vendorName} />
            <HeaderField label="Vessel" />
            <HeaderField label="Departed" />
            <HeaderField label="Vendor Inv. No." />
            <HeaderField label="Order Date" value={formatDate(po.orderDate)} />
            <HeaderField label="ETA" value={formatDate(po.expectedDate)} />
          </div>

          {/* Line Items Table — thead repeats on each printed page */}
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-center">
                <th className={`${th} w-8`} />
                <th className={`${th} w-20`}>ItemNo</th>
                <th className={`${th} w-9`}>New</th>
                <th className={th}>Description</th>
                <th className={`${th} w-12`}>Qty</th>
                <th className={`${th} w-10`}>UN</th>
                <th className={`${th} w-11`}>CS</th>
                <th className={`${th} w-12`}>CF</th>
                <th className={`${th} w-20`} colSpan={2}>
                  Packing
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id} className="break-inside-avoid">
                  <td
                    className={`${td} text-center font-sans text-xs font-semibold`}>
                    {index + 1}
                  </td>
                  <td className={`${td} text-center`}>{line.itemNumber}</td>
                  {/* New — no rule for "new" yet; left blank to mark by hand. */}
                  <td className={td} />
                  <td className={td}>{line.description}</td>
                  <td className={`${td} text-center tabular-nums`}>
                    {line.qtyOrdered}
                  </td>
                  <td className={`${td} text-center`}>{line.unitSoldBy}</td>
                  <td className={`${td} text-center tabular-nums`}>
                    {line.cases === null ? '—' : formatCases(line.cases)}
                  </td>
                  <td className={`${td} text-center tabular-nums`}>
                    {line.cubicFeet === null
                      ? '—'
                      : Number(line.cubicFeet).toFixed(2)}
                  </td>
                  <td className={`${td} w-10 text-center tabular-nums`}>
                    {line.casePack || '—'}
                  </td>
                  <td className={`${td} w-10 text-center`}>
                    {line.unitSoldBy}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* A plain tbody, not tfoot — browsers repeat tfoot on every
                printed page, and the total belongs only at the end. */}
            <tbody>
              <tr className="break-inside-avoid font-bold">
                <td colSpan={4} />
                <td colSpan={2} className="py-1 text-center">
                  Total
                </td>
                <td className="py-1 text-center tabular-nums">
                  {formatCases(totalCases)}
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>

          {po.notes && (
            <div className="mt-3 break-inside-avoid rounded border border-gray-300 p-2 text-sm">
              <span className="font-semibold">Notes:</span>{' '}
              <span className="whitespace-pre-wrap">{po.notes}</span>
            </div>
          )}

          {/* Print footer */}
          <p className="mt-4 text-center font-sans text-xs text-gray-400 print:mt-2">
            {printedOn && <>Printed {printedOn} &middot; </>}
            {po.poNumber} &middot; {lines.length} item
            {lines.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  );
}
