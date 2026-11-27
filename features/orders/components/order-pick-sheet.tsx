'use client';

import { COMPANY } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { buildPickList } from '../pick-list';
import type { OrderPrintData } from '../queries';

/** YYYY-MM-DD → MM/DD/YYYY without a time-zone round-trip. */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

/** A write-in rule for the warehouse to fill by hand. */
function Blank({ className = 'w-20' }: { className?: string }) {
  return (
    <span
      className={`inline-block border-b border-gray-900 align-bottom ${className}`}>
      &nbsp;
    </span>
  );
}

interface OrderPickSheetProps {
  data: OrderPrintData;
}

/** Laid out after the legacy ORDER / PICKING LIST form. */
export function OrderPickSheet({ data }: OrderPickSheetProps) {
  const { order } = data;
  const { lines, totals } = buildPickList(data.items);

  const salesperson =
    order.salespersonFirstName && order.salespersonLastName
      ? `${order.salespersonFirstName} ${order.salespersonLastName}`
      : order.salespersonCode;

  // Rendered inside the last line's tbody so TOTAL never lands on a page
  // by itself.
  const totalRows = (
    <>
      <tr>
        <td colSpan={7} className="pt-4">
          TOTAL:
        </td>
      </tr>
      <tr>
        <td />
        <td>{totals.qty}</td>
        <td />
        <td className="text-right whitespace-nowrap">
          {totals.weight.toFixed(2)} LB
        </td>
        <td className="text-right whitespace-nowrap">
          {totals.cube.toFixed(3)} CU FT
        </td>
        <td colSpan={2} className="pl-6 whitespace-nowrap">
          Total {formatCurrency(totals.amount)}
        </td>
      </tr>
    </>
  );

  return (
    <>
      {/* Print button — hidden on paper */}
      <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-white px-6 py-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Print Pick List
        </button>
      </div>

      {/* Printable content — fixed letter width (8.5in) so mobile sees
          the real paper proportions and scrolls horizontally if needed.
          Print overrides remove the width/border. */}
      <div className="overflow-x-auto bg-gray-100 px-4 py-6 print:overflow-visible print:bg-white print:p-0">
        <div className="print-sheet mx-auto min-h-264 w-204 bg-white p-12 font-mono text-xs! text-gray-900 shadow-sm ring-1 ring-gray-200 print:min-h-0 print:w-full print:p-0 print:pb-0! print:shadow-none print:ring-0">
          <h1 className="mb-2 text-center text-base tracking-widest">
            ORDER / PICKING LIST
          </h1>

          {/* Letterhead left, order identity right */}
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-3 font-sans">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mtc-logo.webp"
                alt="MTC Trading Co."
                className="h-auto w-10"
              />
              <div>
                <p className="text-sm leading-tight font-bold uppercase">
                  {COMPANY.legalName}
                </p>
                <p>
                  {COMPANY.address1}, {COMPANY.cityStateZip}
                </p>
                <p>
                  Tel: {COMPANY.phone} &middot; Fax: {COMPANY.fax}
                </p>
              </div>
            </div>
            <p>Order No: &nbsp;{order.orderNumber}</p>
          </div>

          {/* Customer (bill-to) left, Ship To right — DATE shares the
              Cust No. row and Ship To lines up with the customer name, as
              on the legacy form. */}
          <div className="mb-2 grid grid-cols-[5.5rem_1fr_5.5rem_1fr] gap-x-2">
            <span>Cust No.</span>
            <span>{order.customerNumber}</span>
            <span className="text-right">DATE:</span>
            <span>{formatDate(order.orderDate)}</span>
            <span />
            <div>
              <p>{order.customerName}</p>
              {order.billingAddress1 && <p>{order.billingAddress1}</p>}
              {order.billingAddress2 && <p>{order.billingAddress2}</p>}
              {order.billingCity && (
                <p className="mt-1">
                  {order.billingCity}, {order.billingStateCode}
                </p>
              )}
              {order.billingPostalCode && <p>{order.billingPostalCode}</p>}
              {order.mainPhone && <p className="mt-1">{order.mainPhone}</p>}
            </div>
            <span>Ship To:</span>
            <div>
              <p>{order.shipToName}</p>
              <p>{order.shipToAddress1}</p>
              {order.shipToAddress2 && <p>{order.shipToAddress2}</p>}
              <p className="mt-1">
                {order.shipToCity}, {order.shipToStateCode}
              </p>
              <p>{order.shipToPostalCode}</p>
            </div>
          </div>

          {/* Order terms strip — required date isn't tracked yet, so it
              prints as a write-in rule. */}
          <table className="mb-2 w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-1 font-normal">CUST P.O.#:</th>
                <th className="pb-1 font-normal">TERMS:</th>
                <th className="pb-1 font-normal">SALESPERSON:</th>
                <th className="pb-1 font-normal">SHIP VIA:</th>
                <th className="pb-1 font-normal">REQUIRED DATE:</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{order.customerPoReference}</td>
                <td>{order.termDescription ?? order.termCode}</td>
                <td>{salesperson}</td>
                <td>{order.freightTerm}</td>
                <td>
                  <Blank className="w-28" />
                </td>
              </tr>
            </tbody>
          </table>

          {order.shippingNote && (
            <p className="mb-2 whitespace-pre-wrap">
              NOTE: {order.shippingNote}
            </p>
          )}

          {/* Line items — two printed rows per line, spaced so a full page
              holds about 15 lines; thead repeats on each printed page. */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left align-top">
                <th className="w-12" />
                <th className="w-32 font-normal">QTY</th>
                <th className="font-normal">
                  ITEM NO
                  <br />
                  DESCRIPTION
                </th>
                <th className="w-24 text-right font-normal">WT.</th>
                <th className="w-28 text-right font-normal">C.F.</th>
                <th className="w-24 text-right font-normal">PRICE</th>
                <th className="w-28 pl-3 font-normal">CARTON</th>
              </tr>
            </thead>
            {lines.map((line, index) => {
              const unit = line.unitSoldBy ?? '';
              return (
                <tbody key={line.id} className="break-inside-avoid">
                  <tr>
                    <td className="pt-6"># {index + 1}</td>
                    {/* Pick-off blank beside the qty for the warehouse */}
                    <td className="pt-6 whitespace-nowrap">
                      <span className="inline-block w-16">
                        {line.qtyOrdered} {unit}
                      </span>
                      <Blank className="mr-4 w-12" />
                    </td>
                    <td className="pt-6">{line.itemNumber}</td>
                    <td className="pt-6 text-right">
                      {line.weight.toFixed(2)}
                    </td>
                    <td className="pt-6 text-right">{line.cube.toFixed(3)}</td>
                    <td className="pt-6 text-right">
                      {formatCurrency(Number(line.netPrice))}
                    </td>
                    <td className="pt-6 pl-3">
                      <Blank />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} />
                    <td colSpan={3}>{line.description}</td>
                    <td colSpan={2} className="pl-3 text-right">
                      {line.minQty && line.maxQty
                        ? `( ${line.minQty} ${unit} / ${line.maxQty} ${unit} )`
                        : null}
                    </td>
                  </tr>
                  {index === lines.length - 1 && totalRows}
                </tbody>
              );
            })}
            {lines.length === 0 && (
              <tbody className="break-inside-avoid">{totalRows}</tbody>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
