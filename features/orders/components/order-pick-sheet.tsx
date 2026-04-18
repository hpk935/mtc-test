'use client';

import Image from 'next/image';
import type { OrderPrintData } from '../queries';

interface OrderPickSheetProps {
  data: OrderPrintData;
}

export function OrderPickSheet({ data }: OrderPickSheetProps) {
  const { order, items } = data;

  return (
    <>
      {/* Print button — hidden on paper */}
      <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-white px-6 py-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          Print Pick Sheet
        </button>
      </div>

      {/* Printable content */}
      <div className="pick-sheet mx-auto max-w-200 p-6 print:max-w-none print:p-0">
        {/* Header */}
        <header className="mb-4 flex items-start justify-between border-b border-gray-300 pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mtc-logo.webp"
              alt="MTC Trading Co."
              className="h-auto w-10"
            />
            <div>
              <h1 className="text-xl leading-tight font-bold">
                Warehouse Pick Sheet
              </h1>
              <p className="text-sm text-gray-500">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>
              <span className="font-medium">Date:</span> {order.orderDate}
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="uppercase">{order.orderStatus}</span>
            </p>
            {order.customerPoReference && (
              <p>
                <span className="font-medium">PO#:</span>{' '}
                {order.customerPoReference}
              </p>
            )}
          </div>
        </header>

        {/* Customer & Ship To */}
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded border border-gray-200 p-3">
            <h2 className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Customer
            </h2>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-gray-500">#{order.customerNumber}</p>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <h2 className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Ship To
            </h2>
            <p className="font-medium">{order.shipToName}</p>
            <p>{order.shipToAddress1}</p>
            {order.shipToAddress2 && <p>{order.shipToAddress2}</p>}
            <p>
              {order.shipToCity}, {order.shipToStateCode}{' '}
              {order.shipToPostalCode}
            </p>
          </div>
        </div>

        {order.shippingNote && (
          <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-2 text-sm">
            <span className="font-semibold">Shipping Note:</span>{' '}
            {order.shippingNote}
          </div>
        )}

        {/* Summary bar */}
        <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
          <span>
            {items.length} line item{items.length !== 1 ? 's' : ''}
          </span>
          <span>
            Freight: <span className="font-medium">{order.freightTerm}</span>
          </span>
        </div>

        {/* Line Items Table */}
        <table className="mb-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="w-8 py-1.5 text-center font-semibold">#</th>
              <th className="py-1.5 font-semibold">Item / Description</th>
              <th className="py-1.5 text-center font-semibold">Unit</th>
              <th className="w-14 py-1.5 text-center font-semibold">Qty</th>
              <th className="w-25 py-1.5 text-center font-semibold">Picked</th>
              <th className="w-25 py-1.5 text-center font-semibold">
                Short / N/A
              </th>
              <th className="w-8 py-1.5 text-center font-semibold">
                <span className="sr-only">Check</span>
                &#10003;
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const weight =
                item.caseWeight && item.maxQty
                  ? (
                      (item.qtyOrdered * Number(item.caseWeight)) /
                      item.maxQty
                    ).toFixed(1)
                  : null;

              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} print:bg-transparent print:even:bg-gray-50`}>
                  {/* Row number */}
                  <td className="py-2 text-center text-gray-400">
                    {index + 1}
                  </td>

                  {/* Item info */}
                  <td className="py-2">
                    <span className="font-mono text-sm font-medium">
                      {item.itemNumber}
                    </span>
                    <br />
                    <span className="text-gray-600">
                      {item.description ?? '—'}
                    </span>
                    {weight && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({weight} lbs)
                      </span>
                    )}
                  </td>

                  {/* Unit */}
                  <td className="py-2 text-center text-gray-500">
                    {item.unitSoldBy ?? '—'}
                  </td>

                  {/* Qty Ordered */}
                  <td className="py-2 text-center text-lg font-bold">
                    {item.qtyOrdered}
                  </td>

                  {/* Picked — writable box for warehouse worker */}
                  <td className="py-2 text-center">
                    <div className="mx-auto h-7 w-16 rounded border-2 border-gray-400 bg-white" />
                  </td>

                  {/* Short / N/A — writable box for noting shortages */}
                  <td className="py-2 text-center">
                    <div className="mx-auto h-7 w-16 rounded border-2 border-dashed border-red-300 bg-white" />
                  </td>

                  {/* Checkmark box */}
                  <td className="py-2 text-center">
                    <div className="mx-auto flex size-6 items-center justify-center rounded border-2 border-gray-400 bg-white" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer: Totals & Sign-off */}
        <div className="grid break-inside-avoid grid-cols-2 gap-4">
          {/* Pick Summary */}
          <div className="rounded border border-gray-200 p-3 text-sm">
            <h3 className="mb-2 font-semibold">Pick Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Items:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Qty Ordered:</span>
                <span className="font-medium">
                  {items.reduce((sum, i) => sum + i.qtyOrdered, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-gray-500">All Items Confirmed:</span>
                <div className="flex size-5 items-center justify-center rounded border-2 border-gray-400 bg-white" />
              </div>
            </div>
          </div>

          {/* Sign-off */}
          <div className="rounded border border-gray-200 p-3 text-sm">
            <h3 className="mb-2 font-semibold">Picked By</h3>
            <div className="mt-6 mb-3 border-b border-gray-400" />
            <p className="text-gray-400">Name / Initials</p>
            <div className="mt-8 mb-3 border-b border-gray-400" />
            <p className="text-gray-400">Date &amp; Time</p>
          </div>
        </div>

        {/* Shortage Notes */}
        <div className="mt-4 break-inside-avoid rounded border border-red-200 p-3 text-sm">
          <h3 className="mb-1 font-semibold text-red-700">
            Shortage / Unavailable Notes
          </h3>
          <p className="mb-2 text-xs text-gray-400">
            List any items not available or with partial quantities. Note reason
            if known.
          </p>
          <div className="space-y-3">
            <div className="border-b border-gray-300 pb-3" />
            <div className="border-b border-gray-300 pb-3" />
            <div className="border-b border-gray-300 pb-3" />
          </div>
        </div>

        {/* Print footer */}
        <p className="mt-4 text-center text-xs text-gray-400 print:mt-2">
          Printed {new Date().toLocaleDateString()} &middot; Order #
          {order.orderNumber} &middot; {items.length} items
        </p>
      </div>
    </>
  );
}
